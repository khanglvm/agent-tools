import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AgentType, ParsedMcpConfig, McpServerConfig } from '../types.js';
import { getAgentConfig } from '../agents.js';

/**
 * Inject MCP configuration into an agent's config file
 */
export async function injectConfig(
    agentType: AgentType,
    config: ParsedMcpConfig
): Promise<void> {
    const agentConfig = getAgentConfig(agentType);
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
 */
function transformForAgent(
    agentType: AgentType,
    servers: Record<string, McpServerConfig>
): Record<string, unknown> {
    const agentConfig = getAgentConfig(agentType);
    const result: Record<string, unknown> = {};

    for (const [name, server] of Object.entries(servers)) {
        if (agentConfig.transformCommand) {
            // OpenCode format: command is array, env -> environment
            result[name] = {
                command: server.args ? [server.command, ...server.args] : [server.command],
                ...(server.env && { environment: server.env }),
                ...(server.type && { type: server.type }),
                ...(server.url && { url: server.url }),
            };
        } else if (agentType === 'zed') {
            // Zed format: slightly different structure
            result[name] = {
                command: server.command,
                args: server.args,
                env: server.env,
            };
        } else {
            // Standard format
            result[name] = {
                ...(server.command && { command: server.command }),
                ...(server.args && { args: server.args }),
                ...(server.env && { env: server.env }),
                ...(server.type && { type: server.type }),
                ...(server.url && { url: server.url }),
                ...(server.headers && { headers: server.headers }),
            };
        }
    }

    return result;
}
