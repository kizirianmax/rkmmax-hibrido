/**
 * githubTypes.js
 * Definições de tipos (JSDoc) para padronizar os retornos da integração GitHub.
 * Este arquivo é documentação — não exporta lógica.
 */

/**
 * @typedef {Object} GitHubConfig
 * @property {boolean} enabled        - Integração habilitada via feature flag
 * @property {'stub'|'oauth'|'app'} mode - Modo de operação: stub (mock), oauth (token pessoal), app (GitHub App — futuro)
 * @property {boolean} hasToken       - Indica se GITHUB_TOKEN está definido (sem expor o valor)
 * @property {string} apiBaseUrl      - URL base da API GitHub
 * @property {number} timeoutMs       - Timeout para requisições HTTP em ms
 */

/**
 * @typedef {Object} GitHubRepo
 * @property {number} id            - ID numérico do repositório
 * @property {string} name          - Nome curto do repositório
 * @property {string} fullName      - Nome completo (owner/repo)
 * @property {boolean} private      - Indica se é privado
 * @property {string} defaultBranch - Branch padrão (ex.: 'main')
 * @property {string|null} description - Descrição do repositório
 * @property {string} url           - URL HTML do repositório
 * @property {string} updatedAt     - ISO 8601 da última atualização
 */

/**
 * @typedef {Object} GitHubBranch
 * @property {string} name      - Nome da branch
 * @property {string|null} sha  - SHA do commit HEAD
 * @property {boolean} protected - Indica se a branch está protegida
 */

/**
 * @typedef {Object} GitHubFileContent
 * @property {string} name      - Nome do arquivo
 * @property {string} path      - Caminho relativo no repositório
 * @property {string} sha       - SHA do conteúdo (blob)
 * @property {number} size      - Tamanho em bytes
 * @property {string} encoding  - Encoding do conteúdo (geralmente 'base64')
 * @property {string|null} content - Conteúdo codificado
 * @property {string} url       - URL HTML do arquivo
 */

/**
 * @typedef {Object} GitHubStatusResponse
 * @property {boolean} enabled  - Flag de integração
 * @property {'stub'|'oauth'|'app'} mode - Modo de operação
 * @property {string} message   - Mensagem descritiva para o cliente
 */

/**
 * @typedef {Object} GitHubClientError
 * @property {string} name       - 'GitHubClientError'
 * @property {string} message    - Mensagem de erro (sem tokens/segredos)
 * @property {number} statusCode - HTTP status code
 * @property {string} reason     - Motivo resumido
 */
