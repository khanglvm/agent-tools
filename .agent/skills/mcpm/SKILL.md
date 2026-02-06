---
name: mcpm
description: Use mcpm (MCP Manager) CLI to manage MCP server configurations across AI coding agents. Triggers when user wants to install, sync, import, or manage MCP servers for Claude Code, Cursor, Windsurf, Antigravity, or other AI agents. Also triggers when helping MCP developers create mcp.json or shareable install commands, or when extracting MCP config from README files. Keywords include MCP, server, install, sync, registry, import, agent configuration, mcp.json, README extraction.
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
| `-a` / `--agent:all` | Auto-select all compatible agents |
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

## Extracting Config from README (No mcp.json)

Most MCP servers on GitHub/GitLab don't have an `mcp.json` file. When this happens, **extract the configuration from the README** and construct the install command manually.

### Step-by-Step Workflow

1. **Check for mcp.json first** — If the repo has `mcp.json`, use it directly
2. **Read the README** — Look for configuration examples in the documentation
3. **Identify the transport type** — stdio (command/args) or HTTP/SSE (url/headers)
4. **Extract required credentials** — Find environment variables or headers needed
5. **Construct the install command** — Use `--env:` or `--header:` modifiers

### Common README Patterns to Look For

#### Pattern 1: Claude Desktop Config Example
Most READMEs show a Claude Desktop configuration block:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/package-name"],
      "env": {
        "API_KEY": "your-api-key",
        "BASE_URL": "https://api.example.com"
      }
    }
  }
}
```

**Extract and convert to:**
```bash
npx @khanglvm/mcpm https://github.com/author/server \
  --env:API_KEY=::description="Your API key"::hidden \
  --env:BASE_URL=https://api.example.com
```

#### Pattern 2: Environment Variables Section
READMEs often list required environment variables in a table or list:

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Your API key from dashboard | Yes |
| `API_URL` | Custom API endpoint | No |

**Extract and convert to:**
```bash
npx @khanglvm/mcpm https://github.com/author/server \
  --env:API_KEY=::description="Your API key from dashboard"::hidden \
  --env:API_URL=::optional
```

#### Pattern 3: npx/uvx Command
Some READMEs show the direct execution command:
```bash
npx -y @scope/mcp-server
# or
uvx mcp-server-name
```

**Extract and use as the base command** — the mcpm CLI will detect this from the repo.

#### Pattern 4: Docker/Remote URL
For HTTP/SSE servers, look for URLs:
```
MCP endpoint: https://mcp.example.com/sse
Required headers: Authorization: Bearer <token>
```

**Extract and convert to:**
```bash
npx @khanglvm/mcpm https://github.com/author/server \
  --header:Authorization=::description="Bearer token"::hidden
```

### Extraction Checklist

When reading a README, collect:

- [ ] **Server name** — Usually the repo name or package name
- [ ] **Transport type** — `command`/`args` (stdio) or `url` (HTTP/SSE)
- [ ] **Package identifier** — npm package (`@scope/name`) or Python package (for uvx)
- [ ] **Required env vars** — Mark as `::hidden` if they contain secrets
- [ ] **Optional env vars** — Mark as `::optional`
- [ ] **Headers** — For HTTP/SSE transport
- [ ] **Help URLs** — Links to get API keys or documentation

### Example: Full Extraction

Given this README section:
```markdown
## Configuration

Add to your Claude Desktop config:

\`\`\`json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@khanglvm/jira-mcp"],
      "env": {
        "JIRA_BASE_URL": "https://your-jira.atlassian.net",
        "JIRA_USERNAME": "your-email@example.com",
        "JIRA_PASSWORD": "your-api-token"
      }
    }
  }
}
\`\`\`

Get your API token from: https://id.atlassian.com/manage-profile/security/api-tokens
```

**Construct this install command:**
```bash
npx @khanglvm/mcpm https://github.com/khanglvm/jira-mcp \
  --env:JIRA_BASE_URL=::description="Jira server URL (e.g., https://company.atlassian.net)" \
  --env:JIRA_USERNAME=::description="Jira username or email" \
  --env:JIRA_PASSWORD=::description="API token"::helpUrl="https://id.atlassian.com/manage-profile/security/api-tokens"::hidden
```

### Tips for AI Agents

1. **Auto-detect secrets** — Variables with `key`, `token`, `password`, `secret`, `auth` in the name should be `::hidden`
2. **Preserve defaults** — If README shows a default value, include it in the command
3. **Add helpful descriptions** — Use the README's descriptions to populate `::description`
4. **Link to help docs** — If README mentions where to get credentials, use `::helpUrl`
5. **Check package.json** — The `bin` field shows the actual command to run

### Using Inline Config (When Repo Has No mcp.json)

**CRITICAL**: If a repository does NOT have `mcp.json`, you CANNOT just pass the GitHub URL — mcpm won't know the config. Instead, **construct the config from the README and pass it as inline JSON**.

#### Step 1: Extract config from README
Find the MCP config block in the README (see patterns above).

#### Step 2: Convert to inline JSON command
Pass the complete JSON config directly to mcpm:

```bash
# Instead of this (FAILS without mcp.json):
npx @khanglvm/mcpm https://github.com/author/server --env:API_KEY=xxx

# Do this (WORKS - inline config):
npx @khanglvm/mcpm '{"server-name":{"command":"npx","args":["-y","package-name"],"env":{"API_KEY":"xxx","API_URL":"https://api.example.com"}}}' -a -y
```

#### Full Example: Outline MCP Server (no mcp.json)

From README, the config is:
```json
{
  "outline": {
    "command": "npx",
    "args": ["-y", "outline-mcp-server-stdio@latest"],
    "env": {
      "OUTLINE_API_KEY": "<key>",
      "OUTLINE_API_URL": "https://app.getoutline.com/api"
    }
  }
}
```

Convert to inline command:
```bash
npx @khanglvm/mcpm '{"outline":{"command":"npx","args":["-y","outline-mcp-server-stdio@latest"],"env":{"OUTLINE_API_KEY":"user-provided-key","OUTLINE_API_URL":"https://handbook.example.com/api"}}}' -a -y
```

> **Key insight**: The inline JSON replaces the need for mcp.json. All env values must be pre-filled with actual values for `-y` (auto mode) to work.

---

## Reference

### Registry Locations
- **Registry:** `~/.mcpm/registry.json`
- **Backups:** `~/.mcpm/backups/`
- **Keychain:** System keychain for secrets

### Supported Agents
Claude Code, Claude Desktop, Cursor, Windsurf, Antigravity, Cline, Roo Code, VS Code + Copilot, GitHub Copilot CLI, GitHub Copilot for JetBrains, JetBrains AI Assistant, Continue, Goose, OpenCode, Gemini CLI, Codex (CLI/Desktop), Amazon Q Developer, Amp, Factory Droid, Sourcegraph Cody, Zed
