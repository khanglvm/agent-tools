import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentType, ParsedMcpConfig } from '../types.js';
import { agents, getAgentConfig } from '../agents.js';
import { showSecurityWarning } from './security.js';
import { injectConfig } from '../core/injector.js';

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
        p.cancel('Operation cancelled.');
        process.exit(0);
    }

    // Show security warning
    const confirmed = await showSecurityWarning(config);
    if (!confirmed) {
        p.cancel('Installation cancelled.');
        process.exit(0);
    }

    // Use tasks for structured installation
    const serverNames = Object.keys(config.servers).join(', ');

    await p.tasks([
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
    const backupDir = join(homedir(), '.mcpx', 'backups');
    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }

    // Create timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupDir, `${agentType}-${timestamp}.json`);

    const content = readFileSync(configPath, 'utf-8');
    writeFileSync(backupPath, content);
}

