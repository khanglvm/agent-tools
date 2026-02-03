import * as p from '@clack/prompts';
import type { AgentType, ConfigSource } from '../types.js';
import { showPastePrompt } from './paste.js';
import { showGitHubPrompt } from './github.js';
import { runBuildMode } from './build.js';
import { cmdList, cmdSync, cmdStatus } from '../commands/index.js';
import { runImportMode } from '../core/import.js';

/**
 * Show interactive menu when run without arguments
 */
export async function showMenu(installedAgents: AgentType[]) {
    while (true) {
        const shouldExit = await showMainMenu(installedAgents);
        if (shouldExit) break;
    }
}

/**
 * Handle Ctrl+C - ask to exit (default yes)
 * Returns true if user wants to exit
 */
async function handleCancel(): Promise<boolean> {
    const confirm = await p.confirm({
        message: 'Exit mcpm?',
        initialValue: true,
    });

    if (p.isCancel(confirm) || confirm) {
        return true; // Exit
    }
    return false; // Continue
}

/**
 * Main menu
 */
async function showMainMenu(installedAgents: AgentType[]): Promise<boolean> {
    const category = await p.select<'add' | 'manage' | 'exit'>({
        message: 'What would you like to do?',
        options: [
            {
                value: 'add',
                label: 'Add MCP Server',
                hint: 'Install a new server',
            },
            {
                value: 'manage',
                label: 'Manage Registry',
                hint: 'List, sync, import, status',
            },
            {
                value: 'exit',
                label: 'Exit',
            },
        ],
    });

    if (p.isCancel(category)) {
        return await handleCancel();
    }

    if (category === 'exit') {
        return true;
    }

    if (category === 'add') {
        const exit = await showAddMenu(installedAgents);
        if (exit) return true;
    } else if (category === 'manage') {
        const exit = await showManageMenu();
        if (exit) return true;
    }

    return false;
}

/**
 * Add server submenu - returns true if should exit
 */
async function showAddMenu(installedAgents: AgentType[]): Promise<boolean> {
    const source = await p.select<ConfigSource | 'back'>({
        message: 'How would you like to provide the configuration?',
        options: [
            {
                value: 'paste',
                label: 'Paste JSON/YAML',
                hint: 'Copy from README or mcp.json',
            },
            {
                value: 'build',
                label: 'Build step-by-step',
                hint: 'Create from scratch',
            },
            {
                value: 'github',
                label: 'GitHub repository',
                hint: 'Auto-extract from repo',
            },
            {
                value: 'back',
                label: 'Back',
            },
        ],
    });

    if (p.isCancel(source)) {
        return await handleCancel();
    }

    if (source === 'back') {
        return false;
    }

    try {
        switch (source) {
            case 'paste':
                await showPastePrompt(installedAgents);
                break;
            case 'build':
                await runBuildMode();
                break;
            case 'github':
                await showGitHubPrompt(installedAgents);
                break;
        }
        await pressEnterToContinue();
    } catch (error) {
        await handleError(error, 'add server');
    }

    return false;
}

/**
 * Manage registry submenu - returns true if should exit
 */
async function showManageMenu(): Promise<boolean> {
    const action = await p.select<'list' | 'sync' | 'import' | 'status' | 'back'>({
        message: 'Registry management',
        options: [
            {
                value: 'list',
                label: 'List servers',
                hint: 'Show all in registry',
            },
            {
                value: 'sync',
                label: 'Sync to agents',
                hint: 'Push registry to all agents',
            },
            {
                value: 'import',
                label: 'Import from agents',
                hint: 'Pull existing servers into registry',
            },
            {
                value: 'status',
                label: 'Check status',
                hint: 'Show drift and conflicts',
            },
            {
                value: 'back',
                label: 'Back',
            },
        ],
    });

    if (p.isCancel(action)) {
        return await handleCancel();
    }

    if (action === 'back') {
        return false;
    }

    try {
        switch (action) {
            case 'list':
                await cmdList();
                break;
            case 'sync':
                await cmdSync();
                break;
            case 'import':
                await runImportMode();
                break;
            case 'status':
                await cmdStatus();
                break;
        }
        await pressEnterToContinue();
    } catch (error) {
        await handleError(error, action);
    }

    return false;
}

/**
 * Simple "press enter to continue"
 */
async function pressEnterToContinue(): Promise<void> {
    const result = await p.text({
        message: 'Press Enter to continue...',
        defaultValue: '',
        placeholder: '',
    });

    if (p.isCancel(result)) {
        // User pressed Ctrl+C, just continue - they're in menu already
        return;
    }
}

/**
 * Handle errors gracefully
 */
async function handleError(error: unknown, action: string): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(`Failed to ${action}: ${message}`);
    await pressEnterToContinue();
}
