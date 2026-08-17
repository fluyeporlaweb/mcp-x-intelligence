/** Structured error returned by every tool on failure. */
export interface ToolError {
  error: true;
  message: string;
  tool: string;
  status?: number;
}

/** Content block returned inside a tool result. */
export interface TextContent {
  type: "text";
  text: string;
}

/** Shape of a successful or errored tool result. */
export interface ToolResult {
  content: TextContent[];
  isError?: boolean;
}

export type TwitterProvider = "twitterapi" | "xquik";

/** Builds a standardised error result for any tool. */
export function errorResult(message: string, tool: string, status?: number): ToolResult {
  const payload: ToolError = { error: true, message, tool, status };
  console.error(`[${tool}]`, payload);
  return { content: [{ type: "text", text: JSON.stringify(payload) }], isError: true };
}

/**
 * Minimal HTTP client for twitterapi.io.
 * All requests authenticate via the x-api-key header.
 */
export class TwitterClient {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly provider: TwitterProvider = "twitterapi",
  ) {
    this.baseUrl = provider === "xquik" ? "https://xquik.com/api/v1" : "https://api.twitterapi.io";
  }

  /**
   * Issues a GET request and returns the parsed JSON body.
   * @param path - API path, e.g. "/twitter/tweet/advanced_search"
   * @param params - Query string parameters (undefined values are skipped)
   * @returns Parsed response body
   * @throws Error with `.status` attached if the response is not 2xx
   */
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    if (this.provider === "xquik") {
      return this.getFromXquik<T>(path, params);
    }

    const url = new URL(this.baseUrl + path);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-API-Key": this.apiKey,
        "Accept": "application/json; charset=utf-8",
      },
    });

    if (!response.ok) {
      throw Object.assign(
        new Error(`twitterapi.io error ${response.status}: ${response.statusText}`),
        { status: response.status },
      );
    }

    const text = await response.text();
    return JSON.parse(text) as T;
  }

  private async getFromXquik<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    switch (path) {
      case "/twitter/tweet/advanced_search":
        return this.requestXquik<T>("/x/tweets/search", {
          q: params?.query,
          queryType: params?.queryType,
          limit: params?.count,
        });
      case "/twitter/user/info":
        return this.getXquikUserInfo<T>(params?.userName);
      case "/twitter/user/last_tweets":
        return this.getXquikUserTweets<T>(params?.userName, params?.limit);
      case "/twitter/user/search":
        return this.requestXquik<T>("/x/users/search", {
          q: params?.query,
        });
      case "/twitter/trends":
        return this.requestXquik<T>("/trends", {
          woeid: params?.woeid,
          count: 50,
        });
      default:
        throw new Error(`Xquik provider does not support ${path}`);
    }
  }

  private async getXquikUserInfo<T>(username: string | number | undefined): Promise<T> {
    return this.requestXquik<T>(`/x/users/${this.requireUsername(username)}`);
  }

  private async getXquikUserTweets<T>(
    username: string | number | undefined,
    limit: string | number | undefined,
  ): Promise<T> {
    return this.requestXquik<T>(
      `/x/users/${this.requireUsername(username)}/tweets`,
      { limit },
    );
  }

  private requireUsername(username: string | number | undefined): string {
    if (!username) {
      throw new Error("Missing X username");
    }
    return encodeURIComponent(String(username).replace(/^@/, ""));
  }

  private async requestXquik<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": this.apiKey,
        "Accept": "application/json; charset=utf-8",
      },
    });

    if (!response.ok) {
      throw Object.assign(
        new Error(`Xquik error ${response.status}: ${response.statusText}`),
        { status: response.status },
      );
    }

    const text = await response.text();
    return JSON.parse(text) as T;
  }
}
