/**
 * api/github.js
 * Endpoints backend mínimos para integração GitHub (Construtor).
 *
 * Rotas disponíveis:
 *   GET /api/github/status  → sempre 200; retorna { enabled, mode, message }
 *   GET /api/github/repos   → lista repositórios (comportamento varia conforme flag/modo)
 *
 * Segurança:
 *   - Nunca loga nem retorna tokens/segredos
 *   - Não envia stacktrace ao cliente
 *   - Valida método HTTP e inputs
 *   - Feature flag GITHUB_INTEGRATION_ENABLED=false por padrão
 */

import { getGitHubConfig } from './lib/github/githubConfig.js';
import { listRepos } from './lib/github/githubService.js';
import { GitHubClientError } from './lib/github/githubClient.js';

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Roteamento interno baseado em query string: ?route=status|repos
  // Vercel mapeia /api/github/status → /api/github?route=status (via vercel.json rewrites)
  const route = req.query?.route || 'status';

  if (route === 'status') {
    return handleStatus(req, res);
  }
  if (route === 'repos') {
    return handleRepos(req, res);
  }

  return res.status(404).json({ error: 'Rota não encontrada' });
}

// ---------------------------------------------------------------------------
// GET /api/github/status
// ---------------------------------------------------------------------------

function handleStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getGitHubConfig();
  /** @type {import('./lib/github/githubTypes.js').GitHubStatusResponse} */
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
// GET /api/github/repos
// ---------------------------------------------------------------------------

async function handleRepos(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getGitHubConfig();

  // Feature flag desabilitada → 501
  if (!config.enabled) {
    return res.status(501).json({
      error: 'Integração GitHub não implementada',
      message:
        'A integração com GitHub está desabilitada neste ambiente. ' +
        'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
    });
  }

  // Modo stub → retorna mock sem chamar a API real
  if (config.mode === 'stub') {
    return res.status(200).json({ repos: STUB_REPOS, mode: 'stub' });
  }

  // Modo oauth → precisa de token
  if (!config.hasToken) {
    return res.status(401).json({
      error: 'Token GitHub não configurado',
      message:
        'A integração GitHub está habilitada, mas o token de acesso não foi configurado. ' +
        'Defina GITHUB_TOKEN no ambiente.',
    });
  }

  // Modo oauth com token → chama API real
  try {
    const repos = await listRepos();
    return res.status(200).json({ repos, mode: 'oauth' });
  } catch (err) {
    return handleGitHubError(err, res);
  }
}

// ---------------------------------------------------------------------------
// Tratamento de erros (sem stacktrace, sem tokens/segredos)
// ---------------------------------------------------------------------------

function handleGitHubError(err, res) {
  if (err instanceof GitHubClientError) {
    const status = err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502;
    // Mapeia erros de auth para mensagens seguras
    if (status === 401 || status === 403) {
      return res.status(status).json({
        error: 'Acesso não autorizado à API do GitHub',
        message: 'Verifique se o token GitHub é válido e possui as permissões necessárias.',
      });
    }
    return res.status(status).json({
      error: 'Erro na integração GitHub',
      message: err.reason || 'Erro desconhecido',
    });
  }

  // Erro inesperado — nunca expõe stacktrace
  console.error('[github] Unexpected error:', err?.message);
  return res.status(500).json({
    error: 'Erro interno',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  });
}
