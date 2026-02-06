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

To help users install MCP servers, read these files first:

| File | Purpose |
|------|---------|
| [`.agent/skills/mcpm/SKILL.md`](./.agent/skills/mcpm/SKILL.md) | How to use mcpm CLI, extract config from READMEs when `mcp.json` is missing |
| [`packages/cli/README.md`](./packages/cli/README.md) | Complete CLI reference, supported agents, and configuration formats |

### Automatic Installation Workflow

When a user wants to install MCP server(s), follow this flow:

**Step 1: Get MCP Server Source**
Ask user to provide one of:
- GitHub/GitLab repository URL
- Path to local config file (JSON/YAML/TOML)
- Direct config JSON/YAML

**Step 2: Gather Configuration**
- If repo has `mcp.json` → use GitHub URL mode
- If repo has NO `mcp.json` → extract config from README, use inline JSON mode (see SKILL.md "CRITICAL DECISION" section)
- Identify all required env vars/headers

**Step 3: Collect Credentials**
- List all required credentials to the user
- Explain what each credential is for
- Provide help URLs if available (e.g., where to get API keys)
- Ask user to provide all values

**Step 4: Install with Auto Mode**
Run mcpm with pre-filled values and auto flags:
```bash
# For repos WITH mcp.json:
npx @khanglvm/mcpm@latest <repo-url> --env:KEY1=value1 --env:KEY2=value2 -a -y

# For repos WITHOUT mcp.json (inline config):
npx @khanglvm/mcpm@latest '{"server":{"command":"npx","args":["-y","package"],"env":{"KEY":"value"}}}' -a -y
```

**Flags:**
- `-a` = Auto-select all compatible agents
- `-y` = Non-interactive mode (skip all prompts)
- `@latest` = Ensure newest version

> **Important**: All env values must be pre-filled for `-y` mode to work. If any required value is missing, mcpm falls back to interactive mode.

## License

MIT
