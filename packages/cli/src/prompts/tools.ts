import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentType, ParsedMcpConfig, McpServerConfig } from '../types.js';
import { agents, getAgentConfig } from '../agents.js';
import { showSecurityWarning } from './security.js';
import { injectConfig } from '../core/injector.js';
import { addServer } from '../registry/store.js';
import type { RegistryServer } from '../registry/types.js';

/**
 * Show tool selector (multiselect)
 */
export async function showToolSelector(
    installedAgents: AgentType[],
    config: ParsedMcpConfig
) {
    const options = installedAgents.map((type) => ({
        value: type,
        label: agents[type].displayName,
        hint: agents[type].wrapperKey,
    }));

    const selectedTools = await p.multiselect({
        message: 'Select tools to configure:',
        options,
        required: true,
    });

    if (p.isCancel(selectedTools)) {
        p.log.info('Cancelled');
        return;
    }

    // Show security warning
    const confirmed = await showSecurityWarning(config);
    if (!confirmed) {
        p.log.info('Cancelled');
        return;
    }

    // Use tasks for structured installation
    const serverNames = Object.keys(config.servers).join(', ');

    await p.tasks([
        {
            title: `Saving to registry`,
            task: async (message) => {
                for (const [name, serverConfig] of Object.entries(config.servers)) {
                    const registryServer = toRegistryServer(name, serverConfig);
                    addServer(registryServer);
                }
                return `Saved ${Object.keys(config.servers).length} server(s) to registry`;
            },
        },
        {
            title: `Backing up existing configs`,
            task: async (message) => {
                const backedUp: string[] = [];
                for (const tool of selectedTools as AgentType[]) {
                    const agentConfig = getAgentConfig(tool);
                    if (existsSync(agentConfig.mcpConfigPath)) {
                        await backupConfig(tool);
                        backedUp.push(agents[tool].displayName);
                    }
                }
                if (backedUp.length > 0) {
                    return `Backed up: ${backedUp.join(', ')}`;
                }
                return 'No existing configs to backup';
            },
        },
        {
            title: `Installing servers: ${serverNames}`,
            task: async (message) => {
                const results: string[] = [];
                for (const tool of selectedTools as AgentType[]) {
                    try {
                        await injectConfig(tool, config);
                        results.push(`${pc.green('✓')} ${agents[tool].displayName}`);
                    } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                        results.push(`${pc.red('✗')} ${agents[tool].displayName}: ${errorMsg}`);
                    }
                }
                return results.join('\n');
            },
        },
    ]);

    p.log.success('Configuration complete!');
    p.log.info(`Servers installed: ${pc.cyan(serverNames)}`);
}

/**
 * Backup existing config before overwrite
 */
async function backupConfig(agentType: AgentType): Promise<void> {
    const agentConfig = getAgentConfig(agentType);
    const configPath = agentConfig.mcpConfigPath;

    if (!existsSync(configPath)) return;

    // Create backup directory
    const backupDir = join(homedir(), '.mcpm', 'backups');
    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }

    // Create timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupDir, `${agentType}-${timestamp}.json`);

    const content = readFileSync(configPath, 'utf-8');
    writeFileSync(backupPath, content);
}

/**
 * Convert McpServerConfig to RegistryServer format
 */
function toRegistryServer(name: string, config: McpServerConfig): RegistryServer {
    const transport = config.type || 'stdio';

    if (transport === 'stdio') {
        return {
            name,
            transport: 'stdio',
            command: config.command!,
            args: config.args,
            env: config.env as Record<string, string>,
        };
    } else {
        return {
            name,
            transport: transport as 'http' | 'sse',
            url: config.url!,
            headers: config.headers,
        };
    }
}
