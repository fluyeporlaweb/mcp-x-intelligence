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
  private readonly baseUrl = "https://twitterapi.io";

  constructor(private readonly apiKey: string) {}

  /**
   * Issues a GET request and returns the parsed JSON body.
   * @param path - API path, e.g. "/twitter/tweet/advanced_search"
   * @param params - Query string parameters (undefined values are skipped)
   * @returns Parsed response body
   * @throws Error with `.status` attached if the response is not 2xx
   */
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(this.baseUrl + path);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: { "x-api-key": this.apiKey },
    });

    if (!response.ok) {
      throw Object.assign(
        new Error(`twitterapi.io error ${response.status}: ${response.statusText}`),
        { status: response.status },
      );
    }

    return response.json() as Promise<T>;
  }
}
