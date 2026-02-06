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

To help users with **mcpm**, read these files in order:

| File | Purpose |
|------|---------|
| [`.agent/skills/mcpm/SKILL.md`](./.agent/skills/mcpm/SKILL.md) | How to use mcpm CLI, extract config from READMEs when `mcp.json` is missing |
| [`packages/cli/README.md`](./packages/cli/README.md) | Complete CLI reference, supported agents, and configuration formats |

No need to read the codebase — these two files contain all the knowledge needed to assist users.

## License

MIT
