# Agent Tools

Monorepo for AI coding agent utilities.

## Packages

| Package | NPM | Description |
|---------|-----|-------------|
| [mcpm](./packages/cli) | `npx mcpm` | MCP server manager for 16+ agents |

## mcpm

Centralized MCP server configuration for AI coding agents.

```bash
# Interactive menu
npx mcpm

# CLI commands
npx mcpm list              # List servers in registry
npx mcpm add               # Add server interactively
npx mcpm sync              # Push to all agents
npx mcpm import            # Pull from agents
npx mcpm status            # Check sync status

# Install from GitHub URL
npx mcpm https://github.com/owner/repo

# Pre-configure environment variables
npx mcpm https://github.com/owner/repo \
  --env:API_KEY=your_key \
  --env:API_URL=https://api.example.com

# Add a note for guidance
npx mcpm https://github.com/owner/repo \
  --note:"Get API key from https://example.com/settings"
```

### Supported Agents

| Agent | Transport | Format |
|-------|-----------|--------|
| Claude Code, Cursor, Windsurf | stdio/http/sse | JSON |
| Antigravity, Cline, Roo Code | stdio/http/sse | JSON |
| VS Code + Copilot, GitHub Copilot CLI | stdio/http | JSON |
| Continue, Goose, OpenCode | stdio/http | YAML |
| Codex (OpenAI) | stdio | TOML |
| Gemini CLI, Factory Droid, Zed | varies | varies |

## Development

```bash
# Install dependencies
yarn install

# Build CLI package
cd packages/cli && yarn build

# Run locally
yarn run dev
```

## Publishing

Each package is published independently:

```bash
cd packages/cli
npm publish
```

For scoped publishing (e.g., `@lvmk/mcpm`), update `package.json` name accordingly.

## License

MIT
