import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { ParsedMcpConfig, EnvVarSchema, McpServerConfig } from '../types.js';

/**
 * Prompt for env variables that have null values (require user input)
 */
export async function showEnvPrompts(config: ParsedMcpConfig): Promise<ParsedMcpConfig> {
    const result = { ...config, servers: { ...config.servers } };

    for (const [serverName, serverConfig] of Object.entries(config.servers)) {
        if (!serverConfig.env) continue;

        const envNeeded = Object.entries(serverConfig.env).filter(([_, value]) => {
            if (value === null) return true;
            if (typeof value === 'object' && value !== null && 'value' in value) {
                return (value as EnvVarSchema).value === null;
            }
            return false;
        });

        if (envNeeded.length === 0) continue;

        p.log.info(`\n${pc.bold(serverName)} requires ${envNeeded.length} environment variable(s):`);

        const newEnv: Record<string, string> = { ...serverConfig.env as Record<string, string> };

        for (const [key, schema] of envNeeded) {
            const isExtended = typeof schema === 'object' && schema !== null;
            const description = isExtended ? (schema as EnvVarSchema).description : undefined;
            const helpUrl = isExtended ? (schema as EnvVarSchema).helpUrl : undefined;
            const isHidden = isExtended ? (schema as EnvVarSchema).hidden : key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');

            // Show description if available
            if (description) {
                p.log.info(pc.dim(description));
            }

            // Show help URL with warning
            if (helpUrl) {
                p.log.warn(`Link from config author (verify before visiting):`);
                p.log.info(pc.dim(`  ${helpUrl}`));
            }

            let value: string | symbol;

            if (isHidden) {
                value = await p.password({
                    message: `${key}:`,
                    validate(v) {
                        if (!v) return `${key} is required`;
                    },
                });
            } else {
                value = await p.text({
                    message: `${key}:`,
                    validate(v) {
                        if (!v) return `${key} is required`;
                    },
                });
            }

            if (p.isCancel(value)) {
                p.cancel('Operation cancelled.');
                process.exit(0);
            }

            newEnv[key] = value;
        }

        result.servers[serverName] = {
            ...serverConfig,
            env: newEnv,
        };
    }

    return result;
}
