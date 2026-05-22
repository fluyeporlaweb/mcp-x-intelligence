import { TwitterClient, ToolResult, errorResult } from "../client.js";

/** JSON Schema definition for the get_trending_topics tool. */
export const TRENDS_MANIFEST = {
  name: "get_trending_topics",
  description:
    "Get trending topics on X/Twitter by country using WOEID (Where On Earth ID). Common WOEIDs: 1=Worldwide, 23424977=USA, 23424950=Spain, 23424900=Mexico, 23424747=Argentina, 23424791=Colombia.",
  inputSchema: {
    type: "object" as const,
    properties: {
      woeid: {
        type: "number",
        description:
          "Where On Earth ID. 1=Worldwide (default), 23424977=USA, 23424950=Spain, 23424900=Mexico, 23424747=Argentina, 23424791=Colombia",
      },
    },
    required: [],
  },
};

interface TrendsArgs {
  woeid?: number;
}

/**
 * Get trending topics on X/Twitter by geographic location.
 *
 * @param args - Tool input arguments
 * @param args.woeid - Where On Earth ID (default: 1 = Worldwide)
 * @param apiKey - twitterapi.io API key
 * @returns List of trending topics with name, tweet_volume, and url
 */
export async function getTrendingTopics(args: TrendsArgs, apiKey: string): Promise<ToolResult> {
  const { woeid = 1 } = args;

  try {
    const client = new TwitterClient(apiKey);

    const data = await client.get<Record<string, unknown>>("/twitter/trends", {
      woeid: String(woeid),
    });

    const rawTrends = (
      (data?.trends ?? (data?.data as Record<string, unknown>)?.trends ?? []) as Record<
        string,
        unknown
      >[]
    );

    const trends = rawTrends.map((trend) => ({
      name: (trend.name ?? trend.query ?? "") as string,
      tweet_volume: (trend.tweetVolume ?? trend.tweet_volume ?? null) as number | null,
      url:
        (trend.url as string | undefined) ??
        `https://twitter.com/search?q=${encodeURIComponent((trend.name ?? "") as string)}`,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ trends, count: trends.length, woeid }, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return errorResult(err.message ?? "Unknown error", "get_trending_topics", err.status);
  }
}
