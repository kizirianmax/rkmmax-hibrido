/**
 * githubErrors.js
 * Helpers para formatação padronizada de erros da integração GitHub.
 *
 * Formato de resposta de erro:
 *   { error: { code: string, message: string, details?: string } }
 *
 * Regras:
 *   - NUNCA expõe stacktrace ao cliente
 *   - NUNCA expõe tokens, headers ou dados brutos de requisição
 *   - Sempre inclui code (machine-readable) e message (human-readable)
 */

/**
 * Cria o objeto de resposta de erro padronizado.
 *
 * @param {string} code    - Código de erro machine-readable (ex.: 'GITHUB_DISABLED')
 * @param {string} message - Mensagem legível por humanos
 * @param {string} [details] - Contexto adicional opcional (sem dados sensíveis)
 * @returns {{ error: { code: string, message: string, details?: string } }}
 */
export function formatErrorResponse(code, message, details) {
  const error = { code, message };
  if (details != null) {
    error.details = details;
  }
  return { error };
}

/**
 * Mapeia um GitHubClientError para o status HTTP e o corpo de resposta padronizado.
 * Nunca deixa vazar tokens/segredos na mensagem.
 *
 * @param {import('./githubClient.js').GitHubClientError} err
 * @returns {{ status: number, body: object }}
 */
export function mapClientError(err) {
  const status = err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502;

  if (status === 401 || status === 403) {
    return {
      status,
      body: formatErrorResponse(
        'GITHUB_UNAUTHORIZED',
        'Acesso não autorizado à API do GitHub.',
        'Verifique se o token GitHub é válido e possui as permissões necessárias.',
      ),
    };
  }

  if (status === 404) {
    return {
      status,
      body: formatErrorResponse(
        'GITHUB_NOT_FOUND',
        'Recurso não encontrado na API do GitHub.',
        err.reason && err.reason !== 'Unknown' ? sanitizeMessage(err.reason) : undefined,
      ),
    };
  }

  if (status === 504) {
    return {
      status,
      body: formatErrorResponse(
        'GITHUB_TIMEOUT',
        'Tempo limite excedido ao consultar a API do GitHub.',
      ),
    };
  }

  return {
    status,
    body: formatErrorResponse(
      'GITHUB_API_ERROR',
      'Erro na integração GitHub.',
      err.reason && err.reason !== 'Unknown' ? sanitizeMessage(err.reason) : undefined,
    ),
  };
}

/**
 * Remove possíveis tokens/segredos de uma mensagem de erro antes de enviá-la ao cliente.
 * Aplica uma lista de padrões conhecidos de tokens do GitHub.
 *
 * @param {string} msg
 * @returns {string}
 */
export function sanitizeMessage(msg) {
  if (typeof msg !== 'string') return 'Erro desconhecido';
  // Remove padrões de tokens GitHub (ghp_, gho_, ghx_, etc.)
  return msg.replace(/gh[a-z]_[A-Za-z0-9_]+/g, '[REDACTED]');
}
