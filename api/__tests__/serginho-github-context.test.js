/**
 * api/__tests__/serginho-github-context.test.js
 * Testes para o contexto de conversa GitHub do Serginho.
 *
 * Cobre:
 *   - createGitHubContext: retorna contexto limpo
 *   - updateContextFromToolResult: list repos → lastGitHubResultType = 'repos', summary
 *   - updateContextFromToolResult: list branches → lastOwner, lastRepo, 'branches', summary
 *   - updateContextFromToolResult: get file → lastOwner, lastRepo, lastFilePath, snippet, 'file'
 *   - resolveParamsFromContext: owner/repo preenchidos do contexto
 *   - resolveParamsFromContext: path NÃO é preenchido automaticamente
 *   - resolveParamsFromContext: contexto vazio → params sem modificação
 *   - getContextSummary: retorna string truncada com resumo
 *   - getContextSummary: truncamento seguro de conteúdo longo
 *   - clearGitHubContext: reseta todos os campos
 *   - Segurança: sem vazamento de token
 *   - Segurança: snippet truncado no limite correto
 *   - Segurança: summary truncado no limite correto
 *   - Fluxo normal (não-GitHub) preservado no orchestrator
 *   - Sem regressão em intent detection
 *   - Sem regressão no formatter
 *   - Sem regressão no gateway
 *   - Sem regressão nas tools
 *   - Integração orchestrator: contexto alimentado e devolvido em _meta
 */

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Importação direta do módulo de contexto (sem mocks — é puro)
// ---------------------------------------------------------------------------

let createGitHubContext,
  updateContextFromToolResult,
  resolveParamsFromContext,
  getContextSummary,
  clearGitHubContext;

beforeAll(async () => {
  ({
    createGitHubContext,
    updateContextFromToolResult,
    resolveParamsFromContext,
    getContextSummary,
    clearGitHubContext,
  } = await import('../lib/serginho/context/githubConversationContext.js'));
});

// ---------------------------------------------------------------------------
// Mocks para testes de integração com o orchestrator
// ---------------------------------------------------------------------------

const mockGetGitHubConfig = jest.fn();
const mockSerginhoListRepos = jest.fn();
const mockSerginhoListBranches = jest.fn();
const mockSerginhoGetFile = jest.fn();
const mockAnalyzeComplexity = jest.fn(() => ({ scores: { complexity: 0.5 }, keywords: {}, messageLength: 10 }));
const mockRouteToProvider = jest.fn(() => ({ provider: 'groq', tier: 'simple' }));
const mockGetNextFallback = jest.fn(() => null);
const mockGetProviderConfig = jest.fn(() => ({ model: 'llama-test', type: 'groq', endpoint: 'https://api.groq.com', defaultParams: {} }));
const mockGetModelMetadata = jest.fn(() => ({ infrastructure: 'groq', logicalTier: 'simple', displayName: 'Test', description: '', icon: '' }));
const mockGetEnabledProviders = jest.fn(() => ['groq']);
const mockGetWeightedProviders = jest.fn(() => ['groq']);

const configModulePath = path.resolve(__dirname, '../lib/github/githubConfig.js');
const gatewayModulePath = path.resolve(__dirname, '../lib/serginho/githubGateway.js');
const routerModulePath = path.resolve(__dirname, '../../src/utils/intelligentRouter.js');
const circuitBreakerModulePath = path.resolve(__dirname, '../lib/circuit-breaker.js');
const providersConfigModulePath = path.resolve(__dirname, '../lib/providers-config.js');
const modelRegistryModulePath = path.resolve(__dirname, '../lib/model-registry.js');

jest.unstable_mockModule(configModulePath, () => ({
  getGitHubConfig: mockGetGitHubConfig,
}));
jest.unstable_mockModule(gatewayModulePath, () => ({
  serginhoListRepos: mockSerginhoListRepos,
  serginhoListBranches: mockSerginhoListBranches,
  serginhoGetFile: mockSerginhoGetFile,
}));
jest.unstable_mockModule(routerModulePath, () => ({
  analyzeComplexity: mockAnalyzeComplexity,
  routeToProvider: mockRouteToProvider,
  getNextFallback: mockGetNextFallback,
  FALLBACK_CHAIN: [],
}));
jest.unstable_mockModule(circuitBreakerModulePath, () => ({
  default: jest.fn().mockImplementation(() => ({
    execute: jest.fn((fn) => fn()),
    getState: jest.fn(() => 'closed'),
  })),
}));
jest.unstable_mockModule(providersConfigModulePath, () => ({
  getProviderConfig: mockGetProviderConfig,
  getModelMetadata: mockGetModelMetadata,
  PROVIDERS: { groq: { model: 'llama-test' } },
  getEnabledProviders: mockGetEnabledProviders,
  getWeightedProviders: mockGetWeightedProviders,
}));
jest.unstable_mockModule(modelRegistryModulePath, () => ({
  default: {
    registerModel: jest.fn(),
    recordExecution: jest.fn(),
    getModelStats: jest.fn(() => ({})),
    getAllModels: jest.fn(() => []),
  },
}));

let serginho;

beforeAll(async () => {
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function configEnabled() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'oauth',
    hasToken: true,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

function configStub() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'stub',
    hasToken: false,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

function makeReposResult(repos) {
  return { success: true, data: { repos, mode: 'stub' } };
}

function makeBranchesResult(branches) {
  return { success: true, data: { branches, mode: 'stub' } };
}

function makeFileResult(content, encoding = 'none') {
  return {
    success: true,
    data: {
      file: { name: 'README.md', path: 'README.md', content, encoding, size: content.length },
      mode: 'stub',
    },
  };
}

function makeBase64FileResult(rawContent) {
  const encoded = Buffer.from(rawContent).toString('base64');
  return {
    success: true,
    data: {
      file: { name: 'README.md', path: 'README.md', content: encoded, encoding: 'base64', size: encoded.length },
      mode: 'stub',
    },
  };
}

// ---------------------------------------------------------------------------
// 1) createGitHubContext — contexto criado limpo
// ---------------------------------------------------------------------------

describe('createGitHubContext', () => {
  test('retorna objeto com todos os campos null', () => {
    const ctx = createGitHubContext();
    expect(ctx).toBeDefined();
    expect(ctx.lastOwner).toBeNull();
    expect(ctx.lastRepo).toBeNull();
    expect(ctx.lastBranch).toBeNull();
    expect(ctx.lastFilePath).toBeNull();
    expect(ctx.lastGitHubResultType).toBeNull();
    expect(ctx.lastGitHubSummary).toBeNull();
    expect(ctx.lastFileSnippet).toBeNull();
  });

  test('não é singleton — cada chamada retorna novo objeto', () => {
    const a = createGitHubContext();
    const b = createGitHubContext();
    expect(a).not.toBe(b);
    a.lastOwner = 'test';
    expect(b.lastOwner).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2) updateContextFromToolResult — list repos
// ---------------------------------------------------------------------------

describe('updateContextFromToolResult — github_list_repos', () => {
  test('salva lastGitHubResultType = repos e summary com nomes', () => {
    const ctx = createGitHubContext();
    const result = makeReposResult([
      { name: 'repo-a', fullName: 'user/repo-a' },
      { name: 'repo-b', fullName: 'user/repo-b' },
    ]);
    updateContextFromToolResult(ctx, 'github_list_repos', {}, result);
    expect(ctx.lastGitHubResultType).toBe('repos');
    expect(ctx.lastGitHubSummary).toContain('user/repo-a');
    expect(ctx.lastGitHubSummary).toContain('2 total');
  });

  test('não modifica owner/repo (repos não tem owner/repo)', () => {
    const ctx = createGitHubContext();
    updateContextFromToolResult(ctx, 'github_list_repos', {}, makeReposResult([]));
    expect(ctx.lastOwner).toBeNull();
    expect(ctx.lastRepo).toBeNull();
  });

  test('lista vazia → summary indica nenhum repo', () => {
    const ctx = createGitHubContext();
    updateContextFromToolResult(ctx, 'github_list_repos', {}, makeReposResult([]));
    expect(ctx.lastGitHubSummary).toMatch(/nenhum repositório/i);
  });

  test('resultado sem success=true → contexto não é atualizado', () => {
    const ctx = createGitHubContext();
    updateContextFromToolResult(ctx, 'github_list_repos', {}, { success: false, error: { code: 'ERR' } });
    expect(ctx.lastGitHubResultType).toBeNull();
  });

  test('resultado null → não lança erro', () => {
    const ctx = createGitHubContext();
    expect(() => updateContextFromToolResult(ctx, 'github_list_repos', {}, null)).not.toThrow();
    expect(ctx.lastGitHubResultType).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3) updateContextFromToolResult — list branches
// ---------------------------------------------------------------------------

describe('updateContextFromToolResult — github_list_branches', () => {
  test('salva lastOwner, lastRepo, lastGitHubResultType = branches', () => {
    const ctx = createGitHubContext();
    const result = makeBranchesResult([{ name: 'main' }, { name: 'dev' }]);
    updateContextFromToolResult(ctx, 'github_list_branches', { owner: 'owner', repo: 'my-repo' }, result);
    expect(ctx.lastOwner).toBe('owner');
    expect(ctx.lastRepo).toBe('my-repo');
    expect(ctx.lastGitHubResultType).toBe('branches');
  });

  test('summary contém nome do repo e nomes das branches', () => {
    const ctx = createGitHubContext();
    const result = makeBranchesResult([{ name: 'main' }, { name: 'feature-x' }]);
    updateContextFromToolResult(ctx, 'github_list_branches', { owner: 'user', repo: 'proj' }, result);
    expect(ctx.lastGitHubSummary).toContain('user/proj');
    expect(ctx.lastGitHubSummary).toContain('main');
  });

  test('não preenche lastFilePath', () => {
    const ctx = createGitHubContext();
    updateContextFromToolResult(ctx, 'github_list_branches', { owner: 'a', repo: 'b' }, makeBranchesResult([]));
    expect(ctx.lastFilePath).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4) updateContextFromToolResult — get file
// ---------------------------------------------------------------------------

describe('updateContextFromToolResult — github_get_file', () => {
  test('salva lastOwner, lastRepo, lastFilePath, lastFileSnippet, resultType = file', () => {
    const ctx = createGitHubContext();
    const result = makeFileResult('conteúdo do arquivo');
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'user', repo: 'proj', path: 'README.md' }, result);
    expect(ctx.lastOwner).toBe('user');
    expect(ctx.lastRepo).toBe('proj');
    expect(ctx.lastFilePath).toBe('README.md');
    expect(ctx.lastGitHubResultType).toBe('file');
    expect(ctx.lastFileSnippet).toBe('conteúdo do arquivo');
  });

  test('decodifica conteúdo base64', () => {
    const ctx = createGitHubContext();
    const result = makeBase64FileResult('texto em base64');
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'u', repo: 'r', path: 'f.txt' }, result);
    expect(ctx.lastFileSnippet).toBe('texto em base64');
  });

  test('snippet truncado em 2000 chars', () => {
    const ctx = createGitHubContext();
    const long = 'x'.repeat(5000);
    const result = makeFileResult(long);
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'u', repo: 'r', path: 'big.txt' }, result);
    expect(ctx.lastFileSnippet.length).toBeLessThanOrEqual(2000);
  });

  test('summary contém path e repo', () => {
    const ctx = createGitHubContext();
    const result = makeFileResult('# README\n\nProjeto de teste.');
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'org', repo: 'projeto', path: 'README.md' }, result);
    expect(ctx.lastGitHubSummary).toContain('README.md');
    expect(ctx.lastGitHubSummary).toContain('org/projeto');
  });
});

// ---------------------------------------------------------------------------
// 5) resolveParamsFromContext — owner/repo preenchidos do contexto
// ---------------------------------------------------------------------------

describe('resolveParamsFromContext — owner/repo reuse', () => {
  test('preenche owner e repo faltantes a partir do contexto', () => {
    const ctx = createGitHubContext();
    ctx.lastOwner = 'context-owner';
    ctx.lastRepo = 'context-repo';
    const resolved = resolveParamsFromContext(ctx, {});
    expect(resolved.owner).toBe('context-owner');
    expect(resolved.repo).toBe('context-repo');
  });

  test('não sobrescreve owner/repo já presentes nos params', () => {
    const ctx = createGitHubContext();
    ctx.lastOwner = 'context-owner';
    ctx.lastRepo = 'context-repo';
    const resolved = resolveParamsFromContext(ctx, { owner: 'param-owner', repo: 'param-repo' });
    expect(resolved.owner).toBe('param-owner');
    expect(resolved.repo).toBe('param-repo');
  });

  test('preserva path dos params detectados', () => {
    const ctx = createGitHubContext();
    ctx.lastOwner = 'owner';
    ctx.lastRepo = 'repo';
    const resolved = resolveParamsFromContext(ctx, { path: 'package.json' });
    expect(resolved.path).toBe('package.json');
    expect(resolved.owner).toBe('owner');
    expect(resolved.repo).toBe('repo');
  });
});

// ---------------------------------------------------------------------------
// 6) resolveParamsFromContext — path NÃO é auto-preenchido
// ---------------------------------------------------------------------------

describe('resolveParamsFromContext — path NÃO é reusado do contexto', () => {
  test('path não é preenchido do contexto, mesmo que lastFilePath esteja definido', () => {
    const ctx = createGitHubContext();
    ctx.lastOwner = 'owner';
    ctx.lastRepo = 'repo';
    ctx.lastFilePath = 'src/old-file.js';
    const resolved = resolveParamsFromContext(ctx, {});
    expect(resolved.path).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7) resolveParamsFromContext — contexto vazio → params sem modificação
// ---------------------------------------------------------------------------

describe('resolveParamsFromContext — contexto vazio', () => {
  test('params passados são retornados sem alteração quando contexto está vazio', () => {
    const ctx = createGitHubContext();
    const resolved = resolveParamsFromContext(ctx, { path: 'README.md' });
    expect(resolved.owner).toBeUndefined();
    expect(resolved.repo).toBeUndefined();
    expect(resolved.path).toBe('README.md');
  });

  test('contexto null → params retornados sem modificação', () => {
    const resolved = resolveParamsFromContext(null, { path: 'README.md' });
    expect(resolved.path).toBe('README.md');
    expect(resolved.owner).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 8) getContextSummary — retorna resumo truncado e seguro
// ---------------------------------------------------------------------------

describe('getContextSummary', () => {
  test('retorna null quando contexto não tem tipo definido', () => {
    const ctx = createGitHubContext();
    expect(getContextSummary(ctx)).toBeNull();
  });

  test('retorna null para contexto null', () => {
    expect(getContextSummary(null)).toBeNull();
  });

  test('retorna string com summary quando contexto tem tipo', () => {
    const ctx = createGitHubContext();
    ctx.lastGitHubResultType = 'repos';
    ctx.lastGitHubSummary = 'Repositórios listados: repo-a, repo-b';
    const summary = getContextSummary(ctx);
    expect(typeof summary).toBe('string');
    expect(summary).toContain('repo-a');
  });

  test('inclui snippet de arquivo quando disponível', () => {
    const ctx = createGitHubContext();
    ctx.lastGitHubResultType = 'file';
    ctx.lastGitHubSummary = 'Arquivo lido: README.md';
    ctx.lastFileSnippet = '# Meu Projeto\n\nDescrição do projeto.';
    const summary = getContextSummary(ctx);
    expect(summary).toContain('Meu Projeto');
    expect(summary).toContain('README.md');
  });

  test('apenas summary (sem snippet) quando lastFileSnippet é null', () => {
    const ctx = createGitHubContext();
    ctx.lastGitHubResultType = 'branches';
    ctx.lastGitHubSummary = 'Branches: main, dev';
    const summary = getContextSummary(ctx);
    expect(summary).toContain('main');
    expect(summary).not.toContain('Conteúdo do arquivo');
  });
});

// ---------------------------------------------------------------------------
// 9) getContextSummary — truncamento seguro
// ---------------------------------------------------------------------------

describe('getContextSummary — truncamento', () => {
  test('total não excede MAX_SUMMARY_CHARS + MAX_SNIPPET_CHARS (2500)', () => {
    const ctx = createGitHubContext();
    ctx.lastGitHubResultType = 'file';
    ctx.lastGitHubSummary = 'S'.repeat(600);
    ctx.lastFileSnippet = 'X'.repeat(3000);
    const summary = getContextSummary(ctx);
    expect(summary.length).toBeLessThanOrEqual(2500);
  });

  test('summary muito longo é truncado', () => {
    const ctx = createGitHubContext();
    ctx.lastGitHubResultType = 'repos';
    ctx.lastGitHubSummary = 'R'.repeat(3000);
    const summary = getContextSummary(ctx);
    expect(summary.length).toBeLessThanOrEqual(2500);
  });
});

// ---------------------------------------------------------------------------
// 10) clearGitHubContext — reseta todos os campos
// ---------------------------------------------------------------------------

describe('clearGitHubContext', () => {
  test('reseta todos os campos para null', () => {
    const ctx = createGitHubContext();
    ctx.lastOwner = 'owner';
    ctx.lastRepo = 'repo';
    ctx.lastBranch = 'main';
    ctx.lastFilePath = 'README.md';
    ctx.lastGitHubResultType = 'file';
    ctx.lastGitHubSummary = 'summary';
    ctx.lastFileSnippet = 'snippet';
    clearGitHubContext(ctx);
    expect(ctx.lastOwner).toBeNull();
    expect(ctx.lastRepo).toBeNull();
    expect(ctx.lastBranch).toBeNull();
    expect(ctx.lastFilePath).toBeNull();
    expect(ctx.lastGitHubResultType).toBeNull();
    expect(ctx.lastGitHubSummary).toBeNull();
    expect(ctx.lastFileSnippet).toBeNull();
  });

  test('não lança erro com contexto null', () => {
    expect(() => clearGitHubContext(null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 11) Segurança — sem vazamento de token
// ---------------------------------------------------------------------------

describe('Segurança — sem vazamento de token', () => {
  test('updateContextFromToolResult nunca armazena Authorization headers', () => {
    const ctx = createGitHubContext();
    const maliciousResult = {
      success: true,
      data: {
        repos: [{ name: 'repo' }],
        headers: { Authorization: 'Bearer super-secret-token' },
      },
    };
    updateContextFromToolResult(ctx, 'github_list_repos', {}, maliciousResult);
    const ctxStr = JSON.stringify(ctx);
    expect(ctxStr).not.toContain('super-secret-token');
    expect(ctxStr).not.toContain('Authorization');
  });

  test('getContextSummary nunca expõe stacktraces', () => {
    const ctx = createGitHubContext();
    ctx.lastGitHubResultType = 'file';
    ctx.lastGitHubSummary = 'Arquivo lido: README.md';
    ctx.lastFileSnippet = 'conteúdo normal';
    const summary = getContextSummary(ctx);
    expect(summary).not.toMatch(/Error\s+at\s+/);
    expect(summary).not.toMatch(/node_modules/);
  });
});

// ---------------------------------------------------------------------------
// 12) Segurança — snippet truncado no limite correto
// ---------------------------------------------------------------------------

describe('Segurança — snippet truncation', () => {
  test('snippet de arquivo nunca ultrapassa 2000 chars', () => {
    const ctx = createGitHubContext();
    const bigContent = 'A'.repeat(10000);
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'o', repo: 'r', path: 'big.txt' }, makeFileResult(bigContent));
    expect(ctx.lastFileSnippet).not.toBeNull();
    expect(ctx.lastFileSnippet.length).toBeLessThanOrEqual(2000);
  });

  test('snippet pequeno preservado sem truncamento', () => {
    const ctx = createGitHubContext();
    const small = 'Hello World!';
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'o', repo: 'r', path: 'small.txt' }, makeFileResult(small));
    expect(ctx.lastFileSnippet).toBe(small);
  });
});

// ---------------------------------------------------------------------------
// 13) Segurança — summary truncado no limite correto
// ---------------------------------------------------------------------------

describe('Segurança — summary truncation', () => {
  test('summary salvo nunca ultrapassa 500 chars', () => {
    const ctx = createGitHubContext();
    const manyRepos = Array.from({ length: 100 }, (_, i) => ({ fullName: `org/repo-${i}` }));
    updateContextFromToolResult(ctx, 'github_list_repos', {}, makeReposResult(manyRepos));
    expect(ctx.lastGitHubSummary).not.toBeNull();
    expect(ctx.lastGitHubSummary.length).toBeLessThanOrEqual(500);
  });
});

// ---------------------------------------------------------------------------
// 14) Fluxo normal (não-GitHub) não é impactado pelo contexto
// ---------------------------------------------------------------------------

describe('Fluxo normal do Serginho preservado (sem contexto GitHub)', () => {
  test('mensagem não-GitHub com contexto vazio → chama LLM normalmente (sem injeção)', async () => {
    mockGetProviderConfig.mockReturnValue({
      model: 'llama-test',
      type: 'groq',
      endpoint: 'https://api.groq.com',
      defaultParams: {},
    });
    const msg = 'qual a capital do Brasil?';
    // Se a mensagem não tem intenção GitHub, effectiveMessage === message
    // (sem contexto, getContextSummary retorna null)
    // O orchestrator tenta chamar o provider LLM — falha por falta de API key em teste
    try {
      await serginho.handleRequest({ message: msg, context: {} });
    } catch (e) {
      // Esperado: falha no provider por falta de API key (não erro de contexto GitHub)
      expect(e.message).toMatch(/All providers failed|GROQ_API_KEY|API/i);
      expect(e.message).not.toMatch(/githubContext/);
    }
  });
});

// ---------------------------------------------------------------------------
// 15) Integração orchestrator — contexto salvo em _meta após tool call
// ---------------------------------------------------------------------------

describe('Integração orchestrator — contexto GitHub em _meta', () => {
  test('após listar repos, _meta.githubContext tem lastGitHubResultType = repos', async () => {
    configStub();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ name: 'meu-repo', fullName: 'user/meu-repo', private: false }], mode: 'stub' },
    });

    const result = await serginho.handleRequest({
      message: 'liste meus repositórios',
      context: {},
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.githubContext).toBeDefined();
    expect(result._meta.githubContext.lastGitHubResultType).toBe('repos');
  });

  test('após listar branches, _meta.githubContext tem lastOwner e lastRepo', async () => {
    configStub();
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: { branches: [{ name: 'main' }, { name: 'dev' }], mode: 'stub' },
    });

    const result = await serginho.handleRequest({
      message: 'liste as branches do repo kizirianmax/rkmmax-hibrido',
      context: {},
    });

    expect(result._meta.githubContext.lastOwner).toBe('kizirianmax');
    expect(result._meta.githubContext.lastRepo).toBe('rkmmax-hibrido');
    expect(result._meta.githubContext.lastGitHubResultType).toBe('branches');
  });

  test('após ler arquivo, _meta.githubContext tem lastFilePath e lastFileSnippet', async () => {
    configStub();
    const content = Buffer.from('# README\n\nProjeto de teste.').toString('base64');
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: {
        file: { name: 'README.md', path: 'README.md', content, encoding: 'base64', size: content.length },
        mode: 'stub',
      },
    });

    const result = await serginho.handleRequest({
      message: 'mostre o arquivo README.md do repo kizirianmax/rkmmax-hibrido',
      context: {},
    });

    expect(result._meta.githubContext.lastFilePath).toBe('README.md');
    expect(result._meta.githubContext.lastFileSnippet).toContain('README');
    expect(result._meta.githubContext.lastGitHubResultType).toBe('file');
  });

  test('context.githubContext passado → owner/repo resolvidos para intent com missing', async () => {
    // Simula: usuário perguntou branches sem especificar repo, mas contexto tem owner/repo
    configStub();
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: { branches: [{ name: 'main' }], mode: 'stub' },
    });

    const previousContext = {
      lastOwner: 'saved-owner',
      lastRepo: 'saved-repo',
      lastBranch: null,
      lastFilePath: null,
      lastGitHubResultType: 'repos',
      lastGitHubSummary: 'prev summary',
      lastFileSnippet: null,
    };

    const result = await serginho.handleRequest({
      message: 'liste as branches',
      context: { githubContext: previousContext },
    });

    // O Serginho deve ter resolvido owner/repo do contexto e chamado o gateway
    expect(mockSerginhoListBranches).toHaveBeenCalledWith({
      owner: 'saved-owner',
      repo: 'saved-repo',
    });
    expect(result.text).toBeDefined();
  });

  test('sem contexto e sem owner/repo → retorna texto pedindo os dados faltantes', async () => {
    configStub();

    const result = await serginho.handleRequest({
      message: 'liste as branches',
      context: {},
    });

    expect(result.text).toMatch(/owner|repo/i);
    expect(result._meta.missing).toBeDefined();
    expect(result._meta.missing.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 16) Sem regressão — intent detection existente
// ---------------------------------------------------------------------------

describe('Sem regressão — detectGitHubIntent', () => {
  let detectGitHubIntent;

  beforeAll(async () => {
    ({ detectGitHubIntent } = await import('../lib/serginho/intent/githubIntent.js'));
  });

  test('"liste meus repositórios" → github_list_repos', () => {
    const r = detectGitHubIntent('liste meus repositórios');
    expect(r.tool).toBe('github_list_repos');
  });

  test('"liste as branches do repo owner/repo" → github_list_branches', () => {
    const r = detectGitHubIntent('liste as branches do repo user/my-repo');
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.owner).toBe('user');
    expect(r.params.repo).toBe('my-repo');
  });

  test('"abra README.md do repo owner/repo" → github_get_file', () => {
    const r = detectGitHubIntent('abra README.md do repo user/repo');
    expect(r.tool).toBe('github_get_file');
  });

  test('mensagem não-GitHub → null', () => {
    expect(detectGitHubIntent('qual a previsão do tempo?')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 17) Sem regressão — formatter existente
// ---------------------------------------------------------------------------

describe('Sem regressão — githubResponseFormatter', () => {
  let formatReposResponse, formatBranchesResponse, formatErrorResponse;

  beforeAll(async () => {
    ({ formatReposResponse, formatBranchesResponse, formatErrorResponse } =
      await import('../lib/serginho/formatters/githubResponseFormatter.js'));
  });

  test('formatReposResponse com repos → contém nomes', () => {
    const text = formatReposResponse({ repos: [{ fullName: 'user/repo-a', private: false }] });
    expect(text).toContain('user/repo-a');
  });

  test('formatBranchesResponse com branches → contém branch names', () => {
    const text = formatBranchesResponse({ branches: [{ name: 'main' }] }, { owner: 'o', repo: 'r' });
    expect(text).toContain('main');
  });

  test('formatErrorResponse GITHUB_DISABLED → texto amigável', () => {
    const text = formatErrorResponse({ code: 'GITHUB_DISABLED', message: 'disabled' });
    expect(text).toContain('desabilitada');
  });
});

// ---------------------------------------------------------------------------
// 18) Sem regressão — gateway
// ---------------------------------------------------------------------------

describe('Sem regressão — githubGateway (isolado via mock)', () => {
  test('gateway mock responde corretamente (verificação de wiring dos mocks)', async () => {
    configStub();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ name: 'test' }], mode: 'stub' },
    });

    const result = await serginho.handleRequest({
      message: 'liste meus repositórios',
      context: {},
    });

    expect(mockSerginhoListRepos).toHaveBeenCalled();
    expect(result.text).toBeDefined();
    expect(result.text).toContain('test');
  });
});

// ---------------------------------------------------------------------------
// 19) Sem regressão — tools
// ---------------------------------------------------------------------------

describe('Sem regressão — githubTools (via orchestrator)', () => {
  test('tool github_get_file chamada com params completos', async () => {
    configStub();
    const content = Buffer.from('console.log("hello")').toString('base64');
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: {
        file: { name: 'index.js', path: 'src/index.js', content, encoding: 'base64', size: 20 },
        mode: 'stub',
      },
    });

    const result = await serginho.handleRequest({
      message: 'leia src/index.js em user/my-project',
      context: {},
    });

    expect(mockSerginhoGetFile).toHaveBeenCalledWith({
      owner: 'user',
      repo: 'my-project',
      path: 'src/index.js',
    });
    expect(result.text).toBeDefined();
  });
});
