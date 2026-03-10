/**
 * api/lib/serginho/tools/index.js
 * Registro/catálogo de tools disponíveis para o Serginho orchestrator.
 *
 * Exporta:
 *   - GITHUB_TOOLS          — array com todos os descritores de tool GitHub
 *   - getToolByName(name)   — busca um tool pelo nome
 *   - getAllTools()         — retorna todos os tools disponíveis
 *   - isGitHubToolsAvailable() — verifica se a integração GitHub está habilitada
 */

import { getGitHubConfig } from '../../github/githubConfig.js';
import {
  GITHUB_LIST_REPOS_TOOL,
  GITHUB_LIST_BRANCHES_TOOL,
  GITHUB_GET_FILE_TOOL,
} from './githubTools.js';

/**
 * Catálogo de tools GitHub disponíveis para o Serginho.
 * @type {Array<{ name: string, description: string, parameters: object, execute: Function }>}
 */
export const GITHUB_TOOLS = [
  GITHUB_LIST_REPOS_TOOL,
  GITHUB_LIST_BRANCHES_TOOL,
  GITHUB_GET_FILE_TOOL,
];

/**
 * Retorna um tool pelo nome, ou null se não encontrado.
 *
 * @param {string} name - Nome do tool (ex: 'github_list_repos')
 * @returns {{ name: string, description: string, parameters: object, execute: Function } | null}
 */
export function getToolByName(name) {
  return GITHUB_TOOLS.find((t) => t.name === name) ?? null;
}

/**
 * Retorna uma cópia do array com todos os tools disponíveis.
 *
 * @returns {Array<{ name: string, description: string, parameters: object, execute: Function }>}
 */
export function getAllTools() {
  return [...GITHUB_TOOLS];
}

/**
 * Verifica se as tools GitHub estão disponíveis (feature flag habilitada).
 *
 * @returns {boolean}
 */
export function isGitHubToolsAvailable() {
  return getGitHubConfig().enabled;
}
