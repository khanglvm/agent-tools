import * as p from '@clack/prompts';
import * as readline from 'node:readline';
import type { AgentType, ParsedMcpConfig } from '../types.js';
import { parseConfig } from '../parsers/detect.js';
import { showToolSelector } from './tools.js';
import { showEnvPrompts } from './env.js';

/**
 * Drain any buffered stdin input
 */
function drainStdin(): Promise<void> {
    return new Promise((resolve) => {
        if (process.stdin.readable) {
            process.stdin.resume();
            // Read and discard any buffered data
            const drain = () => {
                while (process.stdin.read() !== null) {
                    // Discard
                }
            };
            drain();
            // Small delay to ensure buffer is clear
            setTimeout(() => {
                drain();
                resolve();
            }, 100);
        } else {
            resolve();
        }
    });
}

/**
 * Read multiline input until empty line or complete JSON
 */
async function readMultilineInput(): Promise<string | null> {
    return new Promise((resolve) => {
        const lines: string[] = [];
        let emptyLineCount = 0;

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            prompt: '',
        });

        console.log('  Paste your config (press Enter twice when done):');
        console.log('');

        const checkComplete = (): boolean => {
            const text = lines.join('\n').trim();
            if (!text) return false;

            // Count braces to detect complete JSON
            let braceCount = 0;
            for (const char of text) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }

            return braceCount === 0 && text.length > 0 && text.startsWith('{');
        };

        rl.on('line', (line) => {
            if (line === '') {
                emptyLineCount++;
                if (emptyLineCount >= 2) {
                    rl.close();
                    resolve(lines.join('\n').trim() || null);
                    return;
                }
            } else {
                emptyLineCount = 0;
            }

            lines.push(line);

            // Auto-complete if JSON looks complete
            if (checkComplete()) {
                rl.close();
                resolve(lines.join('\n').trim());
            }
        });

        rl.on('close', () => {
            resolve(lines.join('\n').trim() || null);
        });

        rl.on('SIGINT', () => {
            rl.close();
            resolve(null);
        });
    });
}

/**
 * Show paste configuration prompt with multiline support
 */
export async function showPastePrompt(installedAgents: AgentType[]) {
    p.log.info('Paste your MCP configuration (JSON or YAML)');

    const input = await readMultilineInput();

    if (!input) {
        p.log.info('Cancelled');
        return;
    }

    // Basic validation
    const trimmed = input.trim();
    if (!trimmed.startsWith('{') && !trimmed.includes(':')) {
        p.log.error('Invalid format. Must be JSON or YAML');
        return;
    }

    // Show spinner during parsing
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

    // Drain stdin buffer before showing next prompt
    await drainStdin();

    // Show what we found
    const serverNames = Object.keys(parsed.servers);
    p.log.info(`Detected format: ${parsed.sourceFormat.toUpperCase()} with "${parsed.sourceWrapperKey}" wrapper`);
    p.log.info(`Found ${serverNames.length} server(s): ${serverNames.join(', ')}`);

    // Prompt for env vars if any have null values
    const configWithEnv = await showEnvPrompts(parsed);

    // Drain again before tool selector
    await drainStdin();

    // Select tools to install
    await showToolSelector(installedAgents, configWithEnv);
}
