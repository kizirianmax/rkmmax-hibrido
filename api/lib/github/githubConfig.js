/**
 * githubConfig.js
 * Feature flag e leitura segura de variáveis de ambiente para integração GitHub.
 *
 * FEATURE FLAG: GITHUB_INTEGRATION_ENABLED
 *   - default: false (seguro para produção)
 *   - Nada de GitHub real roda se a flag estiver false
 *
 * TODO (GitHub App — futuro):
 *   (1) Fluxo de instalação do GitHub App (instalar app no repo/org do usuário)
 *   (2) Callback de instalação → receber installation_id
 *   (3) Storage do installation_id (ex.: Supabase — tabela github_installations)
 *   (4) Geração de token por instalação (JWT assinado com private key → exchange por token)
 */

/**
 * Lê e valida a configuração de integração GitHub a partir do ambiente.
 * @returns {GitHubConfig}
 */
export function getGitHubConfig() {
  const enabled =
    process.env.GITHUB_INTEGRATION_ENABLED === 'true' ||
    process.env.GITHUB_INTEGRATION_ENABLED === '1';

  // Determina o modo de operação: stub | oauth | app (futuro)
  let mode = 'stub';
  if (enabled) {
    if (process.env.GITHUB_TOKEN) {
      mode = 'oauth';
    }
    // TODO: adicionar 'app' quando GitHub App for implementado
    // if (process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY) {
    //   mode = 'app';
    // }
  }

  return {
    enabled,
    mode,
    // Nunca expor tokens/segredos; apenas indicar presença
    hasToken: !!process.env.GITHUB_TOKEN,
    apiBaseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
    timeoutMs: parseInt(process.env.GITHUB_REQUEST_TIMEOUT_MS || '8000', 10),
  };
}

/**
 * @typedef {Object} GitHubConfig
 * @property {boolean} enabled - Flag principal de integração
 * @property {'stub'|'oauth'|'app'} mode - Modo de operação atual
 * @property {boolean} hasToken - Indica se GITHUB_TOKEN está definido (sem expor o valor)
 * @property {string} apiBaseUrl - URL base da API GitHub
 * @property {number} timeoutMs - Timeout para requisições HTTP (ms)
 */
