/**
 * Sync utilities - detect duplicates and sync registry to agents
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType } from '../types.js';
import type { RegistryServer } from '../registry/types.js';
import { loadRegistry, listServers, addPrefix, hasPrefix } from '../registry/index.js';
import { createParser } from '../parsers/factory.js';
import { getAgentConfig, detectInstalledAgents } from '../agents.js';
import { isCancel } from '@clack/prompts';

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'replace' | 'skip' | 'suffix';

/**
 * Server conflict information
 */
export interface ServerConflict {
    serverName: string;
    agentType: AgentType;
    registryConfig: RegistryServer;
    existingConfig: Record<string, unknown>;
}

/**
 * Sync result for a single agent
 */
export interface AgentSyncResult {
    agentType: AgentType;
    added: string[];
    replaced: string[];
    skipped: string[];
    errors: string[];
}

/**
 * Detect servers in registry that already exist in agent configs
 */
export async function detectDuplicates(
    agentTypes?: AgentType[]
): Promise<Map<AgentType, ServerConflict[]>> {
    const agents = agentTypes || detectInstalledAgents();
    const registry = loadRegistry();
    const servers = Object.values(registry.servers);
    const conflicts = new Map<AgentType, ServerConflict[]>();

    for (const agentType of agents) {
        const parser = createParser(agentType);
        const config = await parser.read();
        const existing = config?.servers;

        if (!existing) continue;

        const agentConflicts: ServerConflict[] = [];

        for (const server of servers) {
            const prefixedName = addPrefix(server.name, agentType);

            // Check both original and prefixed name
            if (existing[server.name] || existing[prefixedName]) {
                agentConflicts.push({
                    serverName: server.name,
                    agentType,
                    registryConfig: server,
                    existingConfig: (existing[server.name] || existing[prefixedName]) as Record<string, unknown>,
                });
            }
        }

        if (agentConflicts.length > 0) {
            conflicts.set(agentType, agentConflicts);
        }
    }

    return conflicts;
}

/**
 * Sync a single server to an agent with conflict handling
 */
export async function syncServerToAgent(
    server: RegistryServer,
    agentType: AgentType,
    strategy: ConflictStrategy = 'skip'
): Promise<{ success: boolean; action: 'added' | 'replaced' | 'skipped' | 'error'; message: string }> {
    const agentConfig = getAgentConfig(agentType);
    const parser = createParser(agentType);

    // Note: Transport compatibility would require adding transportSupport to AgentConfig
    // For now, we assume all agents support all transports (can be added later)

    const config = await parser.read();
    const existing = config?.servers || {};
    const prefixedName = addPrefix(server.name, agentType);

    // Check for conflict
    const hasConflict = existing[server.name] || existing[prefixedName];

    if (hasConflict) {
        switch (strategy) {
            case 'skip':
                return {
                    success: true,
                    action: 'skipped',
                    message: `Skipped existing server "${server.name}"`,
                };
            case 'replace':
                // Continue to write
                break;
            case 'suffix':
                // Find unique name with suffix
                let suffix = 2;
                let newName = `${prefixedName}_${suffix}`;
                while (existing[newName]) {
                    suffix++;
                    newName = `${prefixedName}_${suffix}`;
                }
                // Use suffixed name (create new server with different name)
                const suffixedServer = { ...server, name: newName.replace('mcpm_', '') };
                return syncServerToAgent(suffixedServer, agentType, 'skip');
        }
    }

    // Build MCP config for this agent
    const mcpConfig = buildMcpConfig(server);

    // Merge and write
    const merged = { ...existing, [prefixedName]: mcpConfig };

    try {
        parser.write(merged);
        return {
            success: true,
            action: hasConflict ? 'replaced' : 'added',
            message: hasConflict
                ? `Replaced existing server "${server.name}"`
                : `Added server "${server.name}"`,
        };
    } catch (error) {
        return {
            success: false,
            action: 'error',
            message: `Failed to write config: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Build MCP server config for a specific agent
 */
function buildMcpConfig(server: RegistryServer): Record<string, unknown> {
    const config: Record<string, unknown> = {};

    if (server.transport === 'stdio') {
        config.command = server.command;
        if (server.args?.length) {
            config.args = server.args;
        }
    } else {
        config.url = server.url;
        if (server.headers) {
            config.headers = server.headers;
        }
    }

    if (server.env && Object.keys(server.env).length > 0) {
        config.env = server.env;
    }

    return config;
}

/**
 * Sync all registry servers to all installed agents
 */
export async function syncRegistryToAgents(
    options: {
        agentTypes?: AgentType[];
        serverNames?: string[];
        strategy?: ConflictStrategy;
        interactive?: boolean;
    } = {}
): Promise<AgentSyncResult[]> {
    const {
        agentTypes = detectInstalledAgents(),
        serverNames,
        strategy = 'skip',
        interactive = false,
    } = options;

    const servers = listServers();
    const filteredServers = serverNames
        ? servers.filter((s: RegistryServer) => serverNames.includes(s.name))
        : servers;

    if (filteredServers.length === 0) {
        p.log.warn('No servers in registry to sync');
        return [];
    }

    const results: AgentSyncResult[] = [];

    for (const agentType of agentTypes) {
        const result: AgentSyncResult = {
            agentType,
            added: [],
            replaced: [],
            skipped: [],
            errors: [],
        };

        for (const server of filteredServers) {
            let currentStrategy = strategy;

            // Interactive mode: ask for each conflict
            if (interactive) {
                const conflicts = await detectDuplicates([agentType]);
                const agentConflicts = conflicts.get(agentType) || [];
                const hasConflict = agentConflicts.some(c => c.serverName === server.name);

                if (hasConflict) {
                    const action = await p.select<ConflictStrategy>({
                        message: `"${server.name}" exists in ${getAgentConfig(agentType).displayName}`,
                        options: [
                            { value: 'replace', label: 'Replace', hint: 'Overwrite existing' },
                            { value: 'skip', label: 'Skip', hint: 'Keep existing' },
                            { value: 'suffix', label: 'Add with suffix', hint: `mcpm_${server.name}_2` },
                        ],
                    });

                    if (isCancel(action)) {
                        result.skipped.push(server.name);
                        continue;
                    }

                    currentStrategy = action;
                }
            }

            const syncResult = await syncServerToAgent(server, agentType, currentStrategy);

            switch (syncResult.action) {
                case 'added':
                    result.added.push(server.name);
                    break;
                case 'replaced':
                    result.replaced.push(server.name);
                    break;
                case 'skipped':
                    result.skipped.push(server.name);
                    break;
                case 'error':
                    result.errors.push(`${server.name}: ${syncResult.message}`);
                    break;
            }
        }

        results.push(result);
    }

    return results;
}

/**
 * Show sync results summary
 */
export function showSyncSummary(results: AgentSyncResult[]): void {
    for (const result of results) {
        const agentName = getAgentConfig(result.agentType).displayName;

        if (result.added.length + result.replaced.length + result.skipped.length + result.errors.length === 0) {
            continue;
        }

        p.log.info(`${pc.bold(agentName)}:`);

        if (result.added.length > 0) {
            p.log.success(`  Added: ${result.added.join(', ')}`);
        }
        if (result.replaced.length > 0) {
            p.log.warn(`  Replaced: ${result.replaced.join(', ')}`);
        }
        if (result.skipped.length > 0) {
            p.log.info(`  Skipped: ${result.skipped.join(', ')}`);
        }
        if (result.errors.length > 0) {
            p.log.error(`  Errors: ${result.errors.join(', ')}`);
        }
    }
}

/**
 * Detect drift between registry and agent configs
 */
export async function detectDrift(agentTypes?: AgentType[]): Promise<Map<AgentType, string[]>> {
    const agents = agentTypes || detectInstalledAgents();
    const servers = listServers();
    const drift = new Map<AgentType, string[]>();

    for (const agentType of agents) {
        const parser = createParser(agentType);
        const config = await parser.read();
        const existing = config?.servers;

        if (!existing) continue;

        const driftedServers: string[] = [];

        for (const server of servers) {
            const prefixedName = addPrefix(server.name, agentType);
            const agentConfig = existing[prefixedName] as Record<string, unknown> | undefined;

            if (!agentConfig) continue;

            // Compare configs
            const registryMcp = buildMcpConfig(server);
            if (JSON.stringify(agentConfig) !== JSON.stringify(registryMcp)) {
                driftedServers.push(server.name);
            }
        }

        if (driftedServers.length > 0) {
            drift.set(agentType, driftedServers);
        }
    }

    return drift;
}
