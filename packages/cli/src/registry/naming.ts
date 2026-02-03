/**
 * Server naming utilities
 * Handles mcpm prefix for installed servers
 */

import type { AgentType } from '../types.js';

/** Prefix for mcpm-managed servers in snake_case agents */
export const MCPM_PREFIX_SNAKE = 'mcpm_';

/** Prefix for mcpm-managed servers in camelCase agents */
export const MCPM_PREFIX_CAMEL = 'mcpm';

/**
 * Agents that use camelCase for server names
 */
const CAMEL_CASE_AGENTS: Set<AgentType> = new Set([
    // Most agents use snake_case, but some newer ones use camelCase
    // This can be expanded as needed based on research
]);

/**
 * Check if agent uses camelCase naming
 */
export function usesCamelCase(agent: AgentType): boolean {
    return CAMEL_CASE_AGENTS.has(agent);
}

/**
 * Add mcpm prefix to a server name for a specific agent
 */
export function addPrefix(name: string, agent: AgentType): string {
    if (usesCamelCase(agent)) {
        // camelCase: mcpmGithub
        return MCPM_PREFIX_CAMEL + name.charAt(0).toUpperCase() + name.slice(1);
    }
    // snake_case: mcpm_github
    return MCPM_PREFIX_SNAKE + name;
}

/**
 * Remove mcpm prefix from a server name
 */
export function removePrefix(prefixedName: string): string {
    if (prefixedName.startsWith(MCPM_PREFIX_SNAKE)) {
        return prefixedName.slice(MCPM_PREFIX_SNAKE.length);
    }
    if (prefixedName.startsWith(MCPM_PREFIX_CAMEL)) {
        const rest = prefixedName.slice(MCPM_PREFIX_CAMEL.length);
        // Convert first char back to lowercase
        return rest.charAt(0).toLowerCase() + rest.slice(1);
    }
    return prefixedName;
}

/**
 * Check if a server name has mcpm prefix
 */
export function hasPrefix(name: string): boolean {
    return name.startsWith(MCPM_PREFIX_SNAKE) || name.startsWith(MCPM_PREFIX_CAMEL);
}

/**
 * Get the clean registry name from an installed server name
 */
export function toRegistryName(installedName: string): string {
    return hasPrefix(installedName) ? removePrefix(installedName) : installedName;
}

/**
 * Get the installed name from a registry name for a specific agent
 */
export function toInstalledName(registryName: string, agent: AgentType): string {
    return addPrefix(registryName, agent);
}
