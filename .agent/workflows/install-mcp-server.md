---
description: Install MCP servers for users using mcpm with automatic configuration extraction and non-interactive installation
---

# Install MCP Server Workflow

This workflow guides AI agents through the full process of installing MCP servers using mcpm.

> ⚠️ **MANDATORY**: Always use `-a -y` flags when installing MCP servers to avoid terminal input requirements. This ensures fully automated, non-interactive installation.

## Prerequisites

Before starting, you MUST read these files:

| Step | File | What You'll Learn |
|------|------|-------------------|
| 1️⃣ | [`.agent/skills/mcpm/SKILL.md`](https://github.com/khanglvm/agent-tools/blob/main/.agent/skills/mcpm/SKILL.md) | **README patterns** for extracting config, inline JSON mode, when to use each command format |
| 2️⃣ | [`packages/cli/README.md`](https://github.com/khanglvm/agent-tools/blob/main/packages/cli/README.md) | CLI reference, supported agents, all configuration options |

---

## Step 1: Get MCP Server Source

Ask user to provide one of:
- **Git repository URL** (GitHub, GitLab, Bitbucket, Codeberg)
- **Direct config file URL** (raw file links, e.g., `https://raw.githubusercontent.com/.../mcp.json`)
- **Path to local config file** (JSON/YAML/TOML)
- **Direct config JSON/YAML** (pasted inline)

### Source Types

| Source Type | Example | mcpm Usage |
|-------------|---------|------------|
| Git repo with `mcp.json` | `https://github.com/owner/repo` | `npx @khanglvm/mcpm@latest <url> -a -y` |
| Git repo without `mcp.json` | `https://github.com/owner/repo` | Use inline JSON mode |
| Raw config URL | `https://raw.githubusercontent.com/.../mcp.json` | `npx @khanglvm/mcpm@latest <raw-url> -a -y` |
| Local file | `/path/to/config.json` | `npx @khanglvm/mcpm@latest <path> -a -y` |
| Inline config | `{"server":{...}}` | `npx @khanglvm/mcpm@latest '<json>' -a -y` |

---

## Step 2: Gather Configuration

For each MCP server, you must determine the full configuration. Follow this process:

1. **Check for `mcp.json`** in the repo root (e.g., `https://raw.githubusercontent.com/owner/repo/main/mcp.json`)
   - If exists → You can use GitHub URL mode with `--env:` flags
   - If NOT exists → Continue to step 2

2. **Read the README** to extract configuration:
   - Look for JSON/YAML config blocks showing `mcpServers`, `command`, `args`, `env`, `headers`
   - **Identify the package name** (crucial!):
     - Do NOT confuse the *binary name* (e.g., `server-stdio`) with the *package name* (e.g., `mcp-server-package`)
     - Check `package.json` > `name` field if unsure
     - Common error: `npm error 404` means you used the wrong package name in `args`
   - Identify all required environment variables and their purposes
   - Note any help URLs for obtaining credentials

3. **Identify the command type** and construct accordingly (see Command Reference below)

4. **Determine command format**:
   - Has `mcp.json` → `npx @khanglvm/mcpm@latest <github-url> --env:KEY=value -a -y`
   - No `mcp.json` → `npx @khanglvm/mcpm@latest '<inline-json>' -a -y`

---

## Command Reference

MCP servers use different runtime commands. Here are the most common:

### `npx` (Node.js packages)

```json
{
  "server-name": {
    "command": "npx",
    "args": ["-y", "package-name@latest"],
    "env": {
      "API_KEY": "<value>"
    }
  }
}
```

**Edge cases:**
- Always include `-y` in args to skip npm install prompts
- Use `@latest` or specific version to avoid caching issues
- For scoped packages: `"-y", "@scope/package-name"`

### `uvx` (Python packages via uv)

```json
{
  "server-name": {
    "command": "uvx",
    "args": ["package-name"],
    "env": {
      "API_KEY": "<value>"
    }
  }
}
```

**Edge cases:**
- `uvx` does NOT need `-y` flag (it's non-interactive by default)
- Python MCP servers often use `uvx` or `python -m`
- Some use `uv run` instead of `uvx` for more complex setups

### `python` / `python3` (Direct Python execution)

```json
{
  "server-name": {
    "command": "python3",
    "args": ["-m", "module_name"],
    "env": {
      "API_KEY": "<value>"
    }
  }
}
```

**Edge cases:**
- May require virtual environment activation first
- Use `python3` instead of `python` for cross-platform compatibility

### `node` (Direct Node.js execution)

```json
{
  "server-name": {
    "command": "node",
    "args": ["/path/to/server.js"],
    "env": {
      "API_KEY": "<value>"
    }
  }
}
```

### `docker` (Containerized servers)

```json
{
  "server-name": {
    "command": "docker",
    "args": ["run", "-i", "--rm", "image-name"],
    "env": {
      "API_KEY": "<value>"
    }
  }
}
```

**Edge cases:**
- Must include `-i` for stdin interaction
- Use `--rm` to clean up containers after exit
- Environment variables may need `-e KEY=value` in args instead of `env` block

---

## Step 3: Collect Credentials

- List all required credentials to the user
- Explain what each credential is for
- Provide help URLs if available (e.g., where to get API keys)
- Ask user to provide all values

---

## Step 4: Install with Auto Mode

> ⚠️ **ALWAYS use `-a -y` flags** to ensure non-interactive installation. This is mandatory for automated workflows.

Run mcpm with pre-filled values and auto flags:

```bash
# For repos WITH mcp.json:
npx @khanglvm/mcpm@latest <repo-url> --env:KEY1=value1 --env:KEY2=value2 -a -y

# For direct config file URL:
npx @khanglvm/mcpm@latest https://raw.githubusercontent.com/.../mcp.json -a -y

# For repos WITHOUT mcp.json (inline config) - EXAMPLE ONLY:
npx @khanglvm/mcpm@latest '{"server":{"command":"npx","args":["-y","package"],"env":{"KEY":"value"}}}' -a -y

# For Python MCP servers (uvx example):
npx @khanglvm/mcpm@latest '{"mcp-server":{"command":"uvx","args":["mcp-server-package"],"env":{"API_KEY":"value"}}}' -a -y
```

> ⚠️ **CRITICAL**: The inline config examples above are **placeholder formats**. You MUST read and follow [SKILL.md](https://github.com/khanglvm/agent-tools/blob/main/.agent/skills/mcpm/SKILL.md) to learn how to extract the actual package name, command, args, and env vars from the MCP server's README file. Do NOT copy examples literally.

**Flags:**
- `-a` = Auto-select all compatible agents (REQUIRED for automation)
- `-y` = Non-interactive mode, skip all prompts (REQUIRED for automation)
- `@latest` = Ensure newest version

> **Important**: All env values must be pre-filled for `-y` mode to work. If any required value is missing, mcpm falls back to interactive mode which will cause terminal hangs.

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
   - `command not found` → Wrong package name or command (check `npx` vs `uvx` vs `node`)
   - `npm error 404` → Wrong npm package name in args
   - `Connection closed` → Server failed to start (check credentials/URL)
   - `Missing value` or credential issues → Env var not properly passed
   - `mcp.json not found` → Need to use inline config mode instead
   - `uvx: command not found` → User needs to install `uv` first

3. **Ask user for corrections** and rebuild the configuration

4. **Retry installation** with the corrected config (always with `-a -y`)

> Keep iterating with the user until installation succeeds. Don't give up on first failure.