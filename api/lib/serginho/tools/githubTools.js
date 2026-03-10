/**
 * api/lib/serginho/tools/githubTools.js
 * Camada de orquestração de tools GitHub para uso interno do Serginho.
 *
 * Regra do projeto: NADA executa fora do Serginho.
 * Este módulo expõe as tools GitHub como objetos estruturados que o Serginho
 * orchestrator pode descobrir, validar e executar.
 *
 * Funções exportadas:
 *   - runGitHubListReposTool()                          → lista repositórios
 *   - runGitHubListBranchesTool({ owner, repo })        → lista branches
 *   - runGitHubGetFileTool({ owner, repo, path, ref })  → obtém conteúdo de arquivo
 *
 * Descritores de tool exportados:
 *   - GITHUB_LIST_REPOS_TOOL
 *   - GITHUB_LIST_BRANCHES_TOOL
 *   - GITHUB_GET_FILE_TOOL
 *
 * Formato de retorno padronizado (igual ao gateway):
 *   Sucesso: { success: true, data: <result> }
 *   Erro:    { success: false, error: { code: string, message: string, details?: string } }
 *
 * Segurança:
 *   - Validação de parâmetros ocorre ANTES de chamar o gateway
 *   - A feature flag é verificada ANTES de chamar o gateway
 *   - NUNCA chama githubService diretamente — apenas o gateway do Serginho
 *   - NUNCA vaza token ou stacktrace para o chamador
 */

import { getGitHubConfig } from '../../github/githubConfig.js';
import {
  serginhoListRepos,
  serginhoListBranches,
  serginhoGetFile,
} from '../githubGateway.js';

// ---------------------------------------------------------------------------
// Helper de resposta de erro
// ---------------------------------------------------------------------------

/**
 * @param {string} code
 * @param {string} message
 * @param {string} [details]
 * @returns {{ success: false, error: { code: string, message: string, details?: string } }}
 */
function fail(code, message, details) {
  const error = { code, message };
  if (details != null) {
    error.details = details;
  }
  return { success: false, error };
}

// ---------------------------------------------------------------------------
// Verificação de feature flag (antes de chamar o gateway)
// ---------------------------------------------------------------------------

/**
 * Verifica se a integração GitHub está habilitada.
 * Retorna null se habilitada, ou um resultado de erro se desabilitada.
 *
 * @returns {{ success: false, error: object } | null}
 */
function checkFeatureFlag() {
  const config = getGitHubConfig();
  if (!config.enabled) {
    return fail(
      'GITHUB_DISABLED',
      'A integração com GitHub está desabilitada.',
      'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tool run functions — chamadas pelo Serginho orchestrator
// ---------------------------------------------------------------------------

/**
 * Executa a tool de listagem de repositórios do usuário autenticado.
 *
 * @returns {Promise<{ success: true, data: { repos: object[], mode: string } }
 *                 | { success: false, error: { code: string, message: string, details?: string } }>}
 */
export async function runGitHubListReposTool() {
  const flagError = checkFeatureFlag();
  if (flagError) return flagError;

  return serginhoListRepos();
}

/**
 * Executa a tool de listagem de branches de um repositório.
 *
 * @param {{ owner: string, repo: string }} params
 * @returns {Promise<{ success: true, data: { branches: object[], mode: string } }
 *                 | { success: false, error: { code: string, message: string, details?: string } }>}
 */
export async function runGitHubListBranchesTool({ owner, repo } = {}) {
  if (!owner || !repo) {
    return fail(
      'GITHUB_VALIDATION_ERROR',
      'Os parâmetros owner e repo são obrigatórios.',
    );
  }

  const flagError = checkFeatureFlag();
  if (flagError) return flagError;

  return serginhoListBranches({ owner, repo });
}

/**
 * Executa a tool de obtenção de conteúdo de um arquivo em um repositório.
 *
 * @param {{ owner: string, repo: string, path: string, ref?: string }} params
 * @returns {Promise<{ success: true, data: { file: object, mode: string } }
 *                 | { success: false, error: { code: string, message: string, details?: string } }>}
 */
export async function runGitHubGetFileTool({ owner, repo, path, ref } = {}) {
  if (!owner || !repo || !path) {
    return fail(
      'GITHUB_VALIDATION_ERROR',
      'Os parâmetros owner, repo e path são obrigatórios.',
    );
  }

  const flagError = checkFeatureFlag();
  if (flagError) return flagError;

  return serginhoGetFile({ owner, repo, path, ref });
}

// ---------------------------------------------------------------------------
// Descritores de tool — usados pelo registry e pelo Serginho orchestrator
// ---------------------------------------------------------------------------

/** @type {{ name: string, description: string, parameters: object, execute: Function }} */
export const GITHUB_LIST_REPOS_TOOL = {
  name: 'github_list_repos',
  description: 'Lista repositórios do usuário autenticado no GitHub',
  parameters: {},
  execute: runGitHubListReposTool,
};

/** @type {{ name: string, description: string, parameters: object, execute: Function }} */
export const GITHUB_LIST_BRANCHES_TOOL = {
  name: 'github_list_branches',
  description: 'Lista branches de um repositório no GitHub',
  parameters: {
    owner: {
      type: 'string',
      required: true,
      description: 'Dono do repositório (usuário ou organização)',
    },
    repo: {
      type: 'string',
      required: true,
      description: 'Nome do repositório',
    },
  },
  execute: runGitHubListBranchesTool,
};

/** @type {{ name: string, description: string, parameters: object, execute: Function }} */
export const GITHUB_GET_FILE_TOOL = {
  name: 'github_get_file',
  description: 'Obtém o conteúdo de um arquivo em um repositório do GitHub',
  parameters: {
    owner: {
      type: 'string',
      required: true,
      description: 'Dono do repositório (usuário ou organização)',
    },
    repo: {
      type: 'string',
      required: true,
      description: 'Nome do repositório',
    },
    path: {
      type: 'string',
      required: true,
      description: 'Caminho do arquivo no repositório',
    },
    ref: {
      type: 'string',
      required: false,
      description: 'Branch, tag ou commit SHA (opcional)',
    },
  },
  execute: runGitHubGetFileTool,
};
