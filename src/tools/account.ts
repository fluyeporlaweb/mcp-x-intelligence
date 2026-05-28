import { TwitterClient, ToolResult, errorResult } from "../client.js";

/** JSON Schema definition for the analyze_account tool. */
export const ACCOUNT_MANIFEST = {
  name: "analyze_account",
  description:
    "Full analysis of any X/Twitter account: follower stats, engagement rate, top 5 posts, and most active hours. Read-only.",
  inputSchema: {
    type: "object" as const,
    properties: {
      username: {
        type: "string",
        description: "X/Twitter username without the @ symbol",
      },
      tweets_limit: {
        type: "number",
        description: "Number of recent tweets to analyze (default: 20)",
      },
    },
    required: ["username"],
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
};

interface AccountArgs {
  username: string;
  tweets_limit?: number;
}

function getUtcHour(timestamp: string): number {
  return new Date(timestamp).getUTCHours();
}

/**
 * Full analysis of any X/Twitter account.
 *
 * @param args - Tool input arguments
 * @param args.username - X/Twitter username without @ symbol
 * @param args.tweets_limit - Number of recent tweets to analyze (default: 20)
 * @param apiKey - twitterapi.io API key
 * @returns Followers, engagement metrics, top 5 posts, most active hours
 */
export async function analyzeAccount(args: AccountArgs, apiKey: string): Promise<ToolResult> {
  const { username, tweets_limit = 20 } = args;

  try {
    const client = new TwitterClient(apiKey);

    const [userInfo, tweetsData] = await Promise.all([
      client.get<Record<string, unknown>>("/twitter/user/info", { userName: username }),
      client.get<Record<string, unknown>>("/twitter/user/last_tweets", {
        userName: username,
        limit: String(tweets_limit),
      }),
    ]);

    const user = (userInfo?.data ?? userInfo) as Record<string, unknown>;
    const rawTweets = (
      (tweetsData?.tweets ?? (tweetsData?.data as Record<string, unknown>)?.tweets ?? []) as Record<
        string,
        unknown
      >[]
    );

    const followers = (user?.followers ?? user?.followersCount ?? user?.followers_count ?? 0) as number;
    const following = (user?.following ?? user?.followingCount ?? user?.friends_count ?? 0) as number;

    const count = rawTweets.length || 1;
    const totalLikes = rawTweets.reduce(
      (s, t) => s + ((t.likeCount ?? t.favorite_count ?? 0) as number),
      0,
    );
    const totalRetweets = rawTweets.reduce(
      (s, t) => s + ((t.retweetCount ?? t.retweet_count ?? 0) as number),
      0,
    );
    const totalReplies = rawTweets.reduce(
      (s, t) => s + ((t.replyCount ?? t.reply_count ?? 0) as number),
      0,
    );

    const avg_likes = Math.round(totalLikes / count);
    const avg_retweets = Math.round(totalRetweets / count);
    const avg_replies = Math.round(totalReplies / count);
    const engagement_rate =
      followers > 0
        ? parseFloat((((avg_likes + avg_retweets + avg_replies) / followers) * 100).toFixed(4))
        : 0;

    const sortedTweets = [...rawTweets].sort(
      (a, b) =>
        ((b.likeCount ?? b.favorite_count ?? 0) as number) -
        ((a.likeCount ?? a.favorite_count ?? 0) as number),
    );

    const top_5_posts = sortedTweets.slice(0, 5).map((tweet) => {
      const tweetId = (tweet.id ?? tweet.id_str ?? "") as string;
      return {
        url: `https://twitter.com/${username}/status/${tweetId}`,
        text: (tweet.text ?? tweet.full_text ?? "") as string,
        likes: (tweet.likeCount ?? tweet.favorite_count ?? 0) as number,
      };
    });

    const hourCounts: Record<number, number> = {};
    for (const tweet of sortedTweets) {
      const ts = (tweet.createdAt ?? tweet.created_at) as string | undefined;
      if (ts) {
        const hour = getUtcHour(ts);
        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
      }
    }

    const most_active_hours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, c]) => ({
        hour: parseInt(hour),
        count: c,
        label: `${hour.toString().padStart(2, "0")}:00 UTC`,
      }));

    const result = {
      username,
      name: (user?.name ?? "") as string,
      followers,
      following,
      verified: (user?.isVerified ?? user?.verified ?? false) as boolean,
      bio: (user?.description ?? user?.bio ?? "") as string,
      created_at: (user?.createdAt ?? user?.created_at ?? "") as string,
      metrics: { avg_likes, avg_retweets, avg_replies, engagement_rate },
      top_5_posts,
      most_active_hours,
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return errorResult(err.message ?? "Unknown error", "analyze_account", err.status);
  }
}
