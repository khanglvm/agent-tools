import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AgentType, ParsedMcpConfig, McpServerConfig } from '../types.js';
import { getAgentConfig } from '../agents.js';
import { createParser } from '../parsers/factory.js';

/**
 * Inject MCP configuration into an agent's config file
 */
export async function injectConfig(
    agentType: AgentType,
    config: ParsedMcpConfig
): Promise<void> {
    const agentConfig = getAgentConfig(agentType);

    // For XML format (JetBrains), use the parser directly
    if (agentConfig.configFormat === 'xml') {
        const parser = createParser(agentType);
        await parser.write(config.servers, { createIfMissing: true, backup: true, merge: true });
        return;
    }

    const configPath = agentConfig.mcpConfigPath;

    // Ensure directory exists
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    // Transform servers for this agent
    const transformedServers = transformForAgent(agentType, config.servers);

    // Read existing config or create new
    let existingConfig: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        try {
            const content = readFileSync(configPath, 'utf-8');
            existingConfig = JSON.parse(content);
        } catch {
            // If parse fails, start fresh
            existingConfig = {};
        }
    }

    // Merge servers
    const wrapperKey = agentConfig.wrapperKey;
    const existingServers = (existingConfig[wrapperKey] as Record<string, unknown>) || {};

    const newConfig = {
        ...existingConfig,
        [wrapperKey]: {
            ...existingServers,
            ...transformedServers,
        },
    };

    // Write config
    writeFileSync(configPath, JSON.stringify(newConfig, null, 2) + '\n');
}

/**
 * Transform servers for specific agent format
 * 
 * Remote transport field mappings (from research):
 * - Antigravity: serverUrl, headers
 * - Gemini CLI: httpUrl, headers  
 * - Claude Code: type: "http", url, headers
 * - Cursor: type: "sse", url
 * - Windsurf: serverUrl, transport: "sse", headers
 * - Cline/Roo: type: "sse", url
 * - VS Code Copilot: type: "sse", url, headers (always needs type field)
 * - Continue: url, transport: "sse" (YAML)
 * - Goose: url, type: "sse" (YAML)
 * - OpenCode: command[], environment, url, type
 * - Standard fallback: url only
 */
function transformForAgent(
    agentType: AgentType,
    servers: Record<string, McpServerConfig>
): Record<string, unknown> {
    const agentConfig = getAgentConfig(agentType);
    const result: Record<string, unknown> = {};

    for (const [name, server] of Object.entries(servers)) {
        const isStdio = server.command || server.type === 'stdio';

        if (agentConfig.transformCommand) {
            // OpenCode format: command is array, env -> environment
            result[name] = {
                command: server.args ? [server.command, ...server.args] : [server.command],
                ...(server.env && { environment: server.env }),
                ...(server.type && { type: server.type }),
                ...(server.url && { url: server.url }),
            };
        } else if (agentType === 'zed') {
            // Zed: only stdio, no remote support
            result[name] = {
                command: server.command,
                args: server.args,
                env: server.env,
            };
        } else if (agentType === 'vscode-copilot') {
            // VS Code Copilot: always requires type field
            if (isStdio) {
                result[name] = {
                    type: 'stdio',
                    command: server.command,
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    type: server.type || 'sse',
                    url: server.url,
                    ...(server.headers && { headers: server.headers }),
                };
            }
        } else if (agentType === 'antigravity') {
            // Antigravity: serverUrl for remote (no type field)
            if (isStdio) {
                result[name] = {
                    command: server.command,
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    serverUrl: server.url,
                    ...(server.headers && { headers: server.headers }),
                };
            }
        } else if (agentType === 'gemini-cli') {
            // Gemini CLI: httpUrl for remote
            if (isStdio) {
                result[name] = {
                    command: server.command,
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    httpUrl: server.url,
                    ...(server.headers && { headers: server.headers }),
                };
            }
        } else if (agentType === 'windsurf') {
            // Windsurf: serverUrl + transport for remote
            if (isStdio) {
                result[name] = {
                    command: server.command,
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    serverUrl: server.url,
                    transport: server.type || 'sse',
                    ...(server.headers && { headers: server.headers }),
                };
            }
        } else if (agentType === 'claude-code') {
            // Claude Code: type: "http" for remote
            if (isStdio) {
                result[name] = {
                    command: server.command,
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    type: server.type || 'http',
                    url: server.url,
                    ...(server.headers && { headers: server.headers }),
                };
            }
        } else if (agentType === 'cursor' || agentType === 'cline' || agentType === 'roo') {
            // Cursor, Cline, Roo: type: "sse" for remote
            if (isStdio) {
                result[name] = {
                    command: server.command,
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    type: server.type || 'sse',
                    url: server.url,
                    ...(server.headers && { headers: server.headers }),
                };
            }
        } else {
            // Default format for other agents (amp, droid, github-copilot, goose, etc.)
            // Stdio: command, args, env
            // Remote: url only (no type field)
            if (isStdio) {
                result[name] = {
                    ...(server.command && { command: server.command }),
                    ...(server.args?.length && { args: server.args }),
                    ...(server.env && { env: server.env }),
                };
            } else {
                result[name] = {
                    url: server.url,
                    ...(server.headers && { headers: server.headers }),
                };
            }
        }
    }

    return result;
}

/**
 * Inject MCP configuration into an agent's LOCAL (project-scope) config file
 */
export async function injectLocalConfig(
    agentType: AgentType,
    config: ParsedMcpConfig
): Promise<void> {
    const agentConfig = getAgentConfig(agentType);

    if (!agentConfig.supportsLocalConfig || !agentConfig.localConfigPath) {
        throw new Error(`${agentConfig.displayName} does not support project-scope config`);
    }

    const configPath = agentConfig.localConfigPath;

    // Ensure directory exists
    const dir = dirname(configPath);
    if (dir && !existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    // Transform servers for this agent
    const transformedServers = transformForAgent(agentType, config.servers);

    // Read existing config or create new
    let existingConfig: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        try {
            const content = readFileSync(configPath, 'utf-8');
            existingConfig = JSON.parse(content);
        } catch {
            // If parse fails, start fresh
            existingConfig = {};
        }
    }

    // Merge servers
    const wrapperKey = agentConfig.wrapperKey;
    const existingServers = (existingConfig[wrapperKey] as Record<string, unknown>) || {};

    const newConfig = {
        ...existingConfig,
        [wrapperKey]: {
            ...existingServers,
            ...transformedServers,
        },
    };

    // Write config
    writeFileSync(configPath, JSON.stringify(newConfig, null, 2) + '\n');
}
