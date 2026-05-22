# mcp-x-intelligence

**X/Twitter research MCP for Claude, Cursor, Windsurf and any MCP-compatible AI agent.**

Search viral content, analyze accounts, track trends, and find niche leaders — all from your AI assistant. No posting. No DMs. Pure read-only research.

---

## What it does

`mcp-x-intelligence` exposes four research tools over the [Model Context Protocol (MCP)](https://modelcontextprotocol.io):

- **Search viral content** — find posts that are blowing up around any keyword
- **Analyze accounts** — deep engagement metrics, top posts, best posting times
- **Get trending topics** — real-time trends by country
- **Find niche leaders** — discover top creators in any space

This is a research tool. It never posts, replies, or modifies anything on X.

---

## Why not the official X API?

The official X API requires a developer account, a paid plan, and a complex OAuth setup. The cheapest tier that allows meaningful search access starts at **$200+/month**. For research and content strategy, that's overkill.

`mcp-x-intelligence` uses [twitterapi.io](https://twitterapi.io?ref=fluyeporla666) — a third-party API that provides the same data at a fraction of the cost, with a simple API key (no OAuth dance).

---

## Compatible clients

Works with any MCP-compatible AI agent:

| Client | Config file |
|--------|-------------|
| [Claude Desktop](https://claude.ai/download) | `claude_desktop_config.json` |
| [Claude Code](https://claude.ai/code) | `.claude/settings.json` |
| [Cursor](https://cursor.sh) | `.cursor/mcp.json` |
| [Windsurf](https://codeium.com/windsurf) | `mcp_config.json` |
| [Cline](https://github.com/cline/cline) | VS Code settings |
| [Codex CLI](https://github.com/openai/codex) | `~/.codex/config.yaml` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `~/.gemini/settings.json` |
| Any MCP client | Standard config |

---

## Quick start — BYOK

**1. Get your API key**

Sign up at [twitterapi.io](https://twitterapi.io?ref=fluyeporla666) and grab your key from the dashboard.

**2. Add to your MCP client**

Choose your client below and replace `tk_YOUR_KEY_HERE` with your actual key.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "x-intelligence": {
      "url": "https://mcp-x-intelligence.<your-account>.workers.dev",
      "headers": {
        "x-twitterapi-key": "tk_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Claude Code

```json
{
  "mcpServers": {
    "x-intelligence": {
      "url": "https://mcp-x-intelligence.<your-account>.workers.dev",
      "headers": {
        "x-twitterapi-key": "tk_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Cursor

Edit `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "x-intelligence": {
      "url": "https://mcp-x-intelligence.<your-account>.workers.dev",
      "headers": {
        "x-twitterapi-key": "tk_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "x-intelligence": {
      "url": "https://mcp-x-intelligence.<your-account>.workers.dev",
      "headers": {
        "x-twitterapi-key": "tk_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Cline (VS Code)

In VS Code settings (`settings.json`):

```json
{
  "cline.mcpServers": {
    "x-intelligence": {
      "url": "https://mcp-x-intelligence.<your-account>.workers.dev",
      "headers": {
        "x-twitterapi-key": "tk_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Gemini CLI

Edit `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "x-intelligence": {
      "url": "https://mcp-x-intelligence.<your-account>.workers.dev",
      "headers": {
        "x-twitterapi-key": "tk_YOUR_KEY_HERE"
      }
    }
  }
}
```

---

## Available tools

| Tool | Description |
|------|-------------|
| `search_viral_content` | Find viral posts by keyword with engagement filters (likes, retweets, time window) |
| `analyze_account` | Full account analysis: followers, engagement rate, top 5 posts, most active hours |
| `get_trending_topics` | Real-time trending topics by country (worldwide, USA, Spain, Mexico, Argentina, Colombia...) |
| `get_niche_leaders` | Find top accounts in any niche sorted by follower count |

### Tool parameters

**`search_viral_content`**
```
query         string   required  Search keyword or phrase
min_likes     number   optional  Minimum likes (default: 50)
min_retweets  number   optional  Minimum retweets (default: 0)
hours_back    number   optional  Hours back to search (default: 48)
limit         number   optional  Max results (default: 20)
```

**`analyze_account`**
```
username      string   required  X username without @
tweets_limit  number   optional  Tweets to analyze (default: 20)
```

**`get_trending_topics`**
```
woeid         number   optional  Where On Earth ID (default: 1 = Worldwide)
                                 23424977=USA · 23424950=Spain · 23424900=Mexico
                                 23424747=Argentina · 23424791=Colombia
```

**`get_niche_leaders`**
```
keyword       string   required  Niche or topic keyword
limit         number   optional  Max accounts (default: 10)
```

---

## Hosted version (no setup required)

> **MCPize listing coming soon.**
> Once listed, you'll be able to connect directly without self-hosting or an API key.

---

## Use cases

- **Find viral content before writing** — search what's already performing well in your niche before you write your next thread or post
- **Analyze competitor accounts** — understand their engagement rate, best-performing content, and optimal posting times
- **Discover trending topics before they peak** — catch trends early by monitoring real-time data by country
- **Find top creators in any niche** — build a list of influencers and voices worth following or collaborating with
- **AI-powered content strategy** — combine all four tools to let your AI agent build a complete content plan based on real data

---

## Self-hosting on Cloudflare Workers

You can deploy your own instance for free (Cloudflare Workers free tier is generous).

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- A Cloudflare account (free)
- A [twitterapi.io](https://twitterapi.io?ref=fluyeporla666) API key

### Deploy

```bash
# 1. Clone the repo
git clone https://github.com/fluyeporlaweb/mcp-x-intelligence.git
cd mcp-x-intelligence

# 2. Install dependencies
npm install

# 3. Authenticate with Cloudflare
wrangler login

# 4. Add your API key as a secret
wrangler secret put TWITTERAPI_KEY

# 5. Deploy
wrangler deploy
```

Your MCP server will be live at `https://mcp-x-intelligence.<your-account>.workers.dev`.

### Local development

Create `.dev.vars` in the root (already in `.gitignore`):

```
TWITTERAPI_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

### GitHub Actions CI/CD

Push to `main` auto-deploys via GitHub Actions. Add these secrets to your repository:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `TWITTERAPI_KEY` | Your twitterapi.io API key |

---

## BYOK (Bring Your Own Key)

Every request can include an `x-twitterapi-key` header. If present, it overrides the server's configured key. This allows:

- **Personal use** — deploy once, use with your own key
- **Multi-tenant** — each user supplies their own key

```bash
curl -X POST https://mcp-x-intelligence.<account>.workers.dev \
  -H "Content-Type: application/json" \
  -H "x-twitterapi-key: tk_YOUR_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## License

MIT — do whatever you want with it.

---

## Built by [@fluyeporlaweb](https://twitter.com/fluyeporlaweb)

If this saves you time, follow me on X. I share tools, AI workflows, and content strategy.
