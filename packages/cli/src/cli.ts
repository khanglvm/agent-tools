import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectInstalledAgents, agents } from './agents.js';
import { showMenu } from './prompts/menu.js';
import { showPastePrompt } from './prompts/paste.js';
import { showGitHubPrompt } from './prompts/github.js';

async function main() {
    const args = process.argv.slice(2);

    p.intro(pc.bgCyan(pc.black(' mcpget ')));

    // Detect installed agents
    const installedAgents = detectInstalledAgents();

    if (installedAgents.length === 0) {
        p.log.warn('No AI coding agents detected on your system.');
        p.log.info('Supported agents: Claude Code, Cursor, Windsurf, Antigravity, and more.');
        p.outro('Install an AI coding agent first, then run mcpget again.');
        process.exit(0);
    }

    p.log.info(`Detected ${installedAgents.length} agent(s): ${installedAgents.map(a => agents[a].displayName).join(', ')}`);

    // Parse args
    if (args.length === 0) {
        // Interactive menu
        await showMenu(installedAgents);
    } else if (args[0] === '--paste') {
        // Paste mode
        await showPastePrompt(installedAgents);
    } else if (args[0] === '--build') {
        // Build mode (not yet implemented)
        p.log.info('Build mode - coming soon');
    } else if (args[0].startsWith('http')) {
        // GitHub URL
        await showGitHubPrompt(installedAgents, args[0]);
    } else {
        p.log.error(`Unknown argument: ${args[0]}`);
        p.log.info('Usage: npx mcpget [--paste | --build | <github-url>]');
    }

    p.outro('Done!');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

