/**
 * CLI Commands - mcpm subcommands
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType } from '../types.js';
import { listServers, removeServer } from '../registry/index.js';
import { detectInstalledAgents, getAgentConfig } from '../agents.js';
import { syncRegistryToAgents, showSyncSummary, detectDuplicates, detectDrift } from '../core/sync.js';
import { runImportMode } from '../core/import.js';
import { runBuildMode } from '../prompts/build.js';
import { isCancel } from '@clack/prompts';

/**
 * mcpm list - Show all servers in registry
 */
export async function cmdList(): Promise<void> {
    const servers = listServers();

    if (servers.length === 0) {
        p.log.info('No servers in registry. Run `mcpm add` to add one.');
        return;
    }

    p.log.info(`Registry (${servers.length} server${servers.length > 1 ? 's' : ''}):`);

    for (const server of servers) {
        const value = server.transport === 'stdio'
            ? `${server.command} ${server.args?.join(' ') || ''}`
            : server.url;

        console.log(`  ${server.name} (${server.transport})`);
        console.log(`    ${value}`);

        if (server.env && Object.keys(server.env).length > 0) {
            const envCount = Object.keys(server.env).length;
            console.log(`    ${envCount} env var${envCount > 1 ? 's' : ''}`);
        }
    }
}

/**
 * mcpm add - Add a new server interactively
 */
export async function cmdAdd(): Promise<void> {
    const result = await runBuildMode();

    if (result) {
        p.log.success(`Server "${result.server.name}" added to registry`);

        const sync = await p.confirm({
            message: 'Sync to installed agents now?',
            initialValue: true,
        });

        if (!isCancel(sync) && sync) {
            await cmdSync([result.server.name]);
        }
    }
}

/**
 * mcpm remove - Remove a server from registry
 */
export async function cmdRemove(serverName?: string): Promise<void> {
    const servers = listServers();

    if (servers.length === 0) {
        p.log.warn('No servers in registry');
        return;
    }

    let nameToRemove = serverName;

    if (!nameToRemove) {
        const selected = await p.select({
            message: 'Select server to remove',
            options: servers.map(s => ({
                value: s.name,
                label: s.name,
                hint: s.transport,
            })),
        });

        if (isCancel(selected)) {
            return;
        }

        nameToRemove = selected;
    }

    // Use color here - this is a destructive action
    const confirm = await p.confirm({
        message: pc.red(`Remove "${nameToRemove}" from registry?`),
        initialValue: false,
    });

    if (isCancel(confirm) || !confirm) {
        p.log.info('Not removed');
        return;
    }

    removeServer(nameToRemove);
    p.log.success(`Removed "${nameToRemove}" from registry`);
    p.log.info('Note: Server configs in agents are preserved.');
}

/**
 * mcpm sync - Sync registry to agents
 */
export async function cmdSync(serverNames?: string[]): Promise<void> {
    const agents = detectInstalledAgents();

    if (agents.length === 0) {
        p.log.warn('No agents detected');
        return;
    }

    const servers = listServers();
    if (servers.length === 0) {
        p.log.warn('No servers in registry to sync');
        return;
    }

    const toSync = serverNames
        ? servers.filter(s => serverNames.includes(s.name))
        : servers;

    p.log.info(`Syncing ${toSync.length} server(s) to ${agents.length} agent(s)...`);

    const spin = p.spinner();
    spin.start('Syncing...');

    const results = await syncRegistryToAgents({
        serverNames,
        strategy: 'skip',
        interactive: false,
    });

    spin.stop('Sync complete');

    showSyncSummary(results);
}

/**
 * mcpm status - Show sync status and drift
 */
export async function cmdStatus(): Promise<void> {
    const agents = detectInstalledAgents();
    const servers = listServers();

    p.log.info('Registry:');
    p.log.info(`  ${servers.length} server(s)`);

    p.log.info('Agents:');
    p.log.info(`  ${agents.length} detected`);

    const duplicates = await detectDuplicates(agents);
    if (duplicates.size > 0) {
        // Use color - needs attention
        p.log.warn(pc.yellow('Conflicts:'));
        for (const [agent, conflicts] of duplicates) {
            const agentName = getAgentConfig(agent).displayName;
            p.log.warn(`  ${agentName}: ${conflicts.map(c => c.serverName).join(', ')}`);
        }
    }

    const drift = await detectDrift(agents);
    if (drift.size > 0) {
        // Use color - needs attention
        p.log.warn(pc.yellow('Drift (config mismatch):'));
        for (const [agent, drifted] of drift) {
            const agentName = getAgentConfig(agent).displayName;
            p.log.warn(`  ${agentName}: ${drifted.join(', ')}`);
        }
    }

    if (duplicates.size === 0 && drift.size === 0) {
        p.log.success('All agents in sync');
    }
}

/**
 * Main CLI argument parser
 */
export function parseArgs(args: string[]): { command: string; args: string[] } {
    const command = args[0] || '';
    const cmdArgs = args.slice(1);
    return { command, args: cmdArgs };
}

/**
 * Run CLI command
 */
export async function runCommand(command: string, args: string[]): Promise<boolean> {
    switch (command) {
        case 'list':
        case 'ls':
            await cmdList();
            return true;

        case 'add':
            await cmdAdd();
            return true;

        case 'remove':
        case 'rm':
            await cmdRemove(args[0]);
            return true;

        case 'sync':
            await cmdSync(args.length > 0 ? args : undefined);
            return true;

        case 'status':
            await cmdStatus();
            return true;

        case 'import':
            await runImportMode();
            return true;

        case 'help':
        case '--help':
        case '-h':
            showHelp();
            return true;

        default:
            return false;
    }
}

/**
 * Show help text
 */
function showHelp(): void {
    console.log(`
mcpm - MCP Manager

Usage:
  mcpm                    Interactive menu
  mcpm <command>          Run a command

Commands:
  list, ls                List servers in registry
  add                     Add a new server interactively
  remove, rm [name]       Remove a server from registry
  sync [servers...]       Sync registry to agents
  status                  Show sync status and drift
  import                  Import servers from agents

Options:
  --paste                 Paste JSON/YAML configuration
  --build                 Build configuration step-by-step
  <git-url>               Extract from Git repository (GitHub, GitLab, etc.)
  --env:KEY=VALUE         Pre-configure environment variable

Examples:
  mcpm add
  mcpm sync
  mcpm sync filesystem
  mcpm rm my-server
  mcpm https://github.com/user/repo --env:API_KEY=abc123
`);
}
