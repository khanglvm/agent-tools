/**
 * Remove flow - remove servers from registry and/or agents
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType } from '../types.js';
import { agents, getAgentConfig, detectInstalledAgents } from '../agents.js';
import { listServers, removeServer } from '../registry/store.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { multiselectWithAll } from './shared.js';

type FlowResult = 'back' | 'done';

/**
 * Run remove flow
 */
export async function runRemoveFlow(): Promise<FlowResult> {
    const servers = listServers();

    if (servers.length === 0) {
        p.log.warn('Registry is empty.');
        return 'done';
    }

    // Step 1: Select servers to remove (with Select All)
    const serverItems = servers.map(s => ({
        value: s.name,
        label: s.name,
        hint: s.transport === 'stdio' ? s.command : s.url,
    }));

    const selectedServers = await multiselectWithAll({
        message: 'Select servers to remove:',
        items: serverItems,
    });

    if (selectedServers === null) {
        return 'back';
    }

    if (selectedServers.length === 0) {
        p.log.warn('No servers selected.');
        return 'done';
    }

    // Step 2: Select removal scope (with Select All)
    const installedAgents = detectInstalledAgents();

    const scopeItems = [
        { value: 'complete', label: 'Completely remove', hint: 'Registry + all agents' },
        { value: 'registry', label: 'Remove from registry only' },
        ...installedAgents.map(type => ({
            value: `agent:${type}`,
            label: `Remove from ${agents[type].displayName}`,
        })),
    ];

    const selectedScopes = await multiselectWithAll({
        message: 'Where to remove from:',
        items: scopeItems,
    });

    if (selectedScopes === null) {
        return 'back';
    }

    if (selectedScopes.length === 0) {
        p.log.warn('No scope selected.');
        return 'done';
    }

    // Step 3: Perform removal
    const s = p.spinner();
    s.start('Removing servers...');

    let removedFromRegistry = 0;
    let removedFromAgents = 0;

    // Handle complete removal
    if (selectedScopes.includes('complete')) {
        // Remove from registry
        for (const name of selectedServers) {
            if (removeServer(name)) {
                removedFromRegistry++;
            }
        }
        // Remove from all agents
        for (const agentType of installedAgents) {
            const count = await removeFromAgent(agentType, selectedServers);
            removedFromAgents += count;
        }
    } else {
        // Handle selective removal
        if (selectedScopes.includes('registry')) {
            for (const name of selectedServers) {
                if (removeServer(name)) {
                    removedFromRegistry++;
                }
            }
        }

        // Handle per-agent removal
        for (const scope of selectedScopes) {
            if (scope.startsWith('agent:')) {
                const agentType = scope.slice('agent:'.length) as AgentType;
                const count = await removeFromAgent(agentType, selectedServers);
                removedFromAgents += count;
            }
        }
    }

    s.stop('Removal complete');

    // Show results
    if (removedFromRegistry > 0) {
        p.log.success(`Removed ${removedFromRegistry} server(s) from registry`);
    }
    if (removedFromAgents > 0) {
        p.log.success(`Removed ${removedFromAgents} server(s) from agents`);
    }

    return 'done';
}

/**
 * Remove servers from an agent's config
 */
async function removeFromAgent(
    agentType: AgentType,
    serverNames: string[]
): Promise<number> {
    const config = getAgentConfig(agentType);

    if (!existsSync(config.mcpConfigPath)) {
        return 0;
    }

    try {
        const content = readFileSync(config.mcpConfigPath, 'utf-8');
        const parsed = JSON.parse(content);
        const serversObj = parsed[config.wrapperKey] || {};

        let removed = 0;
        for (const name of serverNames) {
            // Check both exact name and mcpm-prefixed name
            if (serversObj[name]) {
                delete serversObj[name];
                removed++;
            }
            const mcpmName = `mcpm-${name}`;
            if (serversObj[mcpmName]) {
                delete serversObj[mcpmName];
                removed++;
            }
        }

        if (removed > 0) {
            parsed[config.wrapperKey] = serversObj;
            writeFileSync(
                config.mcpConfigPath,
                JSON.stringify(parsed, null, 2) + '\n'
            );
        }

        return removed;
    } catch {
        return 0;
    }
}
