# @khanglvm/mcpm

MCP Manager — Centralized MCP server configuration for AI coding agents.

## Features

- Auto-detects 16 AI coding agents
- Paste JSON/YAML MCP configs from READMEs
- GitHub URL to extract MCP servers
- Keychain storage for secrets
- Sync registry to multiple agents at once
- Import existing servers from your agents

## Quick Start

```bash
# Interactive mode
npx @khanglvm/mcpm

# CLI commands
npx @khanglvm/mcpm list              # List servers in registry
npx @khanglvm/mcpm add               # Add server interactively  
npx @khanglvm/mcpm sync              # Push registry to all agents
npx @khanglvm/mcpm import            # Import from agents
npx @khanglvm/mcpm status            # Check sync status
npx @khanglvm/mcpm remove <name>     # Remove from registry
```

## Options

```bash
npx @khanglvm/mcpm --paste           # Paste configuration mode
npx @khanglvm/mcpm --build           # Build step-by-step
npx @khanglvm/mcpm <github-url>      # Install from GitHub
```

## Registry

All servers are stored in `~/.mcpm/registry.json` and can be synced to any agent.

| Location | Purpose |
|----------|---------|
| `~/.mcpm/registry.json` | Central server store |
| `~/.mcpm/backups/` | Automatic backups |

## Supported Agents

| Agent | Transport | Format |
|-------|-----------|--------|
| Claude Code | stdio, http, sse | JSON |
| Cursor | stdio, http, sse | JSON |
| Windsurf | stdio, http, sse | JSON |
| Antigravity | stdio, http, sse | JSON |
| Cline | stdio, http, sse | JSON |
| Roo Code | stdio, http, sse | JSON |
| VS Code + Copilot | stdio, http | JSON |
| GitHub Copilot CLI | stdio, http | JSON |
| Gemini CLI | stdio, http, sse | JSON |
| Continue | stdio, http | YAML |
| Goose | stdio, http | YAML |
| OpenCode | stdio, http | YAML |
| Codex (OpenAI) | stdio | TOML |
| Zed | stdio | JSON |
| Factory Droid | stdio, http | JSON |

## License

MIT
