import type { ToolResult } from "./client.js";

const DEFAULT_BASE_URL = "https://xquik.com";

export interface HermesTweetConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultBackend?: string;
}

export interface HermesSearchArgs {
  query: string;
  min_likes?: number;
  min_retweets?: number;
  hours_back?: number;
  limit?: number;
  search_backend?: string;
}

type JsonObject = Record<string, unknown>;

export interface NormalizedTweet {
  id: string | null;
  url: string;
  text: string;
  author_username: string;
  author_name: string;
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
  created_at: string;
}

export function shouldUseHermesTweetSearch(args: HermesSearchArgs, config?: HermesTweetConfig): boolean {
  const requested = (args.search_backend || config?.defaultBackend || "").trim().toLowerCase().replace(/_/g, "-");
  return requested === "hermes-tweet" || requested === "xquik";
}

export async function searchViralContentWithHermesTweet(
  args: HermesSearchArgs,
  config?: HermesTweetConfig,
): Promise<ToolResult> {
  const apiKey = config?.apiKey?.trim();
  if (!apiKey) {
    throw Object.assign(
      new Error("Hermes Tweet search requires HERMES_TWEET_API_KEY, XQUIK_API_KEY, or x-hermes-tweet-key"),
      { status: 401 },
    );
  }

  const { query, min_likes = 50, min_retweets = 0, hours_back = 48, limit = 20 } = args;
  const since = new Date(Date.now() - hours_back * 60 * 60 * 1000);
  const url = buildSearchUrl({
    baseUrl: config?.baseUrl,
    query: buildSearchQuery({ query, min_likes, min_retweets }),
    since,
    limit,
  });

  const response = await fetch(url, {
    headers: authHeaders(apiKey),
  });
  if (!response.ok) {
    throw Object.assign(
      new Error(`Hermes Tweet error ${response.status}: ${response.statusText}`),
      { status: response.status },
    );
  }

  const payload = await response.json();
  const results = normalizeTweets(payload)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            results,
            count: results.length,
            query,
            filters: { min_likes, min_retweets, hours_back },
            source: "hermes-tweet",
          },
          null,
          2,
        ),
      },
    ],
  };
}

export function buildSearchUrl({
  baseUrl,
  query,
  since,
  limit,
}: {
  baseUrl?: string;
  query: string;
  since: Date;
  limit: number;
}): string {
  const url = new URL("/api/v1/x/tweets/search", (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ""));
  url.searchParams.set("q", query);
  url.searchParams.set("queryType", "Latest");
  url.searchParams.set("limit", String(Math.max(1, Math.min(100, Math.trunc(limit)))));
  url.searchParams.set("sinceTime", since.toISOString());
  return url.toString();
}

export function buildSearchQuery({
  query,
  min_likes,
  min_retweets,
}: {
  query: string;
  min_likes: number;
  min_retweets: number;
}): string {
  const parts = [query.trim()];
  if (min_likes > 0) parts.push(`min_faves:${min_likes}`);
  if (min_retweets > 0) parts.push(`min_retweets:${min_retweets}`);
  return parts.filter(Boolean).join(" ");
}

export function normalizeTweets(payload: unknown): NormalizedTweet[] {
  return collectTweetCandidates(payload).map(normalizeTweet);
}

function authHeaders(apiKey: string): Record<string, string> {
  if (apiKey.toLowerCase().startsWith("bearer ")) {
    return { Authorization: apiKey, Accept: "application/json" };
  }
  if (apiKey.startsWith("xq_")) {
    return { "x-api-key": apiKey, Accept: "application/json" };
  }
  return { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
}

function collectTweetCandidates(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isObject(value)) return [];
  if (isTweetLike(value)) return [value];
  for (const key of ["tweets", "data", "results", "items", "statuses"]) {
    const nested = collectTweetCandidates(value[key]);
    if (nested.length > 0) return nested;
  }
  for (const nestedValue of Object.values(value)) {
    const nested = collectTweetCandidates(nestedValue);
    if (nested.length > 0) return nested;
  }
  return [];
}

function normalizeTweet(value: unknown): NormalizedTweet {
  if (!isObject(value)) return emptyTweet();
  const author = firstObject(value, "author", "user");
  const tweetId = firstString(value, ["tweet_id", "id", "id_str", "rest_id"]);
  const authorUsername =
    firstString(author, ["userName", "username", "screen_name"]) ||
    firstString(value, ["userScreenName", "username", "screen_name"]) ||
    "";
  return {
    id: tweetId,
    url: tweetId && authorUsername ? `https://twitter.com/${authorUsername}/status/${tweetId}` : "",
    text: firstString(value, ["source_full_text", "full_text", "text", "content"]) || "",
    author_username: authorUsername,
    author_name: firstString(author, ["name"]) || firstString(value, ["name"]) || "",
    likes: metricValue(value, ["likeCount", "like_count", "favorite_count", "likes"]),
    retweets: metricValue(value, ["retweetCount", "retweet_count", "retweets", "reposts"]),
    replies: metricValue(value, ["replyCount", "reply_count", "replies"]),
    bookmarks: metricValue(value, ["bookmarkCount", "bookmark_count", "bookmarks"]),
    created_at: firstString(value, ["createdAt", "created_at", "timestamp", "time"]) || "",
  };
}

function emptyTweet(): NormalizedTweet {
  return {
    id: null,
    url: "",
    text: "",
    author_username: "",
    author_name: "",
    likes: 0,
    retweets: 0,
    replies: 0,
    bookmarks: 0,
    created_at: "",
  };
}

function metricValue(value: JsonObject, keys: string[]): number {
  for (const source of [value, firstObject(value, "public_metrics", "metrics")]) {
    for (const key of keys) {
      const numberValue = valueToNumber(source[key]);
      if (numberValue !== null) return numberValue;
    }
  }
  return 0;
}

function isTweetLike(value: JsonObject): boolean {
  return Boolean(
    firstString(value, ["tweet_id", "id", "id_str", "rest_id"]) &&
      firstString(value, ["source_full_text", "full_text", "text", "content"]),
  );
}

function firstObject(source: JsonObject, ...keys: string[]): JsonObject {
  for (const key of keys) {
    const value = source[key];
    if (isObject(value)) return value;
  }
  return {};
}

function firstString(source: JsonObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "bigint") return String(value);
  }
  return null;
}

function valueToNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
