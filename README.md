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

For each MCP server, you must determine the full configuration. Follow this process:

1. **Check for `mcp.json`** in the repo root (e.g., `https://raw.githubusercontent.com/owner/repo/main/mcp.json`)
   - If exists → You can use GitHub URL mode with `--env:` flags
   - If NOT exists → Continue to step 2

2. **Read the README** to extract configuration:
   - Look for JSON/YAML config blocks showing `mcpServers`, `command`, `args`, `env`
   - Find the npm package name (e.g., `@scope/package-name` or `package-name`)
   - Identify all required environment variables and their purposes
   - Note any help URLs for obtaining credentials

3. **Construct the configuration**:
   ```json
   {
     "server-name": {
       "command": "npx",
       "args": ["-y", "package-name@latest"],
       "env": {
         "API_KEY": "<user-provided>",
         "API_URL": "<default-or-user-provided>"
       }
     }
   }
   ```

4. **Determine command format**:
   - Has `mcp.json` → `npx @khanglvm/mcpm@latest <github-url> --env:KEY=value -a -y`
   - No `mcp.json` → `npx @khanglvm/mcpm@latest '<inline-json>' -a -y`

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
