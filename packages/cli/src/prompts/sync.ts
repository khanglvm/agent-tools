/**
 * Sync flow - push registry servers to agents
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType, McpServerConfig, ParsedMcpConfig } from '../types.js';
import { agents, getAgentConfig, detectInstalledAgents } from '../agents.js';
import { loadRegistry, listServers } from '../registry/store.js';
import type { RegistryServer } from '../registry/types.js';
import { existsSync, readFileSync } from 'node:fs';
import { getSecret } from '../registry/keychain.js';
import { multiselectWithAll } from './shared.js';
import { injectConfig } from '../core/injector.js';

/**
 * Result type for navigation
 */
type FlowResult = 'back' | 'done';

/**
 * Run sync flow
 * Returns 'back' to go to previous menu, 'done' when complete
 */
export async function runSyncFlow(): Promise<FlowResult> {
    const servers = listServers();

    if (servers.length === 0) {
        p.log.warn('Registry is empty. Add servers first.');
        return 'done';
    }

    // Step 1: Select servers to sync
    const serverItems = servers.map(s => ({
        value: s.name,
        label: s.name,
        hint: s.transport === 'stdio' ? s.command : s.url,
    }));

    const selectedServers = await multiselectWithAll({
        message: 'Select servers to sync:',
        items: serverItems,
    });

    if (selectedServers === null) {
        return 'back';
    }

    // Step 2: Select agents to sync to
    const installedAgents = detectInstalledAgents();

    if (installedAgents.length === 0) {
        p.log.warn('No agents detected on this system.');
        return 'done';
    }

    const agentItems = installedAgents.map(type => ({
        value: type,
        label: agents[type].displayName,
    }));

    const selectedAgents = await multiselectWithAll({
        message: 'Select agents to sync to:',
        items: agentItems,
    });

    if (selectedAgents === null) {
        // Go back to server selection - but for simplicity, go to root
        return 'back';
    }

    // Step 3: Check for duplicates in target agents
    const selectedServersList = servers.filter(s =>
        (selectedServers as string[]).includes(s.name)
    );

    const duplicates = await findDuplicates(
        selectedServersList,
        selectedAgents as AgentType[]
    );

    if (duplicates.length > 0) {
        const duplicateNames = [...new Set(duplicates.map(d => d.serverName))];
        p.log.warn(`Found existing servers: ${pc.yellow(duplicateNames.join(', '))}`);

        const override = await p.confirm({
            message: 'Override existing configurations?',
            initialValue: true,
        });

        if (p.isCancel(override)) {
            return 'back';
        }

        if (!override) {
            return 'back';
        }
    }

    // Step 4: Inject configs
    const s = p.spinner();
    s.start('Syncing servers to agents...');

    const results: { agent: string; success: boolean; error?: string }[] = [];

    for (const agentType of selectedAgents as AgentType[]) {
        try {
            await injectServersToAgent(agentType, selectedServersList);
            results.push({ agent: agents[agentType].displayName, success: true });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            results.push({ agent: agents[agentType].displayName, success: false, error: msg });
        }
    }

    s.stop('Sync complete');

    // Show results
    for (const r of results) {
        if (r.success) {
            p.log.success(`${pc.green('✓')} ${r.agent}`);
        } else {
            p.log.error(`${pc.red('✗')} ${r.agent}: ${r.error}`);
        }
    }

    return 'done';
}

/**
 * Find servers that already exist in target agents
 */
async function findDuplicates(
    servers: RegistryServer[],
    targetAgents: AgentType[]
): Promise<{ serverName: string; agentType: AgentType }[]> {
    const duplicates: { serverName: string; agentType: AgentType }[] = [];

    for (const agentType of targetAgents) {
        const config = getAgentConfig(agentType);
        if (!existsSync(config.mcpConfigPath)) continue;

        try {
            const content = readFileSync(config.mcpConfigPath, 'utf-8');
            const parsed = JSON.parse(content);
            const existingServers = parsed[config.wrapperKey] || {};

            for (const server of servers) {
                // Check both exact name and mcpm-prefixed name
                const mcpmName = `mcpm-${server.name}`;
                if (existingServers[server.name] || existingServers[mcpmName]) {
                    duplicates.push({ serverName: server.name, agentType });
                }
            }
        } catch {
            // Skip unreadable configs
        }
    }

    return duplicates;
}

/**
 * Inject servers into an agent's config using the centralized injector
 * This ensures proper agent-specific transformations are applied
 */
async function injectServersToAgent(
    agentType: AgentType,
    servers: RegistryServer[]
): Promise<void> {
    // Convert registry servers to ParsedMcpConfig format
    const serverConfigs: Record<string, McpServerConfig> = {};

    for (const server of servers) {
        const serverConfig = await registryServerToConfig(server);
        // Use original name - injectConfig will apply mcpm_ prefix automatically
        serverConfigs[server.name] = serverConfig;
    }

    const parsedConfig: ParsedMcpConfig = {
        servers: serverConfigs,
        sourceFormat: 'json',
        sourceWrapperKey: 'mcpServers',
    };

    // Use centralized injector which handles agent-specific transformations
    await injectConfig(agentType, parsedConfig);
}

/**
 * Convert RegistryServer to McpServerConfig, resolving keychain secrets
 */
async function registryServerToConfig(server: RegistryServer): Promise<McpServerConfig> {
    if (server.transport === 'stdio') {
        const env: Record<string, string> = {};

        // Resolve keychain secrets
        if (server.env) {
            for (const [key, value] of Object.entries(server.env)) {
                if (value.startsWith('keychain:')) {
                    // Parse keychain reference: keychain:serverName.envName
                    const ref = value.slice('keychain:'.length);
                    const parts = ref.split('.');
                    if (parts.length >= 2) {
                        const serverName = parts[0];
                        const envName = parts.slice(1).join('.');
                        const secret = await getSecret(serverName, envName);
                        env[key] = secret || value; // Fallback to keychain reference if not found
                    } else {
                        env[key] = value;
                    }
                } else {
                    env[key] = value;
                }
            }
        }

        return {
            type: 'stdio',
            command: server.command,
            args: server.args,
            env: Object.keys(env).length > 0 ? env : undefined,
        };
    } else {
        return {
            type: server.transport,
            url: server.url,
            headers: server.headers,
        };
    }
}
