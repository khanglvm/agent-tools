import * as p from '@clack/prompts';
import type { AgentType, ConfigSource } from '../types.js';
import { showPastePrompt } from './paste.js';
import { showGitHubPrompt } from './github.js';

/**
 * Show interactive menu when run without arguments
 */
export async function showMenu(installedAgents: AgentType[]) {
    const source = await p.select<ConfigSource>({
        message: 'How would you like to provide the MCP configuration?',
        options: [
            {
                value: 'paste',
                label: '📋 Paste JSON/YAML configuration',
                hint: 'Copy from README or mcp.json'
            },
            {
                value: 'build',
                label: '🔧 Build configuration step-by-step',
                hint: 'Create from scratch'
            },
            {
                value: 'github',
                label: '🔗 Enter GitHub repository URL',
                hint: 'Auto-extract from repo'
            },
        ],
    });

    if (p.isCancel(source)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
    }

    switch (source) {
        case 'paste':
            await showPastePrompt(installedAgents);
            break;
        case 'build':
            p.log.info('Build mode - coming soon');
            break;
        case 'github':
            await showGitHubPrompt(installedAgents);
            break;
    }
}

