# mcp-x-intelligence — X/Twitter Research MCP for Claude, Cursor & AI Agents

<p align="center">
  <img src="assets/logo.png" alt="mcp-x-intelligence logo" width="120">
</p>

Search viral content, analyze X accounts, track trending topics and discover niche leaders — directly from Claude, Cursor, Windsurf or any MCP-compatible AI agent. Powered by [twitterapi.io](https://twitterapi.io?ref=fluyeporla666). No posting. No DMs. Pure read-only research.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Workers-orange)](https://workers.cloudflare.com)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)
[![smithery badge](https://smithery.ai/badge/fluyeporlaweb/mcp-x-intelligence)](https://smithery.ai/servers/fluyeporlaweb/mcp-x-intelligence)

---

## What it does — 4 X Research Tools for AI Agents

| Tool | What it does | Example prompt |
|------|-------------|----------------|
| `search_viral_content` | Find top posts by keyword with engagement filters (likes, retweets, time window) | *"Find the most viral posts about AI agents in the last 48h"* |
| `analyze_account` | Full profile analysis: followers, top posts, engagement rate, active hours | *"Analyze @fluyeporlaweb and tell me their best content strategy"* |
| `get_trending_topics` | Trending topics by country in real time | *"What's trending in Spain and Mexico right now?"* |
| `get_niche_leaders` | Top accounts in any niche sorted by follower count | *"Who are the top 10 AI tool creators on X?"* |

---

## Compatible with Every Major MCP Client

Claude Desktop · Claude Code · Cursor · Windsurf · Cline · Codex CLI · Gemini CLI · any MCP-compatible AI agent

---

## Quick Start

### Option 1 — Hosted Version via MCPize (No Setup Required)

**Recommended for non-technical users.** No API key, no Node.js, nothing to install. Just connect and start researching.

→ **[Use mcp-x-intelligence on MCPize](https://mcpize.com/mcp/mcp-x-intelligence)**

| Plan | Calls/month | Price |
|------|-------------|-------|
| Free | 50 | Free |
| Pro | 1,000 | $9/mo |

---

### Option 2 — BYOK: Bring Your Own twitterapi.io Key (Free)

Connect directly to our hosted endpoint using your own API key. No server setup needed — we host the MCP server for you.

**Step 1 — Get a free twitterapi.io API key**

Sign up at [twitterapi.io](https://twitterapi.io?ref=fluyeporla666) and copy your key from the dashboard.

**Step 2 — Add the MCP server to your AI client config**

Pick your client below and replace `YOUR_TWITTERAPI_KEY` with your actual key.

#### Claude Desktop on Windows

Config file: `%LOCALAPPDATA%\Packages\Claude_...\LocalCache\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "x-intelligence": {
      "command": "cmd",
      "args": [
        "/c", "npx", "-y", "mcp-remote",
        "https://mcp-x-intelligence.fluyeporlaweb.workers.dev/mcp",
        "--header", "x-twitterapi-key: YOUR_TWITTERAPI_KEY"
      ]
    }
  }
}
```

#### Claude Desktop on Mac

Config file: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "x-intelligence": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp-x-intelligence.fluyeporlaweb.workers.dev/mcp",
        "--header", "x-twitterapi-key: YOUR_TWITTERAPI_KEY"
      ]
    }
  }
}
```

#### Cursor / Windsurf / Cline

Same config as Mac above. Add it to your MCP settings JSON file.

**Step 3 — Restart your AI client and verify**

Ask your AI assistant:
> *"What tools do you have available?"*

You should see the `x-intelligence` tools listed.

---

## Tool Parameters Reference

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

## Use Cases for X Research with AI

- **Content creators** — Find what's going viral in your niche before writing your next thread or post
- **Marketers** — Competitive account analysis and real-time trend monitoring at zero cost
- **Developers** — Build research pipelines and content strategy tools backed by live X data
- **Researchers** — Social media data collection without the official X API price tag

---

## Example Prompts to Try

- *"Search for viral posts about Claude MCP from the last 48 hours with over 100 likes"*
- *"Analyze the account @OpenAI — what are their top 5 posts and when do they usually post?"*
- *"What's trending in Mexico and Argentina right now?"*
- *"Find the top 10 accounts in the AI tools niche on X"*

---

## Why Not the Official X API?

The official X API uses pay-per-use credit pricing —
no monthly minimums. However it still requires:
a developer account approval process, OAuth 2.0 authentication setup,
and custom integration work to connect with AI agents like Claude.

mcp-x-intelligence removes all that friction.
One API key from twitterapi.io, one config block, done.

| | Official X API | mcp-x-intelligence |
|---|---|---|
| Pricing model | Pay-per-use credits (no minimum) | Free (BYOK) or $9/mo hosted |
| Setup time | Developer account approval required | Minutes |
| MCP native | No — requires custom integration | Yes — plug and play |
| Works with Claude | Manual integration | Native |
| Auth complexity | OAuth 2.0 setup required | Single API key |

---

## Built by

[@fluyeporlaweb](https://x.com/fluyeporlaweb) — AI tools, automation and developer resources in Spanish.

Join the community: [t.me/fluyeporlaweb](https://t.me/fluyeporlaweb)

Listed on [Smithery](https://smithery.ai/server/fluyeporlaweb/mcp-x-intelligence)

---

## License

MIT — do whatever you want with it.
