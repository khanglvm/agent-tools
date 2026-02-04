# @khanglvm/mcpm

MCP Manager — Centralized MCP server configuration for AI coding agents.

## Features

- Auto-detects 20 AI coding agents
- Paste JSON/YAML MCP configs from READMEs
- Install from **GitHub, GitLab, Bitbucket, Codeberg**
- Keychain storage for secrets
- Sync registry to multiple agents at once
- Import existing servers from your agents

## Quick Usage

```bash
# Interactive mode
npx @khanglvm/mcpm

# CLI commands
npx @khanglvm/mcpm list              # List servers in registry
npx @khanglvm/mcpm add               # Add server interactively
npx @khanglvm/mcpm add <github-url>  # Add from GitHub URL
npx @khanglvm/mcpm sync              # Push registry to all agents
npx @khanglvm/mcpm import            # Import from agents
npx @khanglvm/mcpm status            # Check sync status
npx @khanglvm/mcpm remove <name>     # Remove from registry
```

## Options

```bash
npx @khanglvm/mcpm --paste           # Paste configuration mode
npx @khanglvm/mcpm --build           # Build step-by-step
npx @khanglvm/mcpm <repo-url>        # Install from GitHub/GitLab/Bitbucket/Codeberg
```

## For MCP Developers

Make your MCP server easy to install! Add `mcp.json` to your repository root (GitHub, GitLab, Bitbucket, or Codeberg):

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@scope/my-server"],
      "env": {
        "API_URL": null,
        "API_KEY": null
      }
    }
  }
}
```

Users can then install with: `npx @khanglvm/mcpm https://github.com/you/my-server`

**Share with pre-configured values:**
```bash
npx @khanglvm/mcpm https://github.com/you/my-server \
  --env:API_URL=https://api.example.com \
  --note:"Get API key from https://example.com/settings"
```

**Env value tips:**
- Use `null` → user will be prompted to enter value
- Use `"default"` → pre-filled but editable
- Name keys with `password`, `secret`, `key`, `token` → auto-masked & offered keychain storage

## Registry

All servers are stored in `~/.mcpm/registry.json` and can be synced to any agent.

| Location | Purpose |
|----------|---------|
| `~/.mcpm/registry.json` | Central server store |
| `~/.mcpm/backups/` | Automatic backups |

## Supported Agents

| Agent | Transport | Format |
|-------|-----------|--------|
| Amazon Q Developer | stdio | JSON |
| Amp | stdio | JSON |
| Antigravity | stdio, http, sse | JSON |
| Claude Code | stdio, http, sse | JSON |
| Claude Desktop | stdio | JSON |
| Cline | stdio, http, sse | JSON |
| Codex (CLI / Desktop) | stdio | TOML |
| Continue | stdio, http | YAML |
| Cursor | stdio, http, sse | JSON |
| Factory Droid | stdio, http | JSON |
| Gemini CLI | stdio, http, sse | JSON |
| GitHub Copilot CLI | stdio, http | JSON |
| Goose | stdio, http | YAML |
| JetBrains AI Assistant | stdio | XML |
| OpenCode | stdio, http | YAML |
| Roo Code | stdio, http, sse | JSON |
| Sourcegraph Cody | stdio | JSON |
| VS Code + Copilot | stdio, http | JSON |
| Windsurf | stdio, http, sse | JSON |
| Zed | stdio | JSON |

## License

MIT
