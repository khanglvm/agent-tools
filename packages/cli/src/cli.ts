import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectInstalledAgents, agents } from './agents.js';
import { showMenu } from './prompts/menu.js';
import { showPastePrompt } from './prompts/paste.js';
import { showGitHubPrompt } from './prompts/github.js';
import { runBuildMode } from './prompts/build.js';
import { runCommand } from './commands/index.js';

async function main() {
    const args = process.argv.slice(2);

    p.intro(pc.bgCyan(pc.black(' Model Context Protocol Manager ')));

    // Detect installed agents
    const installedAgents = detectInstalledAgents();

    if (installedAgents.length === 0) {
        p.log.warn('No AI coding agents detected on your system.');
        p.log.info('Supported agents: Claude Code, Cursor, Windsurf, Antigravity, and more.');
        p.outro('Install an AI coding agent first, then run mcpm again.');
        process.exit(0);
    }


    // Parse args
    if (args.length === 0) {
        // Interactive menu
        await showMenu(installedAgents);
    } else if (args[0] === '--paste') {
        // Paste mode
        await showPastePrompt(installedAgents);
    } else if (args[0] === '--build') {
        // Build mode
        await runBuildMode();
    } else if (args[0].startsWith('http')) {
        // GitHub URL with optional --env:KEY=VALUE and --note:"text" args
        const url = args[0];
        const preEnv: Record<string, string | import('./types.js').CliEnvConfig> = {};
        let note: string | undefined;

        // Parse --env:KEY=VALUE::modifier and --note:"text" args
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--env:')) {
                const envPart = arg.slice(6); // Remove "--env:"

                // Split by :: to get modifiers
                const segments = envPart.split('::');
                const keyValuePart = segments[0];
                const modifiers = segments.slice(1);

                const eqIndex = keyValuePart.indexOf('=');
                if (eqIndex > 0) {
                    const key = keyValuePart.slice(0, eqIndex);
                    const value = keyValuePart.slice(eqIndex + 1) || null;

                    // If no modifiers, use simple string value
                    if (modifiers.length === 0) {
                        preEnv[key] = value ?? '';
                    } else {
                        // Parse modifiers into CliEnvConfig
                        const config: import('./types.js').CliEnvConfig = { value };

                        for (const mod of modifiers) {
                            if (mod === 'hidden') {
                                config.hidden = true;
                            } else if (mod === 'optional') {
                                config.required = false;
                            } else if (mod.startsWith('description=')) {
                                // Remove quotes if present
                                config.description = mod.slice(12).replace(/^["']|["']$/g, '');
                            } else if (mod.startsWith('helpUrl=')) {
                                config.helpUrl = mod.slice(8).replace(/^["']|["']$/g, '');
                            }
                        }

                        preEnv[key] = config;
                    }
                }
            } else if (arg.startsWith('--note:')) {
                note = arg.slice(7); // Remove "--note:"
            }
        }

        const completed = await showGitHubPrompt(installedAgents, url, preEnv, note);

        // If cancelled, show interactive menu instead of exiting
        if (!completed) {
            await showMenu(installedAgents);
        }
    } else {
        // Try as CLI command (list, add, remove, sync, status)
        const handled = await runCommand(args[0], args.slice(1));
        if (!handled) {
            p.log.error(`Unknown command: ${args[0]}`);
            p.log.info('Usage: mcpm [list|add|remove|sync|status] or mcpm [--paste|--build|<url>]');
        }
    }

    p.outro('Exit');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
