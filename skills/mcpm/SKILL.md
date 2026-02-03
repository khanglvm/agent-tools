---
name: mcpm
description: Use mcpm (MCP Manager) CLI to manage MCP server configurations across AI coding agents. Triggers when user wants to install, sync, import, or manage MCP servers for Claude Code, Cursor, Windsurf, Antigravity, or other AI agents. Keywords include MCP, server, install, sync, registry, import, agent configuration.
---

# mcpm - MCP Manager

CLI tool for centralized MCP server configuration management across 16+ AI coding agents.

## Installation

```bash
npx mcpm
```

## Commands

| Command | Purpose |
|---------|---------|
| `mcpm` | Interactive menu |
| `mcpm list` | List servers in registry |
| `mcpm add` | Add server interactively |
| `mcpm sync` | Push registry to all agents |
| `mcpm import` | Pull servers from agents |
| `mcpm status` | Check sync status and drift |
| `mcpm remove <name>` | Remove from registry |

## Usage Patterns

### Add a new MCP server
```bash
mcpm add
# Or paste configuration
mcpm --paste
# Or from GitHub
mcpm https://github.com/modelcontextprotocol/servers
```

### Sync to all agents
```bash
mcpm sync              # Sync all servers
mcpm sync github       # Sync specific server
```

### Import existing servers
```bash
mcpm import            # Interactive import from agents
```

## Registry

All servers are stored in `~/.mcpm/registry.json` and can be synced to any agent.

- **Registry location:** `~/.mcpm/registry.json`
- **Backups:** `~/.mcpm/backups/`
- **Keychain:** Secrets stored securely in system keychain

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
| Continue | stdio, http | YAML |
| Goose | stdio, http | YAML |
| OpenCode | stdio, http | YAML |
| Codex (OpenAI) | stdio | TOML |
| Gemini CLI | stdio, http, sse | JSON |

## Conflict Resolution

When syncing or importing, mcpm handles conflicts with:
- **Skip:** Keep existing configuration
- **Replace:** Overwrite with registry version
- **Suffix:** Add `_2`, `_3` to avoid conflicts

## When to Use

- To install MCP servers across multiple AI agents at once
- To maintain consistent MCP configuration across tools
- To import existing agent configs into a central registry
- To detect configuration drift between registry and agents
