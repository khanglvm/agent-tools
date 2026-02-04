---
description: Add a new AI agent to the mcpm support list (global/local scope, transport types, config format)
---

# Add New Agent Workflow

This workflow guides you through adding a new AI agent to the `mcpm` tool's support list. It requires careful planning and user review before implementation.

> [!CAUTION]
> **Core Principle**: Any AI agent that exposes an **editable MCP configuration file** MUST be supported—regardless of file format (JSON, YAML, TOML, XML) or path-finding complexity (dynamic paths, multiple IDEs, version-specific directories). Implementation challenges are not valid reasons to skip an agent.

> [!IMPORTANT]
> **Before Starting**: You need the agent's name or reference URL/documentation. If not provided, ask the user:
> "Please provide the agent name or a reference URL to its documentation (e.g., GitHub repo, official docs)."

---

## Phase 1: Research & Discovery

### Step 1.1: Gather Agent Information

Research the target agent to collect the following information:

| Field | Description | Example |
|-------|-------------|---------|
| **Agent Name** | Identifier (lowercase, kebab-case) | `claude-code`, `windsurf` |
| **Display Name** | Human-readable name | `Claude Code`, `Windsurf` |
| **Config Directory** | Where the agent stores its config | `~/.claude`, `~/.codeium/windsurf` |
| **MCP Config Path** | Full path to MCP config file | `~/.claude/settings.json` |
| **Config Format** | `json`, `yaml`, or `toml` | `json` |
| **Wrapper Key** | Key containing MCP servers | `mcpServers`, `servers`, `mcp` |
| **Transport Support** | Which transports are supported | `stdio`, `sse`, `http` |
| **Local Config Support** | Does it support project-scope? | `true/false` |
| **Local Config Path** | Path relative to project root | `.mcp.json` |

### Step 1.2: Identify Special Format Requirements

Check if the agent has non-standard format requirements:

- [ ] **Standard format**: `command`, `args`, `env`
- [ ] **Array-style command**: OpenCode uses `command: ["npx", "-y", "pkg"]`
- [ ] **`environment` key**: Some agents use `environment` instead of `env`
- [ ] **URL key variations**: `url`, `serverUrl`, `httpUrl`, `endpoint`
- [ ] **Explicit type field**: Some agents require `type: "sse"` or `type: "http"`

---

## Phase 2: Create Plan & Get User Approval

### Step 2.1: Document the Agent Configuration

Create a summary for user review:

```markdown
## Agent: [Agent Name]

### Configuration Details
- **Name**: [agent-name]
- **Display Name**: [Agent Name]
- **Config Directory**: [path]
- **MCP Config Path**: [path]
- **Config Format**: json | yaml | toml
- **Wrapper Key**: [key]

### Scope Support
- **Global Scope**: ✅ Yes
- **Project Scope**: ✅ Yes / ❌ No
- **Local Config Path**: [path or N/A]

### Transport Support
- stdio: ✅ / ❌
- SSE: ✅ / ❌  
- HTTP (Streamable): ✅ / ❌

### Special Handling
- Transform command to array: Yes / No
- Custom env key: Yes / No
- Custom URL key: [key or standard]
- Requires explicit type field: Yes / No

### Source References
- [Link to documentation]
```

### Step 2.2: Get User Approval

Present the plan to the user and wait for approval before proceeding.

---

## Phase 3: Implementation Checklist

### Step 3.1: Update `types.ts`

File: `packages/cli/src/types.ts`

- [ ] Add new agent to `AgentType` union type:
  ```typescript
  export type AgentType =
      | 'existing-agent'
      | 'new-agent-name'  // Add here alphabetically
      | ...;
  ```

### Step 3.2: Update `agents.ts`

File: `packages/cli/src/agents.ts`

- [ ] Add agent configuration to the `agents` record:

```typescript
'new-agent': {
    name: 'new-agent',
    displayName: 'New Agent',
    configDir: join(home, '.new-agent'),      // or use configHome for XDG
    mcpConfigPath: join(home, '.new-agent/mcp.json'),
    wrapperKey: 'mcpServers',                 // or 'servers', 'mcp', etc.
    configFormat: 'json',                     // optional: defaults to 'json'
    transformCommand: false,                  // optional: true for OpenCode-style
    detectInstalled: () => existsSync(join(home, '.new-agent')),
    supportsLocalConfig: true,                // optional: for project-scope support
    localConfigPath: '.new-agent/mcp.json',   // optional: relative to project root
},
```

### Step 3.3: Update Parser (if needed)

If the agent uses a **non-standard format**, update the appropriate parser:

**For JSON agents** (`packages/cli/src/parsers/json.ts`):
- [ ] Update `normalizeServer()` if custom URL key needed
- [ ] Update `transformServersForAgent()` if special output format needed

**For YAML agents** (`packages/cli/src/parsers/yaml.ts`):
- [ ] Update extraction/transformation if needed

**For TOML agents** (`packages/cli/src/parsers/toml.ts`):
- [ ] Update TOML parsing if needed

### Step 3.4: Handle Transport Schemas

If the agent has specific remote transport requirements, document in:
- Knowledge Item: `mcp_installation_architecture/transport_schemas.md`

Key variations to handle:
| Field | Standard | Variations |
|-------|----------|------------|
| URL | `url` | `serverUrl`, `httpUrl`, `endpoint` |
| Type | inferred | `type: "sse"`, `type: "http"` |
| Headers | `headers` | Standard across agents |

---

## Phase 4: Verification

### Step 4.1: Run Tests

```bash
cd packages/cli
yarn test
```

### Step 4.2: Manual Verification

- [ ] Run `yarn dev` and verify new agent appears in `mcpm add` flow
- [ ] If agent is installed locally, verify detection works
- [ ] Test adding an MCP server to the new agent
- [ ] Verify config file is written correctly with proper format

### Step 4.3: Documentation Update

- [ ] Update README if documenting supported agents
- [ ] Update agent count in relevant docs

---

## Quick Reference: Key Fields

### AgentConfig Interface

```typescript
interface AgentConfig {
    name: AgentType;              // Required: identifier
    displayName: string;          // Required: human-readable
    configDir: string;            // Required: agent's config directory
    mcpConfigPath: string;        // Required: full path to MCP config file
    wrapperKey: WrapperKey;       // Required: key containing servers
    configFormat?: 'json' | 'yaml' | 'toml';  // Optional: defaults to 'json'
    transformCommand?: boolean;   // Optional: for array-style commands
    detectInstalled: () => boolean;           // Required: installation check
    supportsLocalConfig?: boolean;            // Optional: project-scope support
    localConfigPath?: string;     // Optional: path relative to project root
}
```

### WrapperKey Options

| Key | Agents Using It |
|-----|----------------|
| `mcpServers` | Claude, Cursor, Windsurf, Cline, Roo, Antigravity, etc. |
| `servers` | VS Code + Copilot |
| `context_servers` | Zed |
| `mcp` | OpenCode |
| `mcp_servers` | Codex (TOML) |

### Config Path Patterns

| Pattern | Usage |
|---------|-------|
| `join(home, '.agent')` | Standard dotfile |
| `join(configHome, 'agent')` | XDG-compliant config |
| `join(home, 'Library/Application Support/Agent')` | macOS app support |

---

## Troubleshooting

### Agent Not Detected

1. Verify `detectInstalled()` checks the correct path
2. Check if the agent uses XDG_CONFIG_HOME

### Config Not Written Correctly

1. Check `wrapperKey` matches agent's expected structure
2. Verify parser handles the agent's format correctly

### Project-Scope Not Working

1. Ensure `supportsLocalConfig: true` is set
2. Verify `localConfigPath` is relative to project root
