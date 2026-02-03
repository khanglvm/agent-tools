# Agent Tools

Tools and utilities for AI coding agents.

## Packages

### mcpget

Install MCP server configurations to AI coding agents with one command.

**Features:**
- 🔍 Auto-detects 14+ AI coding agents (Claude Code, Cursor, Windsurf, etc.)
- 📋 Paste JSON/YAML MCP configs from READMEs
- 🔗 GitHub URL extraction from repos
- 🔐 Environment variables with password masking
- ⚠️ Security warnings before installation
- 💾 Automatic backups before overwriting

**Use when:**
- "Install MCP servers to my agents"
- "Add GitHub MCP to Cursor"
- "Configure filesystem access for Claude Code"

**Installation:**
```bash
npx mcpget
```

**Usage:**
```bash
# Interactive mode
npx mcpget

# Install from GitHub
npx mcpget https://github.com/modelcontextprotocol/servers

# Paste mode
npx mcpget --paste
```

**Supported Agents:**
| Agent | Config Path |
|-------|-------------|
| Claude Code | `~/.claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| VS Code | `~/.vscode/mcp.json` |
| Zed | `~/.config/zed/settings.json` |
| Antigravity | `~/.gemini/antigravity/config/mcp.json` |
| + 10 more... | |

**Example:**
```
$ npx mcpget https://github.com/modelcontextprotocol/servers

┌   mcpget 
│
●  Detected 14 agent(s)
●  Fetching from modelcontextprotocol/servers...
◇  Found 4 server(s): filesystem, git, github, postgres
│
◆  Select tools to configure:
│  ◼ Claude Code
│  ◼ Cursor
│  ◻ VS Code
│
◇  Backing up existing configs
◇  Installing servers
│
●  Configuration complete!
└
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run CLI locally
cd packages/cli
node dist/cli.js
```

## License

MIT
