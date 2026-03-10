/**
 * api/github.js
 * Endpoints backend mínimos para integração GitHub (Construtor).
 *
 * Rotas disponíveis (via query param ?route=):
 *   GET /api/github?route=status            → sempre 200; { enabled, mode, message }
 *   GET /api/github?route=repos             → lista repositórios
 *   GET /api/github?route=branches&owner=X&repo=Y  → lista branches
 *   GET /api/github?route=file&owner=X&repo=Y&path=Z[&ref=R]  → conteúdo de arquivo
 *
 * Segurança:
 *   - Nunca loga nem retorna tokens/segredos
 *   - Não envia stacktrace ao cliente
 *   - Valida método HTTP e inputs antes de chamar o service
 *   - Feature flag GITHUB_INTEGRATION_ENABLED=false por padrão
 *
 * Formato de erro padronizado:
 *   { error: { code: string, message: string, details?: string } }
 */

import { getGitHubConfig } from './lib/github/githubConfig.js';
import { listRepos, listBranches, getFile } from './lib/github/githubService.js';
import { GitHubClientError } from './lib/github/githubClient.js';
import { formatErrorResponse, mapClientError } from './lib/github/githubErrors.js';

// ---------------------------------------------------------------------------
// Stub data — nunca chama a API real em modo stub
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
// Handler principal
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Roteamento interno baseado em query string: ?route=status|repos|branches|file
  const route = req.query?.route || 'status';

  if (route === 'status') {
    return handleStatus(req, res);
  }
  if (route === 'repos') {
    return handleRepos(req, res);
  }
  if (route === 'branches') {
    return handleBranches(req, res);
  }
  if (route === 'file') {
    return handleFile(req, res);
  }

  return res.status(404).json(formatErrorResponse('NOT_FOUND', 'Rota não encontrada.'));
}

// ---------------------------------------------------------------------------
// GET /api/github?route=status
// ---------------------------------------------------------------------------

function handleStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(formatErrorResponse('METHOD_NOT_ALLOWED', 'Método não permitido.'));
  }

  const config = getGitHubConfig();
  const body = {
    enabled: config.enabled,
    mode: config.mode,
    message: config.enabled
      ? `Integração GitHub habilitada (modo: ${config.mode})`
      : 'Integração GitHub desabilitada. Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
  };

  return res.status(200).json(body);
}

// ---------------------------------------------------------------------------
// GET /api/github?route=repos
// ---------------------------------------------------------------------------

async function handleRepos(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(formatErrorResponse('METHOD_NOT_ALLOWED', 'Método não permitido.'));
  }

  const config = getGitHubConfig();

  if (!config.enabled) {
    return res.status(501).json(
      formatErrorResponse(
        'GITHUB_DISABLED',
        'A integração com GitHub está desabilitada neste ambiente.',
        'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
      ),
    );
  }

  if (config.mode === 'stub') {
    return res.status(200).json({ repos: STUB_REPOS, mode: 'stub' });
  }

  if (!config.hasToken) {
    return res.status(401).json(
      formatErrorResponse(
        'GITHUB_NO_TOKEN',
        'Token GitHub não configurado.',
        'Defina GITHUB_TOKEN no ambiente.',
      ),
    );
  }

  try {
    const repos = await listRepos();
    return res.status(200).json({ repos, mode: 'oauth' });
  } catch (err) {
    return handleGitHubError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/github?route=branches&owner=X&repo=Y
// ---------------------------------------------------------------------------

async function handleBranches(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(formatErrorResponse('METHOD_NOT_ALLOWED', 'Método não permitido.'));
  }

  const config = getGitHubConfig();

  if (!config.enabled) {
    return res.status(501).json(
      formatErrorResponse(
        'GITHUB_DISABLED',
        'A integração com GitHub está desabilitada neste ambiente.',
        'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
      ),
    );
  }

  const { owner, repo } = req.query || {};
  if (!owner || !repo) {
    return res.status(400).json(
      formatErrorResponse(
        'MISSING_PARAMS',
        'Os parâmetros owner e repo são obrigatórios.',
        'Exemplo: ?route=branches&owner=usuario&repo=nome-repo',
      ),
    );
  }

  if (config.mode === 'stub') {
    return res.status(200).json({ branches: STUB_BRANCHES, mode: 'stub' });
  }

  if (!config.hasToken) {
    return res.status(401).json(
      formatErrorResponse(
        'GITHUB_NO_TOKEN',
        'Token GitHub não configurado.',
        'Defina GITHUB_TOKEN no ambiente.',
      ),
    );
  }

  try {
    const branches = await listBranches(owner, repo);
    return res.status(200).json({ branches, mode: 'oauth' });
  } catch (err) {
    return handleGitHubError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/github?route=file&owner=X&repo=Y&path=Z[&ref=R]
// ---------------------------------------------------------------------------

async function handleFile(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(formatErrorResponse('METHOD_NOT_ALLOWED', 'Método não permitido.'));
  }

  const config = getGitHubConfig();

  if (!config.enabled) {
    return res.status(501).json(
      formatErrorResponse(
        'GITHUB_DISABLED',
        'A integração com GitHub está desabilitada neste ambiente.',
        'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
      ),
    );
  }

  const { owner, repo, path } = req.query || {};
  if (!owner || !repo || !path) {
    return res.status(400).json(
      formatErrorResponse(
        'MISSING_PARAMS',
        'Os parâmetros owner, repo e path são obrigatórios.',
        'Exemplo: ?route=file&owner=usuario&repo=nome-repo&path=src/index.js',
      ),
    );
  }

  if (config.mode === 'stub') {
    return res.status(200).json({ file: STUB_FILE, mode: 'stub' });
  }

  if (!config.hasToken) {
    return res.status(401).json(
      formatErrorResponse(
        'GITHUB_NO_TOKEN',
        'Token GitHub não configurado.',
        'Defina GITHUB_TOKEN no ambiente.',
      ),
    );
  }

  try {
    const ref = req.query?.ref || undefined;
    const file = await getFile(owner, repo, path, ref);
    return res.status(200).json({ file, mode: 'oauth' });
  } catch (err) {
    return handleGitHubError(err, res);
  }
}

// ---------------------------------------------------------------------------
// Tratamento de erros (sem stacktrace, sem tokens/segredos)
// ---------------------------------------------------------------------------

function handleGitHubError(err, res) {
  if (err instanceof GitHubClientError) {
    const { status, body } = mapClientError(err);
    return res.status(status).json(body);
  }

  console.error('[github] Unexpected error:', err?.message);
  return res.status(500).json(
    formatErrorResponse(
      'INTERNAL_ERROR',
      'Ocorreu um erro inesperado. Tente novamente.',
    ),
  );
}
