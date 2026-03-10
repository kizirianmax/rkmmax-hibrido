/**
 * githubService.js
 * Funções de negócio para integração com a API do GitHub.
 *
 * Implementadas (reais, usando OAuth token):
 *   - listRepos       → lista repositórios do usuário autenticado
 *   - listBranches    → lista branches de um repositório
 *   - getFile         → obtém conteúdo de um arquivo
 *
 * Stubs (NotImplemented — serão implementados futuramente):
 *   - putFile         → cria/atualiza arquivo em um repositório
 *   - createPR        → cria pull request
 *
 * TODO (GitHub App — futuro):
 *   (1) Substituir token OAuth por token gerado via instalação do GitHub App
 *   (2) Aceitar installation_id como parâmetro para gerar token temporário
 */

import { githubRequest, GitHubClientError } from './githubClient.js';

/** Número máximo de itens por página permitido pela API GitHub. */
const MAX_PER_PAGE = 100;

// ---------------------------------------------------------------------------
// Funções reais
// ---------------------------------------------------------------------------

/**
 * Lista repositórios do usuário autenticado.
 * @param {{ sort?: string, per_page?: number, page?: number }} [params]
 * @returns {Promise<GitHubRepo[]>}
 */
export async function listRepos(params = {}) {
  const { sort = 'updated', per_page = 30, page = 1 } = params;
  const query = new URLSearchParams({
    sort,
    per_page: String(Math.min(per_page, MAX_PER_PAGE)),
    page: String(page),
  });
  const { data } = await githubRequest(`/user/repos?${query}`);
  return (data || []).map(normalizeRepo);
}

/**
 * Lista branches de um repositório.
 * @param {string} owner - Dono do repositório (usuário ou org)
 * @param {string} repo  - Nome do repositório
 * @returns {Promise<GitHubBranch[]>}
 */
export async function listBranches(owner, repo) {
  if (!owner || !repo) {
    throw new GitHubClientError('owner e repo são obrigatórios', 400, 'ValidationError');
  }
  const { data } = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`);
  return (data || []).map(normalizeBranch);
}

/**
 * Obtém o conteúdo de um arquivo em um repositório.
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath - Caminho do arquivo dentro do repo (ex.: 'src/index.js')
 * @param {string} [ref]    - Branch, tag ou commit SHA (padrão: branch default do repo)
 * @returns {Promise<GitHubFileContent>}
 */
export async function getFile(owner, repo, filePath, ref) {
  if (!owner || !repo || !filePath) {
    throw new GitHubClientError('owner, repo e filePath são obrigatórios', 400, 'ValidationError');
  }
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const { data } = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}${query}`,
  );
  return normalizeFile(data);
}

// ---------------------------------------------------------------------------
// Stubs — Not Implemented
// ---------------------------------------------------------------------------

/**
 * [STUB] Cria ou atualiza um arquivo em um repositório.
 * @throws {Error} NotImplemented
 */
export async function putFile() {
  throw Object.assign(new Error('putFile: não implementado. Use a API do GitHub diretamente.'), {
    code: 'NOT_IMPLEMENTED',
  });
}

/**
 * [STUB] Cria um pull request em um repositório.
 * @throws {Error} NotImplemented
 */
export async function createPR() {
  throw Object.assign(new Error('createPR: não implementado. Use a API do GitHub diretamente.'), {
    code: 'NOT_IMPLEMENTED',
  });
}

// ---------------------------------------------------------------------------
// Normalizadores — garantem formato de retorno estável
// ---------------------------------------------------------------------------

/** @param {object} raw @returns {GitHubRepo} */
function normalizeRepo(raw) {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    private: raw.private,
    defaultBranch: raw.default_branch,
    description: raw.description || null,
    url: raw.html_url,
    updatedAt: raw.updated_at,
  };
}

/** @param {object} raw @returns {GitHubBranch} */
function normalizeBranch(raw) {
  return {
    name: raw.name,
    sha: raw.commit?.sha || null,
    protected: raw.protected,
  };
}

/** @param {object} raw @returns {GitHubFileContent} */
function normalizeFile(raw) {
  return {
    name: raw.name,
    path: raw.path,
    sha: raw.sha,
    size: raw.size,
    encoding: raw.encoding || 'base64',
    content: raw.content || null,
    url: raw.html_url,
  };
}
