# Agent Tools

Tools and utilities for AI coding agents.

## Packages

### mcpget

Install MCP server configurations to AI coding agents with one command.

```bash
npx mcpget
```

### Usage

```bash
# Interactive mode
npx mcpget

# Install from GitHub
npx mcpget https://github.com/modelcontextprotocol/servers

# Paste mode
npx mcpget --paste
```

#### Example

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

### Supported Agents

| Agent | Config Path | Wrapper Key |
|-------|-------------|-------------|
| Amp | `~/.config/amp/mcp.json` | `mcpServers` |
| Antigravity | `~/.gemini/antigravity/mcp_config.json` | `mcpServers` |
| Claude Code | `~/.claude/settings.json` | `mcpServers` |
| Cline | `~/.cline/mcp.json` | `mcpServers` |
| Codex (OpenAI) | `~/.codex/config.toml` | `mcp_servers` |
| Continue | `~/.continue/config.yaml` | `mcpServers` |
| Cursor | `~/.cursor/mcp.json` | `mcpServers` |
| Factory Droid | `~/.factory/mcp.json` | `mcpServers` |
| Gemini CLI | `~/.gemini/settings.json` | `mcpServers` |
| GitHub Copilot CLI | `~/.copilot/mcp-config.json` | `mcpServers` |
| Goose | `~/.config/goose/mcp.json` | `mcpServers` |
| OpenCode | `~/.config/opencode/oh-my-opencode.json` | `mcp` |
| Roo Code | `~/.roo/mcp.json` | `mcpServers` |
| VS Code + Copilot | `~/Library/.../Code/User/mcp.json` | `servers` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` |
| Zed | `~/.config/zed/settings.json` | `context_servers` |

## Development

```bash
# Install dependencies
pnpm install

# Build
cd packages/cli && pnpm run build

# Run locally
node packages/cli/dist/cli.js
```

## License

MIT
