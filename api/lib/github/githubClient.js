/**
 * githubClient.js
 * Wrapper HTTP para a API do GitHub.
 * Oferece: timeout configurável, retry simples e tratamento de erro consistente.
 * Nunca loga nem retorna tokens/segredos.
 */

import { getGitHubConfig } from './githubConfig.js';

/**
 * Realiza uma requisição autenticada à API do GitHub.
 * Suporta timeout e retry com back-off linear simples.
 *
 * @param {string} path - Caminho relativo da API (ex.: '/user/repos')
 * @param {RequestOptions} [options={}]
 * @returns {Promise<GitHubResponse>}
 * @throws {GitHubClientError}
 */
export async function githubRequest(path, options = {}) {
  const config = getGitHubConfig();
  const { method = 'GET', body, headers: extraHeaders = {}, retries = 1 } = options;

  const url = `${config.apiBaseUrl}${path}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'rkmmax-hibrido/1.0',
    ...extraHeaders,
  };

  // Adiciona token se disponível (nunca logado)
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let lastError;
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        timeoutMs: config.timeoutMs,
      });

      if (!response.ok) {
        const errorBody = await safeJson(response);
        throw new GitHubClientError(
          `GitHub API error: ${response.status}`,
          response.status,
          errorBody?.message || response.statusText,
        );
      }

      const data = await safeJson(response);
      return { status: response.status, data };
    } catch (err) {
      lastError = err;
      // Não fazer retry em erros de auth (401/403) ou not found (404)
      if (err instanceof GitHubClientError && [401, 403, 404].includes(err.statusCode)) {
        break;
      }
      // Back-off linear: aguarda attempt * 200ms antes de tentar novamente
      if (attempt < maxAttempts) {
        await sleep(attempt * 200);
      }
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * fetch com timeout via AbortController.
 * @param {string} url
 * @param {{ method: string, headers: object, body?: string, timeoutMs: number }} opts
 */
async function fetchWithTimeout(url, opts) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    return await fetch(url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new GitHubClientError(`GitHub API timeout after ${opts.timeoutMs}ms`, 504, 'Timeout');
    }
    throw new GitHubClientError(`GitHub API network error: ${err.message}`, 502, 'NetworkError');
  } finally {
    clearTimeout(timerId);
  }
}

/** Tenta parsear JSON sem lançar exceção. */
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Aguarda ms milissegundos. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Erro padronizado do cliente GitHub.
 * Nunca inclui tokens/segredos na mensagem.
 */
export class GitHubClientError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [reason]
   */
  constructor(message, statusCode, reason) {
    super(message);
    this.name = 'GitHubClientError';
    this.statusCode = statusCode;
    this.reason = reason || 'Unknown';
  }
}

/**
 * @typedef {Object} RequestOptions
 * @property {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [method='GET']
 * @property {object} [body]
 * @property {object} [headers]
 * @property {number} [retries=1] - Número de retentativas além da primeira
 */

/**
 * @typedef {Object} GitHubResponse
 * @property {number} status
 * @property {*} data
 */
