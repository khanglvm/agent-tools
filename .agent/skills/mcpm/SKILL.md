---
name: mcpm
description: Use mcpm (MCP Manager) CLI to manage MCP server configurations across AI coding agents. Triggers when user wants to install, sync, import, or manage MCP servers for Claude Code, Cursor, Windsurf, Antigravity, or other AI agents. Also triggers when helping MCP developers create mcp.json or shareable install commands. Keywords include MCP, server, install, sync, registry, import, agent configuration, mcp.json.
---

# mcpm - MCP Manager

CLI tool for managing MCP server configurations across AI coding agents (actively maintained).

## Core Concepts

- **Registry** (`~/.mcpm/registry.json`): Central store for all MCP server configs
- **Agents**: AI coding tools (Claude Code, Cursor, Windsurf, etc.) that use MCP servers
- **Sync**: Push configs from registry → agent config files
- **Import**: Pull existing configs from agent config files → registry

## Running mcpm

To start the interactive menu:
```bash
npx @khanglvm/mcpm
```

To install from a GitHub repository:
```bash
npx @khanglvm/mcpm https://github.com/author/mcp-server
```

## Common Tasks

| Task | Command |
|------|---------|
| Interactive menu | `npx @khanglvm/mcpm` |
| Install from GitHub | `npx @khanglvm/mcpm <repo-url>` |
| List saved servers from registry | `npx @khanglvm/mcpm list` |
| Sync MCP servers from registry to agents | `npx @khanglvm/mcpm sync` |
| Import MCP configs from agents to registry | `npx @khanglvm/mcpm import` |
| Check config drift | `npx @khanglvm/mcpm status` |
| Remove MCP server | `npx @khanglvm/mcpm remove <name>` |

---

## Helping MCP Developers

When a user wants to make their MCP server installable via mcpm, guide them to:

### Create `mcp.json` in Repository Root

**Simple format** — null values will prompt the user:
```jsonc
// mcp.json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/package-name"],
      "env": {
        "API_KEY": null,    // prompts user, masked, stored in keychain
        "API_URL": null     // prompts user
      }
    }
  }
}
```

**Extended format** — with descriptions and validation:
```jsonc
// mcp.json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/package-name"],
      "env": {
        "API_KEY": {
          "value": null,
          "description": "Your API key from the dashboard",
          "helpUrl": "https://example.com/api-keys",
          "required": true,
          "hidden": true
        },
        "API_URL": {
          "value": "https://api.example.com",
          "description": "API endpoint",
          "required": false
        }
      }
    }
  }
}
```

**HTTP/SSE transport** — for remote MCP servers:
```jsonc
// mcp.json
{
  "mcpServers": {
    "remote-api": {
      "url": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": {
          "value": null,
          "description": "Bearer token from dashboard",
          "helpUrl": "https://example.com/tokens",
          "hidden": true
        },
        "x-api-version": "2024-01"
      }
    }
  }
}
```

| Property | Description |
|----------|-------------|
| `value` | Default value, or `null` to prompt |
| `description` | Hint shown during setup |
| `helpUrl` | Link to documentation |
| `required` | Required field (default: `true`) |
| `hidden` | Mask input (auto for `key`, `secret`, `token`, `password`, `authorization`) |

### Generate Shareable Install Command

To share a pre-configured install, extend the repo URL with CLI modifiers:

```bash
# stdio transport with env vars
npx @khanglvm/mcpm https://github.com/author/server \
  --env:API_KEY=::description="Your API key"::helpUrl="https://example.com/keys"::hidden \
  --env:API_URL=https://api.example.com::optional \
  --note:"Get API key at https://example.com/settings"

# HTTP/SSE transport with headers
npx @khanglvm/mcpm https://github.com/author/remote-server \
  --header:Authorization=::description="Bearer token"::hidden \
  --header:x-api-key=::helpUrl="https://example.com/api-keys"
```

| Modifier | Description |
|----------|-------------|
| `--env:KEY=VALUE` | Pre-fill env var (stdio transport) |
| `--header:KEY=VALUE` | Pre-fill header (HTTP/SSE transport) |
| `--agent:<name>` | Pre-select agent(s) for installation |
| `--scope:global` / `--scope:project` | Pre-select installation scope (default: global) |
| `-y` / `--yes` | Automated install: validate, show tools, install to all agents |
| `::description="..."` | Show hint during setup |
| `::helpUrl="..."` | Show link (with security warning) |
| `::hidden` | Mask input field |
| `::optional` | Allow empty value |
| `--note:"..."` | Display message to user |

> **Auto mode (`-y`)**: When `-y` is used, mcpm will automatically validate the MCP server and install to all compatible agents without prompts. If any required credentials are missing (no value from `mcp.json` or CLI args), it falls back to normal interactive flow. This is success-or-fail with no retries.

> All modifiers are optional. `--env` applies to stdio servers, `--header` applies to HTTP/SSE servers. `--agent` can be repeated for multiple agents (e.g., `--agent:cursor --agent:claude-code`).

---

## Reference

### Registry Locations
- **Registry:** `~/.mcpm/registry.json`
- **Backups:** `~/.mcpm/backups/`
- **Keychain:** System keychain for secrets

### Supported Agents
Claude Code, Claude Desktop, Cursor, Windsurf, Antigravity, Cline, Roo Code, VS Code + Copilot, GitHub Copilot CLI, GitHub Copilot for JetBrains, JetBrains AI Assistant, Continue, Goose, OpenCode, Gemini CLI, Codex (CLI/Desktop), Amazon Q Developer, Amp, Factory Droid, Sourcegraph Cody, Zed
