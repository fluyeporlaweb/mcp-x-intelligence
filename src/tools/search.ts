import { TwitterClient, ToolResult, errorResult } from "../client.js";

/** JSON Schema definition for the search_viral_content tool. */
export const SEARCH_MANIFEST = {
  name: "search_viral_content",
  description:
    "Find viral posts on X/Twitter by keyword with engagement filters. Returns results sorted by likes descending. Read-only — no posting or account access.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search keyword or phrase",
      },
      min_likes: {
        type: "number",
        description: "Minimum likes threshold (default: 50)",
      },
      min_retweets: {
        type: "number",
        description: "Minimum retweets threshold (default: 0)",
      },
      hours_back: {
        type: "number",
        description: "How many hours back to search (default: 48)",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 20)",
      },
    },
    required: ["query"],
  },
};

interface SearchArgs {
  query: string;
  min_likes?: number;
  min_retweets?: number;
  hours_back?: number;
  limit?: number;
}

/**
 * Find viral posts on X/Twitter by keyword with engagement filters.
 *
 * @param args - Tool input arguments
 * @param args.query - Search keyword or phrase
 * @param args.min_likes - Minimum likes threshold (default: 50)
 * @param args.min_retweets - Minimum retweets threshold (default: 0)
 * @param args.hours_back - How many hours back to search (default: 48)
 * @param args.limit - Maximum number of results (default: 20)
 * @param apiKey - twitterapi.io API key
 * @returns Array of viral tweets sorted by likes descending
 */
export async function searchViralContent(args: SearchArgs, apiKey: string): Promise<ToolResult> {
  const { query, min_likes = 50, min_retweets = 0, hours_back = 48, limit = 20 } = args;

  try {
    const client = new TwitterClient(apiKey);

    const since = new Date(Date.now() - hours_back * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split("T")[0];

    let searchQuery = `${query} min_faves:${min_likes}`;
    if (min_retweets > 0) searchQuery += ` min_retweets:${min_retweets}`;
    searchQuery += ` since:${sinceStr}`;

    const data = await client.get<Record<string, unknown>>("/twitter/tweet/advanced_search", {
      query: searchQuery,
      queryType: "Latest",
      count: String(limit),
    });

    const rawTweets = (
      (data?.tweets ?? (data?.data as Record<string, unknown>)?.tweets ?? []) as Record<string, unknown>[]
    );

    const results = rawTweets
      .map((tweet) => {
        const author = tweet.author as Record<string, unknown> | undefined;
        const user = tweet.user as Record<string, unknown> | undefined;
        const authorUsername = (author?.userName ?? user?.screen_name ?? "") as string;
        const tweetId = (tweet.id ?? tweet.id_str ?? "") as string;
        return {
          id: tweetId,
          url: `https://twitter.com/${authorUsername}/status/${tweetId}`,
          text: (tweet.text ?? tweet.full_text ?? "") as string,
          author_username: authorUsername,
          author_name: ((author?.name ?? user?.name ?? "") as string),
          likes: (tweet.likeCount ?? tweet.favorite_count ?? 0) as number,
          retweets: (tweet.retweetCount ?? tweet.retweet_count ?? 0) as number,
          replies: (tweet.replyCount ?? tweet.reply_count ?? 0) as number,
          bookmarks: (tweet.bookmarkCount ?? 0) as number,
          created_at: (tweet.createdAt ?? tweet.created_at ?? "") as string,
        };
      })
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { results, count: results.length, query, filters: { min_likes, min_retweets, hours_back } },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return errorResult(err.message ?? "Unknown error", "search_viral_content", err.status);
  }
}
