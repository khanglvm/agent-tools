# mcpm

MCP Manager — Centralized MCP server configuration for AI coding agents.

## Features

- 🔍 **Auto-detects** 16 AI coding agents
- 📋 **Paste** JSON/YAML MCP configs from READMEs
- 🔗 **GitHub** URL to extract MCP servers
- 🔐 **Keychain** storage for secrets
- ⚡ **Sync** registry to multiple agents at once
- 📥 **Import** existing servers from your agents

## Quick Start

```bash
# Interactive mode
npx mcpm

# CLI commands
npx mcpm list              # List servers in registry
npx mcpm add               # Add server interactively  
npx mcpm sync              # Push registry to all agents
npx mcpm import            # Import from agents
npx mcpm status            # Check sync status
npx mcpm remove <name>     # Remove from registry
```

## Options

```bash
npx mcpm --paste           # Paste configuration mode
npx mcpm --build           # Build step-by-step
npx mcpm <github-url>      # Install from GitHub
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
