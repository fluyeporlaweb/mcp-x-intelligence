import { TwitterClient, type TwitterProvider, ToolResult, errorResult } from "../client.js";

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
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
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
 * @param apiKey - provider API key
 * @param provider - data provider to use for X reads
 * @returns List of trending topics with name, tweet_volume, and url
 */
export async function getTrendingTopics(
  args: TrendsArgs,
  apiKey: string,
  provider: TwitterProvider = "twitterapi",
): Promise<ToolResult> {
  const { woeid = 1 } = args;

  try {
    const client = new TwitterClient(apiKey, provider);

    const data = await client.get<Record<string, unknown>>("/twitter/trends", {
      woeid: String(woeid),
    });

    const rawTrends = (
      (data?.trends ?? (data?.data as Record<string, unknown>)?.trends ?? []) as Record<
        string,
        unknown
      >[]
    );

    const trends = rawTrends.map((item) => {
      const trend = (item.trend ?? item) as Record<string, unknown>;
      const target = trend.target as Record<string, unknown> | undefined;
      const query = (target?.query ?? trend.query ?? trend.name ?? "") as string;
      return {
        name: (trend.name ?? "") as string,
        tweet_volume: (trend.tweetVolume ?? trend.tweet_volume ?? null) as number | null,
        url: (trend.url ?? `https://twitter.com/search?q=${encodeURIComponent(query)}`) as string,
      };
    });

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
