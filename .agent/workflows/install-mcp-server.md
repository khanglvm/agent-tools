---
description: Install MCP servers for users using mcpm with automatic configuration extraction and non-interactive installation
---

# Install MCP Server Workflow

This workflow guides AI agents through the full process of installing MCP servers using mcpm.

## Prerequisites

Before starting, you MUST read these files:

| Step | File | What You'll Learn |
|------|------|-------------------|
| 1️⃣ | [`.agent/skills/mcpm/SKILL.md`](https://github.com/khanglvm/agent-tools/blob/main/.agent/skills/mcpm/SKILL.md) | **README patterns** for extracting config, inline JSON mode, when to use each command format |
| 2️⃣ | [`packages/cli/README.md`](https://github.com/khanglvm/agent-tools/blob/main/packages/cli/README.md) | CLI reference, supported agents, all configuration options |

---

## Step 1: Get MCP Server Source

Ask user to provide one of:
- GitHub/GitLab repository URL
- Path to local config file (JSON/YAML/TOML)
- Direct config JSON/YAML

---

## Step 2: Gather Configuration

For each MCP server, you must determine the full configuration. Follow this process:

1. **Check for `mcp.json`** in the repo root (e.g., `https://raw.githubusercontent.com/owner/repo/main/mcp.json`)
   - If exists → You can use GitHub URL mode with `--env:` flags
   - If NOT exists → Continue to step 2

2. **Read the README** to extract configuration:
   - Look for JSON/YAML config blocks showing `mcpServers`, `command`, `args`, `env`
   - **Identify the NPM package name** (crucial!):
     - Do NOT confuse the *binary name* (e.g., `server-stdio`) with the *package name* (e.g., `mcp-server-package`)
     - Check `package.json` > `name` field if unsure
     - Common error: `npm error 404` means you used the wrong package name in `args`
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

---

## Step 3: Collect Credentials

- List all required credentials to the user
- Explain what each credential is for
- Provide help URLs if available (e.g., where to get API keys)
- Ask user to provide all values

---

## Step 4: Install with Auto Mode

Run mcpm with pre-filled values and auto flags:

```bash
# For repos WITH mcp.json:
npx @khanglvm/mcpm@latest <repo-url> --env:KEY1=value1 --env:KEY2=value2 -a -y

# For repos WITHOUT mcp.json (inline config) - EXAMPLE ONLY:
npx @khanglvm/mcpm@latest '{"server":{"command":"npx","args":["-y","package"],"env":{"KEY":"value"}}}' -a -y
```

> ⚠️ **CRITICAL**: The inline config example above is just a **placeholder format**. You MUST read and follow [SKILL.md](https://github.com/khanglvm/agent-tools/blob/main/.agent/skills/mcpm/SKILL.md) to learn how to extract the actual package name, command, args, and env vars from the MCP server's README file. Do NOT copy the example literally.

**Flags:**
- `-a` = Auto-select all compatible agents
- `-y` = Non-interactive mode (skip all prompts)
- `@latest` = Ensure newest version

> **Important**: All env values must be pre-filled for `-y` mode to work. If any required value is missing, mcpm falls back to interactive mode.

---

## Step 5: Handle Installation Failures

If mcpm fails to install or validate the MCP server:

1. **Show the full configuration to user for review**:
   ```
   Here's the MCP configuration I constructed:
   
   Server: <server-name>
   Command: <command>
   Args: <args>
   Environment Variables:
     - KEY1: <value1>
     - KEY2: <value2>
   
   Please review and let me know if anything looks incorrect.
   ```

2. **Identify the issue** from the error message:
   - `command not found` → Wrong package name or command
   - `Connection closed` → Server failed to start (check credentials/URL)
   - `Missing value` → Env var not properly passed
   - `mcp.json not found` → Need to use inline config mode instead

3. **Ask user for corrections** and rebuild the configuration

4. **Retry installation** with the corrected config

> Keep iterating with the user until installation succeeds. Don't give up on first failure.
