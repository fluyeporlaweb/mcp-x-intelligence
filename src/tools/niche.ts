import { TwitterClient, type TwitterProvider, ToolResult, errorResult } from "../client.js";

/** JSON Schema definition for the get_niche_leaders tool. */
export const NICHE_MANIFEST = {
  name: "get_niche_leaders",
  description:
    "Find the top X/Twitter accounts in any niche or topic, sorted by follower count. Great for discovering influencers and key voices in a space.",
  inputSchema: {
    type: "object" as const,
    properties: {
      keyword: {
        type: "string",
        description: "Niche or topic keyword to search for accounts",
      },
      limit: {
        type: "number",
        description: "Maximum number of accounts to return (default: 10)",
      },
    },
    required: ["keyword"],
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
};

interface NicheArgs {
  keyword: string;
  limit?: number;
}

/**
 * Find top X/Twitter accounts in any niche, sorted by follower count.
 *
 * @param args - Tool input arguments
 * @param args.keyword - Niche or topic keyword to search
 * @param args.limit - Maximum results to return (default: 10)
 * @param apiKey - provider API key
 * @param provider - data provider to use for X reads
 * @returns List of accounts sorted by followers descending with profile details
 */
export async function getNicheLeaders(
  args: NicheArgs,
  apiKey: string,
  provider: TwitterProvider = "twitterapi",
): Promise<ToolResult> {
  const { keyword, limit = 10 } = args;

  try {
    const client = new TwitterClient(apiKey, provider);

    const requestParams = {
      query: keyword,
      count: String(limit),
    };

    const data = await client.get<Record<string, unknown>>("/twitter/user/search", requestParams);

    const rawUsers = (
      (data?.users ?? (data?.data as Record<string, unknown>)?.users ?? []) as Record<
        string,
        unknown
      >[]
    );

    const leaders = rawUsers
      .map((user) => {
        const handle = (user.userName ?? user.username ?? user.screen_name ?? "") as string;
        return {
          username: handle,
          name: (user.name ?? "") as string,
          followers: (user.followers ?? user.followersCount ?? user.followers_count ?? 0) as number,
          verified: (user.isVerified ?? user.verified ?? false) as boolean,
          bio: ((user.description ?? user.bio ?? "") as string).slice(0, 160),
          profile_url: `https://twitter.com/${handle}`,
        };
      })
      .sort((a, b) => b.followers - a.followers)
      .slice(0, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ leaders, count: leaders.length, keyword }, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return errorResult(err.message ?? "Unknown error", "get_niche_leaders", err.status);
  }
}
