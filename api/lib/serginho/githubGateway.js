/**
 * api/lib/serginho/githubGateway.js
 * Gateway interno do Serginho para integração GitHub (read-only, backend only).
 *
 * Regra do projeto: NADA executa fora do Serginho.
 * Este módulo é o único ponto de entrada para que o Serginho acesse a integração GitHub.
 *
 * Funções exportadas:
 *   - serginhoListRepos()                          → lista repositórios do usuário
 *   - serginhoListBranches({ owner, repo })        → lista branches de um repositório
 *   - serginhoGetFile({ owner, repo, path, ref })  → obtém conteúdo de arquivo
 *
 * Formato de retorno padronizado:
 *   Sucesso: { success: true, data: <result> }
 *   Erro:    { success: false, error: { code: string, message: string, details?: string } }
 *
 * Códigos de erro:
 *   GITHUB_DISABLED          - feature flag GITHUB_INTEGRATION_ENABLED desabilitada
 *   GITHUB_NO_TOKEN          - modo oauth sem GITHUB_TOKEN configurado
 *   GITHUB_VALIDATION_ERROR  - parâmetros obrigatórios ausentes (owner/repo/path)
 *   GITHUB_API_ERROR         - erro na chamada à API real do GitHub
 *
 * Segurança:
 *   - NUNCA vaza token ou stacktrace para o chamador
 *   - Modo stub NUNCA chama a API real
 *   - Mensagens de erro são sanitizadas antes de retornar
 */

import { getGitHubConfig } from '../github/githubConfig.js';
import { listRepos, listBranches, getFile } from '../github/githubService.js';
import { GitHubClientError } from '../github/githubClient.js';
import { sanitizeMessage } from '../github/githubErrors.js';

// ---------------------------------------------------------------------------
// Stub data — modo stub NUNCA chama a API real
// ---------------------------------------------------------------------------

/** Repos mock para modo stub (dados genéricos, sem informações reais). */
const STUB_REPOS = [
  {
    id: 1,
    name: 'exemplo-repo',
    fullName: 'usuario/exemplo-repo',
    private: false,
    defaultBranch: 'main',
    description: 'Repositório de exemplo (modo stub)',
    url: 'https://github.com/usuario/exemplo-repo',
    updatedAt: new Date().toISOString(),
  },
];

/** Branches mock para modo stub. */
const STUB_BRANCHES = [
  { name: 'main', sha: 'abc1234567890abcdef', protected: true },
  { name: 'develop', sha: 'def9876543210fedcba', protected: false },
];

/** Conteúdo de arquivo mock para modo stub. */
const STUB_FILE = {
  name: 'exemplo.md',
  path: 'exemplo.md',
  sha: 'aabbccdd11223344',
  size: 30,
  encoding: 'base64',
  content: Buffer.from('Arquivo de exemplo (modo stub)').toString('base64'),
  url: 'https://github.com/usuario/exemplo-repo/blob/main/exemplo.md',
};

// ---------------------------------------------------------------------------
// Helpers de resposta
// ---------------------------------------------------------------------------

/** @param {*} data @returns {{ success: true, data: * }} */
function ok(data) {
  return { success: true, data };
}

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
// Gateway público — Serginho é o único consumidor
// ---------------------------------------------------------------------------

/**
 * Lista repositórios do usuário autenticado via Serginho gateway.
 *
 * @returns {Promise<{ success: true, data: { repos: object[], mode: string } }
 *                 | { success: false, error: { code: string, message: string, details?: string } }>}
 */
export async function serginhoListRepos() {
  const config = getGitHubConfig();

  if (!config.enabled) {
    return fail(
      'GITHUB_DISABLED',
      'A integração com GitHub está desabilitada.',
      'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
    );
  }

  if (config.mode === 'stub') {
    return ok({ repos: STUB_REPOS, mode: 'stub' });
  }

  if (!config.hasToken) {
    return fail(
      'GITHUB_NO_TOKEN',
      'Token GitHub não configurado para modo oauth.',
      'Defina GITHUB_TOKEN no ambiente.',
    );
  }

  try {
    const repos = await listRepos();
    return ok({ repos, mode: 'oauth' });
  } catch (err) {
    return handleServiceError(err);
  }
}

/**
 * Lista branches de um repositório via Serginho gateway.
 *
 * @param {{ owner: string, repo: string }} params
 * @returns {Promise<{ success: true, data: { branches: object[], mode: string } }
 *                 | { success: false, error: { code: string, message: string, details?: string } }>}
 */
export async function serginhoListBranches({ owner, repo } = {}) {
  if (!owner || !repo) {
    return fail(
      'GITHUB_VALIDATION_ERROR',
      'Os parâmetros owner e repo são obrigatórios.',
    );
  }

  const config = getGitHubConfig();

  if (!config.enabled) {
    return fail(
      'GITHUB_DISABLED',
      'A integração com GitHub está desabilitada.',
      'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
    );
  }

  if (config.mode === 'stub') {
    return ok({ branches: STUB_BRANCHES, mode: 'stub' });
  }

  if (!config.hasToken) {
    return fail(
      'GITHUB_NO_TOKEN',
      'Token GitHub não configurado para modo oauth.',
      'Defina GITHUB_TOKEN no ambiente.',
    );
  }

  try {
    const branches = await listBranches(owner, repo);
    return ok({ branches, mode: 'oauth' });
  } catch (err) {
    return handleServiceError(err);
  }
}

/**
 * Obtém conteúdo de um arquivo em um repositório via Serginho gateway.
 *
 * @param {{ owner: string, repo: string, path: string, ref?: string }} params
 * @returns {Promise<{ success: true, data: { file: object, mode: string } }
 *                 | { success: false, error: { code: string, message: string, details?: string } }>}
 */
export async function serginhoGetFile({ owner, repo, path, ref } = {}) {
  if (!owner || !repo || !path) {
    return fail(
      'GITHUB_VALIDATION_ERROR',
      'Os parâmetros owner, repo e path são obrigatórios.',
    );
  }

  const config = getGitHubConfig();

  if (!config.enabled) {
    return fail(
      'GITHUB_DISABLED',
      'A integração com GitHub está desabilitada.',
      'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
    );
  }

  if (config.mode === 'stub') {
    return ok({ file: STUB_FILE, mode: 'stub' });
  }

  if (!config.hasToken) {
    return fail(
      'GITHUB_NO_TOKEN',
      'Token GitHub não configurado para modo oauth.',
      'Defina GITHUB_TOKEN no ambiente.',
    );
  }

  try {
    const file = await getFile(owner, repo, path, ref);
    return ok({ file, mode: 'oauth' });
  } catch (err) {
    return handleServiceError(err);
  }
}

// ---------------------------------------------------------------------------
// Tratamento de erros (sem stacktrace, sem tokens)
// ---------------------------------------------------------------------------

/**
 * Mapeia erros do githubService para o formato padronizado do gateway.
 * Nunca vaza stacktrace ou tokens.
 *
 * @param {Error} err
 * @returns {{ success: false, error: object }}
 */
function handleServiceError(err) {
  if (err instanceof GitHubClientError) {
    const safeReason =
      err.reason && err.reason !== 'Unknown' ? sanitizeMessage(err.reason) : undefined;
    return fail('GITHUB_API_ERROR', 'Erro na integração GitHub.', safeReason);
  }
  // Erro inesperado — nunca vazar stacktrace
  return fail('GITHUB_API_ERROR', 'Ocorreu um erro inesperado na integração GitHub.');
}
