# Agent Tools

Monorepo for AI coding agent utilities.

## Packages

| Package | NPM | Description |
|---------|-----|-------------|
| [mcpm](./packages/cli) | `npx @khanglvm/mcpm` | MCP server manager |

## Quick Start

```bash
npx @khanglvm/mcpm
```

See [packages/cli/README.md](./packages/cli/README.md) for full documentation.

## Development

```bash
yarn install
cd packages/cli && yarn build
yarn run dev
```


## For AI Agents 🤖

> ⚠️ **IMPORTANT**: Before helping users install MCP servers, you MUST read the skill file first. It contains the patterns and examples for extracting MCP configuration from README files.

**Required Reading (in order):**

| Step | File | What You'll Learn |
|------|------|-------------------|
| 1️⃣ | [`.agent/skills/mcpm/SKILL.md`](https://github.com/khanglvm/agent-tools/blob/main/.agent/skills/mcpm/SKILL.md) | **README patterns** for extracting config, inline JSON mode, when to use each command format |
| 2️⃣ | [`packages/cli/README.md`](https://github.com/khanglvm/agent-tools/blob/main/packages/cli/README.md) | CLI reference, supported agents, all configuration options |

**Workflow:** Use [`/install-mcp-server`](./.agent/workflows/install-mcp-server.md) for the complete installation flow.

## License

MIT
