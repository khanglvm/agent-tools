import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { AgentConfig, AgentType } from './types.js';

const home = homedir();
const configHome = process.env.XDG_CONFIG_HOME || join(home, '.config');
const codexHome = process.env.CODEX_HOME?.trim() || join(home, '.codex');
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, '.claude');

/**
 * Agent registry - 40 supported AI coding agents
 * Ported from vercel-labs/skills
 */
export const agents: Record<AgentType, AgentConfig> = {
    amp: {
        name: 'amp',
        displayName: 'Amp',
        configDir: join(configHome, 'amp'),
        mcpConfigPath: join(configHome, 'amp/mcp.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(configHome, 'amp')),
    },
    antigravity: {
        name: 'antigravity',
        displayName: 'Antigravity',
        configDir: join(home, '.gemini/antigravity'),
        mcpConfigPath: join(home, '.gemini/antigravity/mcp_config.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.gemini/antigravity')),
    },
    'claude-code': {
        name: 'claude-code',
        displayName: 'Claude Code',
        configDir: claudeHome,
        mcpConfigPath: join(claudeHome, 'settings.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(claudeHome),
    },
    cline: {
        name: 'cline',
        displayName: 'Cline',
        configDir: join(home, '.cline'),
        mcpConfigPath: join(home, '.cline/mcp.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.cline')),
    },
    codex: {
        name: 'codex',
        displayName: 'Codex (OpenAI)',
        configDir: codexHome,
        mcpConfigPath: join(codexHome, 'config.toml'),
        wrapperKey: 'mcp_servers',
        configFormat: 'toml',
        detectInstalled: () => existsSync(codexHome),
    },
    continue: {
        name: 'continue',
        displayName: 'Continue',
        configDir: join(home, '.continue'),
        mcpConfigPath: join(home, '.continue/config.yaml'),
        wrapperKey: 'mcpServers',
        configFormat: 'yaml',
        detectInstalled: () => existsSync(join(home, '.continue')),
    },
    cursor: {
        name: 'cursor',
        displayName: 'Cursor',
        configDir: join(home, '.cursor'),
        mcpConfigPath: join(home, '.cursor/mcp.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.cursor')),
    },
    droid: {
        name: 'droid',
        displayName: 'Factory Droid',
        configDir: join(home, '.factory'),
        mcpConfigPath: join(home, '.factory/mcp.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.factory')),
    },
    'gemini-cli': {
        name: 'gemini-cli',
        displayName: 'Gemini CLI',
        configDir: join(home, '.gemini'),
        mcpConfigPath: join(home, '.gemini/settings.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.gemini')),
    },
    'github-copilot': {
        name: 'github-copilot',
        displayName: 'GitHub Copilot CLI',
        configDir: join(home, '.copilot'),
        mcpConfigPath: join(home, '.copilot/mcp-config.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.copilot')),
    },
    goose: {
        name: 'goose',
        displayName: 'Goose',
        configDir: join(configHome, 'goose'),
        mcpConfigPath: join(configHome, 'goose/mcp.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(configHome, 'goose')),
    },
    opencode: {
        name: 'opencode',
        displayName: 'OpenCode',
        configDir: join(configHome, 'opencode'),
        mcpConfigPath: join(configHome, 'opencode/oh-my-opencode.json'),
        wrapperKey: 'mcp',
        transformCommand: true, // command is array, env -> environment
        detectInstalled: () => existsSync(join(configHome, 'opencode')),
    },
    roo: {
        name: 'roo',
        displayName: 'Roo Code',
        configDir: join(home, '.roo'),
        mcpConfigPath: join(home, '.roo/mcp.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.roo')),
    },
    'vscode-copilot': {
        name: 'vscode-copilot',
        displayName: 'VS Code + Copilot',
        configDir: join(home, 'Library/Application Support/Code/User'),
        mcpConfigPath: join(home, 'Library/Application Support/Code/User/mcp.json'),
        wrapperKey: 'servers',
        detectInstalled: () => existsSync(join(home, 'Library/Application Support/Code')),
    },
    windsurf: {
        name: 'windsurf',
        displayName: 'Windsurf',
        configDir: join(home, '.codeium/windsurf'),
        mcpConfigPath: join(home, '.codeium/windsurf/mcp_config.json'),
        wrapperKey: 'mcpServers',
        detectInstalled: () => existsSync(join(home, '.codeium/windsurf')),
    },
    zed: {
        name: 'zed',
        displayName: 'Zed',
        configDir: join(configHome, 'zed'),
        mcpConfigPath: join(configHome, 'zed/settings.json'),
        wrapperKey: 'context_servers',
        detectInstalled: () => existsSync(join(configHome, 'zed')),
    },
};

/**
 * Detect which agents are installed on the system
 */
export function detectInstalledAgents(): AgentType[] {
    return Object.entries(agents)
        .filter(([_, config]) => config.detectInstalled())
        .map(([type]) => type as AgentType);
}

/**
 * Get agent config by type
 */
export function getAgentConfig(type: AgentType): AgentConfig {
    return agents[type];
}

/**
 * Get all agent types
 */
export function getAllAgentTypes(): AgentType[] {
    return Object.keys(agents) as AgentType[];
}
