import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AgentType, ParsedMcpConfig } from '../types.js';
import { parseConfig } from '../parsers/detect.js';
import { showToolSelector } from './tools.js';
import { showEnvPrompts } from './env.js';

/**
 * Show paste configuration prompt
 */
export async function showPastePrompt(installedAgents: AgentType[]) {
    p.log.info('Paste your MCP configuration below.');
    p.log.info(pc.dim('Supports JSON or YAML format. Press Enter twice to submit.'));

    const input = await p.text({
        message: 'MCP Configuration:',
        placeholder: '{ "mcpServers": { ... } }',
        validate(value) {
            if (!value || value.trim().length === 0) {
                return 'Configuration is required';
            }
            // Basic validation - will do full parsing after
            const trimmed = value.trim();
            if (!trimmed.startsWith('{') && !trimmed.includes(':')) {
                return 'Invalid format. Must be JSON or YAML';
            }
        },
    });

    if (p.isCancel(input)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
    }

    // Parse the configuration
    const s = p.spinner();
    s.start('Parsing configuration...');

    let parsed: ParsedMcpConfig;
    try {
        parsed = parseConfig(input);
        s.stop('Configuration parsed successfully');
    } catch (err) {
        s.stop('Failed to parse configuration');
        p.log.error(err instanceof Error ? err.message : 'Unknown error');
        return;
    }

    // Show what we found
    const serverNames = Object.keys(parsed.servers);
    p.log.info(`Detected format: ${parsed.sourceFormat.toUpperCase()} with "${parsed.sourceWrapperKey}" wrapper`);
    p.log.info(`Found ${serverNames.length} server(s): ${serverNames.join(', ')}`);

    // Prompt for env vars if any have null values
    const configWithEnv = await showEnvPrompts(parsed);

    // Select tools to install
    await showToolSelector(installedAgents, configWithEnv);
}
