/**
 * Supported AI agent types
 */
export type AgentType =
    | 'amp'
    | 'antigravity'
    | 'claude-code'
    | 'cline'
    | 'codex'
    | 'continue'
    | 'cursor'
    | 'droid'
    | 'gemini-cli'
    | 'github-copilot'
    | 'goose'
    | 'opencode'
    | 'roo'
    | 'vscode-copilot'
    | 'windsurf'
    | 'zed';

/**
 * Agent configuration
 */
export interface AgentConfig {
    name: AgentType;
    displayName: string;
    configDir: string;
    mcpConfigPath: string;
    wrapperKey: WrapperKey;
    configFormat?: 'json' | 'yaml' | 'toml';
    transformCommand?: boolean; // For OpenCode special format
    detectInstalled: () => boolean;
}

/**
 * MCP config wrapper keys used by different tools
 */
export type WrapperKey =
    | 'mcpServers'     // Claude, Cursor, Windsurf, etc.
    | 'servers'        // VS Code + Copilot
    | 'context_servers' // Zed
    | 'mcp'            // OpenCode
    | 'mcp_servers';   // Codex (TOML)

/**
 * Standard MCP server configuration
 */
export interface McpServerConfig {
    command?: string;
    args?: string[];
    env?: Record<string, string | null>;
    type?: 'stdio' | 'http' | 'sse';
    url?: string;
    headers?: Record<string, string>;
}

/**
 * Extended env variable schema with helper info
 */
export interface EnvVarSchema {
    value: string | null;
    description?: string;
    helpUrl?: string;
    required?: boolean;
    hidden?: boolean;
}

/**
 * Parsed MCP configuration
 */
export interface ParsedMcpConfig {
    servers: Record<string, McpServerConfig>;
    sourceFormat: 'json' | 'yaml';
    sourceWrapperKey: WrapperKey | string;
}

/**
 * Config source types
 */
export type ConfigSource = 'paste' | 'build' | 'github';
