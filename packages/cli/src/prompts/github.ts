import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType } from '../types.js';
import { fetchFromGitHub, parseGitHubUrl } from '../github/extractor.js';
import { showEnvPrompts } from './env.js';
import { showToolSelector } from './tools.js';

/**
 * Handle GitHub URL input and extraction
 */
export async function showGitHubPrompt(
    installedAgents: AgentType[],
    initialUrl?: string
) {
    let url = initialUrl;

    if (!url) {
        const urlInput = await p.text({
            message: 'Enter the GitHub repository URL:',
            placeholder: 'https://github.com/owner/repo',
            validate(value) {
                if (!value) return 'URL is required';
                if (!parseGitHubUrl(value)) return 'Invalid GitHub URL';
            },
        });

        if (p.isCancel(urlInput)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }

        url = urlInput;
    }

    // Validate URL
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
        p.log.error('Invalid GitHub URL');
        return;
    }

    p.log.info(`Fetching from ${pc.cyan(`${parsed.owner}/${parsed.repo}`)}...`);

    const s = p.spinner();
    s.start('Looking for MCP configuration...');

    try {
        const config = await fetchFromGitHub(url);

        if (!config) {
            s.stop('No MCP configuration found');
            p.log.error('Could not find mcp.json or MCP config in README.md');
            p.log.info('Make sure the repository contains:');
            p.log.info('  • mcp.json file, or');
            p.log.info('  • JSON/YAML code block with mcpServers in README.md');
            return;
        }

        const serverNames = Object.keys(config.servers);
        s.stop(`Found ${serverNames.length} server(s): ${serverNames.join(', ')}`);

        // Prompt for env vars
        const configWithEnv = await showEnvPrompts(config);

        // Select tools
        await showToolSelector(installedAgents, configWithEnv);

    } catch (err) {
        s.stop('Failed to fetch configuration');
        p.log.error(err instanceof Error ? err.message : 'Unknown error');
    }
}
