import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType } from '../types.js';
import { fetchFromGit, parseGitUrl } from '../git/index.js';
import { showEnvPrompts } from './env.js';
import { showToolSelector } from './tools.js';
import { plural } from './shared.js';

/**
 * Supported git providers for display
 */
const SUPPORTED_PROVIDERS = ['GitHub', 'GitLab', 'Bitbucket', 'Codeberg'];

/**
 * Handle Git URL input and extraction (supports GitHub, GitLab, Bitbucket, Codeberg)
 * @param installedAgents - List of detected agents
 * @param initialUrl - Optional pre-filled URL
 * @param preEnv - Optional pre-configured env values from CLI args
 * @param note - Optional note to display for user guidance
 * @returns true if flow completed, false if cancelled
 */
export async function showGitPrompt(
    installedAgents: AgentType[],
    initialUrl?: string,
    preEnv?: Record<string, string>,
    note?: string
): Promise<boolean> {
    let url = initialUrl;

    if (!url) {
        const urlInput = await p.text({
            message: 'Enter repository URL:',
            placeholder: 'https://github.com/owner/repo',
            validate(value) {
                if (!value) return 'URL is required';
                if (!parseGitUrl(value)) {
                    return `Unsupported URL. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`;
                }
            },
        });

        if (p.isCancel(urlInput)) {
            p.log.info('Cancelled');
            return false;
        }

        url = urlInput;
    }

    // Parse and validate URL
    const parsed = parseGitUrl(url);
    if (!parsed) {
        p.log.error('Could not parse repository URL');
        p.log.info(`Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`);
        p.log.info('Expected format: https://[provider]/owner/repo');
        return false;
    }

    const s = p.spinner();
    s.start(`Fetching from ${pc.cyan(parsed.provider)}: ${parsed.owner}/${parsed.repo}...`);

    try {
        const config = await fetchFromGit(url);

        if (!config) {
            s.stop('');
            p.log.warn([
                'Could not find MCP config. Make sure the repository contains:',
                '  • mcp.json file, or',
                '  • JSON/YAML code block with mcpServers in README.md',
            ].join('\n'));
            return false;
        }

        const serverNames = Object.keys(config.servers);
        s.stop(`Found ${plural(serverNames.length, 'server')} in ${pc.cyan(`${parsed.owner}/${parsed.repo}`)}: ${serverNames.join(', ')}`);

        // Display note if provided
        if (note) {
            p.log.info(pc.dim(`Note: ${note}`));
        }

        // Merge pre-configured env values into config and track which keys
        const preconfiguredKeys = new Set<string>();
        if (preEnv && Object.keys(preEnv).length > 0) {
            for (const serverName of serverNames) {
                const server = config.servers[serverName];
                if (server.env) {
                    for (const [key, value] of Object.entries(preEnv)) {
                        if (key in server.env) {
                            server.env[key] = value;
                            preconfiguredKeys.add(key);
                        }
                    }
                }
            }
        }

        // Prompt for env vars, passing preconfigured keys for hint
        const configWithEnv = await showEnvPrompts(config, preconfiguredKeys);

        // If user cancelled, exit
        if (!configWithEnv) {
            return false;
        }

        // Select tools
        await showToolSelector(installedAgents, configWithEnv);
        return true;

    } catch (err) {
        s.stop('Failed to fetch configuration');
        p.log.error(err instanceof Error ? err.message : 'Unknown error');
        return false;
    }
}

// Keep backward compatibility alias
export const showGitHubPrompt = showGitPrompt;
