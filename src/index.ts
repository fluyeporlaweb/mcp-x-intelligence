import { SEARCH_MANIFEST, searchViralContent } from "./tools/search.js";
import { ACCOUNT_MANIFEST, analyzeAccount } from "./tools/account.js";
import { TRENDS_MANIFEST, getTrendingTopics } from "./tools/trends.js";
import { NICHE_MANIFEST, getNicheLeaders } from "./tools/niche.js";
import type { ToolResult } from "./client.js";

export interface Env {
  TWITTERAPI_KEY: string;
  WORKER_SECRET: string;
}

const SERVER_NAME = "mcp-x-intelligence";
const SERVER_VERSION = "1.2.3";
const PROTOCOL_VERSION = "2024-11-05";

/** All tool manifests in registration order. */
const TOOLS_MANIFEST = [SEARCH_MANIFEST, ACCOUNT_MANIFEST, TRENDS_MANIFEST, NICHE_MANIFEST];

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-twitterapi-key, x-worker-secret, X-MCP-Worker-Secret",
};

// JSON-RPC 2.0 error codes
const ERR_PARSE = -32700;
const ERR_INVALID_REQUEST = -32600;
const ERR_METHOD_NOT_FOUND = -32601;
const ERR_INTERNAL = -32603;

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function rpcError(id: string | number | null | undefined, code: number, message: string): unknown {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

/** Dispatches a single JSON-RPC request to the appropriate MCP handler. */
async function handleRpcMessage(
  msg: JsonRpcRequest,
  apiKey: string,
): Promise<unknown> {
  const { method, id, params } = msg;

  // Notifications (no id) never return a response
  if (id === undefined) return null;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        },
      };

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: TOOLS_MANIFEST } };

    case "tools/call": {
      const toolName = params?.name as string | undefined;
      const toolArgs = (params?.arguments ?? {}) as Record<string, unknown>;

      if (!toolName) {
        return rpcError(id, ERR_INVALID_REQUEST, "Missing tools/call params.name");
      }

      let result: ToolResult;

      try {
        switch (toolName) {
          case "search_viral_content":
            result = await searchViralContent(toolArgs as unknown as Parameters<typeof searchViralContent>[0], apiKey);
            break;
          case "analyze_account":
            result = await analyzeAccount(toolArgs as unknown as Parameters<typeof analyzeAccount>[0], apiKey);
            break;
          case "get_trending_topics":
            result = await getTrendingTopics(toolArgs as unknown as Parameters<typeof getTrendingTopics>[0], apiKey);
            break;
          case "get_niche_leaders":
            result = await getNicheLeaders(toolArgs as unknown as Parameters<typeof getNicheLeaders>[0], apiKey);
            break;
          default:
            return rpcError(id, ERR_METHOD_NOT_FOUND, `Unknown tool: ${toolName}`);
        }
      } catch (error: unknown) {
        const e = error as { message?: string };
        console.error(`[tools/call/${toolName}]`, e);
        return rpcError(id, ERR_INTERNAL, e.message ?? "Internal error");
      }

      return { jsonrpc: "2.0", id, result };
    }

    default:
      return rpcError(id, ERR_METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse(rpcError(null, ERR_INVALID_REQUEST, "Only POST is supported"), 405);
    }

    const byokKey = request.headers.get("x-twitterapi-key");
    const workerSecret = request.headers.get("x-worker-secret")
      ?? request.headers.get("X-MCP-Worker-Secret");
    const isMcpize = (request.headers.get("user-agent") ?? "").toLowerCase().includes("mcpize");

    let apiKey: string;

    if (byokKey) {
      // BYOK: caller supplies their own twitterapi.io key
      apiKey = byokKey;
    } else if (env.WORKER_SECRET && workerSecret === env.WORKER_SECRET) {
      // Personal use: valid worker secret → use server's configured key
      apiKey = env.TWITTERAPI_KEY;
    } else if (isMcpize) {
      // MCPize gateway manages its own auth; use server's configured key
      apiKey = env.TWITTERAPI_KEY;
    } else {
      return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(rpcError(null, ERR_PARSE, "Parse error: invalid JSON"), 400);
    }

    // Batch requests
    if (Array.isArray(body)) {
      const responses = await Promise.all(
        body.map((msg) => handleRpcMessage(msg as JsonRpcRequest, apiKey)),
      );
      return jsonResponse(responses.filter((r) => r !== null));
    }

    const response = await handleRpcMessage(body as JsonRpcRequest, apiKey);
    return jsonResponse(response);
  },
} satisfies ExportedHandler<Env>;
