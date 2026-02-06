import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectInstalledAgents, agents } from './agents.js';
import { showMenu } from './prompts/menu.js';
import { showPastePrompt } from './prompts/paste.js';
import { showGitPrompt } from './prompts/github.js';
import { runBuildMode } from './prompts/build.js';
import { runCommand } from './commands/index.js';

/**
 * Detect if input looks like direct MCP config data (JSON/YAML/TOML)
 * vs a URL or CLI command
 */
function isDirectConfig(input: string): boolean {
    const trimmed = input.trim();

    // Skip URLs and CLI commands
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
    if (trimmed.startsWith('-')) return false;

    // JSON: starts with {
    if (trimmed.startsWith('{')) return true;

    // TOML: starts with [ for section
    if (trimmed.startsWith('[')) return true;

    // YAML/TOML with known wrapper keys
    const configPatterns = [
        /^\s*mcpServers\s*[:\=]/im,
        /^\s*mcp_servers\s*[:\=]/im,
        /^\s*servers\s*[:\=]/im,
        /^\s*context_servers\s*[:\=]/im,
        /^\s*\[mcpServers\]/im,
        /^\s*\[mcp_servers\]/im,
    ];

    return configPatterns.some(p => p.test(trimmed));
}

/**
 * Detect if URL points directly to a raw config file
 * (e.g., raw.githubusercontent.com/.../mcp.json)
 */
function isRawConfigUrl(url: string): boolean {
    // Known raw file hosts
    const rawHosts = [
        'raw.githubusercontent.com',
        'raw.github.com',
        'gist.githubusercontent.com',
        'gitlab.com/-/raw/',
        'gitlab.com/.../raw/',
    ];

    // Check if URL is from a raw host
    const isRawHost = rawHosts.some(host => url.includes(host));

    // Check for config file extensions
    const configExtensions = ['.json', '.yaml', '.yml', '.toml'];
    const hasConfigExt = configExtensions.some(ext => url.toLowerCase().endsWith(ext));

    // Also detect URLs with /raw/ path segment and config extension
    const hasRawPath = url.includes('/raw/') || url.includes('/-/raw/');

    return isRawHost || (hasRawPath && hasConfigExt) || hasConfigExt;
}

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
    } else if (isDirectConfig(args[0])) {
        // Direct JSON/YAML/TOML config data passed as argument
        const { showDirectConfigPrompt } = await import('./prompts/direct.js');
        await showDirectConfigPrompt(installedAgents, args[0]);
    } else if (args[0].startsWith('http') && isRawConfigUrl(args[0])) {
        // URL pointing directly to a config file (raw GitHub, etc.)
        const { showRawConfigPrompt } = await import('./prompts/raw-url.js');
        await showRawConfigPrompt(installedAgents, args[0]);
    } else if (args[0].startsWith('http')) {
        // Git repository URL with optional --env:KEY=VALUE, --header:KEY=VALUE, --agent:<name>, --scope:, -y, and --note:"text" args
        const url = args[0];
        const preEnv: Record<string, string | import('./types.js').CliEnvConfig> = {};
        const preHeaders: Record<string, string | import('./types.js').CliEnvConfig> = {};
        const preAgents: import('./types.js').AgentType[] = [];
        let note: string | undefined;
        let autoMode = false;
        let autoSelectAll = false;
        let scope: import('./types.js').InstallScope = 'global';

        // Parse --env:KEY=VALUE::modifier, --header:KEY=VALUE::modifier, --agent:<name>, --scope:, -y, and --note:"text" args
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];

            // Parse -y flag (auto mode)
            if (arg === '-y' || arg === '--yes') {
                autoMode = true;
                continue;
            }

            // Parse --scope:global or --scope:project
            if (arg.startsWith('--scope:')) {
                const scopeValue = arg.slice('--scope:'.length);
                if (scopeValue === 'global' || scopeValue === 'project') {
                    scope = scopeValue;
                } else {
                    p.log.warn(`Unknown scope: ${scopeValue}. Using 'global'.`);
                }
                continue;
            }

            // Parse -a (short alias for --agent:all)
            if (arg === '-a') {
                autoSelectAll = true;
                continue;
            }

            // Parse --agent:<agent-name> or --agent:all
            if (arg.startsWith('--agent:')) {
                const agentName = arg.slice('--agent:'.length);
                // Handle --agent:all
                if (agentName === 'all') {
                    autoSelectAll = true;
                    continue;
                }
                // Dynamic import to avoid circular dependency
                const { isValidAgentType } = await import('./agents.js');
                if (isValidAgentType(agentName)) {
                    if (!preAgents.includes(agentName)) {
                        preAgents.push(agentName);
                    }
                } else {
                    p.log.warn(`Unknown agent: ${agentName}`);
                }
                continue;
            }

            // Helper to parse KEY=VALUE::modifiers
            const parseCredentialArg = (prefix: string): { key: string; config: string | import('./types.js').CliEnvConfig } | null => {
                if (!arg.startsWith(prefix)) return null;

                const part = arg.slice(prefix.length);
                const segments = part.split('::');
                const keyValuePart = segments[0];
                const modifiers = segments.slice(1);

                const eqIndex = keyValuePart.indexOf('=');
                if (eqIndex <= 0) return null;

                const key = keyValuePart.slice(0, eqIndex);
                const value = keyValuePart.slice(eqIndex + 1) || null;

                // If no modifiers, use simple string value
                if (modifiers.length === 0) {
                    return { key, config: value ?? '' };
                }

                // Parse modifiers into CliEnvConfig
                const config: import('./types.js').CliEnvConfig = { value };

                for (const mod of modifiers) {
                    if (mod === 'hidden') {
                        config.hidden = true;
                    } else if (mod === 'optional') {
                        config.required = false;
                    } else if (mod.startsWith('description=')) {
                        config.description = mod.slice(12).replace(/^["']|["']$/g, '');
                    } else if (mod.startsWith('note=')) {
                        config.note = mod.slice(5).replace(/^["']|["']$/g, '');
                    }
                }

                return { key, config };
            };

            // Parse --env:KEY=VALUE::modifiers
            const envResult = parseCredentialArg('--env:');
            if (envResult) {
                preEnv[envResult.key] = envResult.config;
                continue;
            }

            // Parse --header:KEY=VALUE::modifiers
            const headerResult = parseCredentialArg('--header:');
            if (headerResult) {
                preHeaders[headerResult.key] = headerResult.config;
                continue;
            }

            if (arg.startsWith('--note:')) {
                note = arg.slice(7); // Remove "--note:"
            }
        }

        // Build auto options
        const autoOptions: import('./types.js').AutoOptions = {
            enabled: autoMode,
            scope,
            preAgents: preAgents.length > 0 ? preAgents : undefined,
            autoSelectAll,
        };

        const completed = await showGitPrompt(installedAgents, url, preEnv, note, preHeaders, preAgents, autoOptions);

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
