/**
 * api/__tests__/serginho-github-intent.test.js
 * Testes para o detector de intenção GitHub e sua integração no Serginho Orchestrator.
 *
 * Cobre:
 *   - detectGitHubIntent: list repos, list branches, get file
 *   - Extração de owner/repo/path das mensagens
 *   - Mensagens ambíguas → retorna null (fluxo normal preservado)
 *   - Parâmetros faltando → retorna objeto com missing[]
 *   - Padrões em inglês e português
 *   - Integração com orchestrator: intent detectada → tool chamada
 *   - Integração com orchestrator: intent NÃO detectada → fluxo normal (sem tool)
 *   - Flag off → tool retorna GITHUB_DISABLED (via tool layer)
 *   - Modo stub → tool retorna dados stub
 *   - OAuth sem token → tool retorna GITHUB_NO_TOKEN
 */

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Mocks para testes de integração com o orchestrator
// ---------------------------------------------------------------------------

const mockGetGitHubConfig = jest.fn();
const mockSerginhoListRepos = jest.fn();
const mockSerginhoListBranches = jest.fn();
const mockSerginhoGetFile = jest.fn();

// Mocks de providers/módulos usados pelo orchestrator
const mockAnalyzeComplexity = jest.fn(() => ({ scores: { complexity: 0.5 } }));
const mockRouteToProvider = jest.fn(() => ({ provider: 'groq' }));
const mockGetNextFallback = jest.fn(() => null);
const mockGetProviderConfig = jest.fn(() => ({ model: 'llama-test' }));
const mockGetModelMetadata = jest.fn(() => ({}));
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

// ---------------------------------------------------------------------------
// Importação dinâmica (após mocks registrados)
// ---------------------------------------------------------------------------

let detectGitHubIntent;
let serginho;

beforeAll(async () => {
  ({ detectGitHubIntent } = await import('../lib/serginho/intent/githubIntent.js'));
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers de config
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

function configDisabled() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: false,
    mode: 'stub',
    hasToken: false,
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

function configOAuthNoToken() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'oauth',
    hasToken: false,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

// ---------------------------------------------------------------------------
// 1) detectGitHubIntent — list repos
// ---------------------------------------------------------------------------

describe('detectGitHubIntent — list repos', () => {
  test('"liste meus repositórios" → github_list_repos', () => {
    const r = detectGitHubIntent('liste meus repositórios');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
    expect(r.params).toEqual({});
  });

  test('"listar repositórios" → github_list_repos', () => {
    const r = detectGitHubIntent('listar repositórios');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });

  test('"quais repositórios eu tenho no github?" → github_list_repos', () => {
    const r = detectGitHubIntent('quais repositórios eu tenho no github?');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });

  test('"meus repos" → github_list_repos', () => {
    const r = detectGitHubIntent('meus repos');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });

  test('"list my repos" → github_list_repos (EN)', () => {
    const r = detectGitHubIntent('list my repos');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });

  test('"show my repositories" → github_list_repos (EN)', () => {
    const r = detectGitHubIntent('show my repositories');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });

  test('"meus repositórios" → github_list_repos', () => {
    const r = detectGitHubIntent('meus repositórios');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });

  test('sem parâmetros obrigatórios → params vazio (repos não precisam de params)', () => {
    const r = detectGitHubIntent('liste meus repositórios');
    expect(r.params).toEqual({});
    expect(r.missing).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2) detectGitHubIntent — list branches
// ---------------------------------------------------------------------------

describe('detectGitHubIntent — list branches', () => {
  test('"branches do repo kizirianmax/rkmmax-hibrido" → github_list_branches com owner+repo', () => {
    const r = detectGitHubIntent('branches do repo kizirianmax/rkmmax-hibrido');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.owner).toBe('kizirianmax');
    expect(r.params.repo).toBe('rkmmax-hibrido');
    expect(r.missing).toBeUndefined();
  });

  test('"liste as branches do repo kizirianmax/rkmmax-hibrido" → owner+repo extraídos', () => {
    const r = detectGitHubIntent('liste as branches do repo kizirianmax/rkmmax-hibrido');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.owner).toBe('kizirianmax');
    expect(r.params.repo).toBe('rkmmax-hibrido');
  });

  test('"quais branches existem em owner/repo" → owner+repo extraídos', () => {
    const r = detectGitHubIntent('quais branches existem em owner/repo');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.owner).toBe('owner');
    expect(r.params.repo).toBe('repo');
  });

  test('"list branches of owner/repo" → github_list_branches (EN)', () => {
    const r = detectGitHubIntent('list branches of owner/repo');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.owner).toBe('owner');
    expect(r.params.repo).toBe('repo');
  });

  test('"show branches for owner/repo" → github_list_branches (EN)', () => {
    const r = detectGitHubIntent('show branches for owner/repo');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.owner).toBe('owner');
    expect(r.params.repo).toBe('repo');
  });

  test('"liste as branches" (sem repo) → missing: [owner, repo]', () => {
    const r = detectGitHubIntent('liste as branches');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.missing).toEqual(expect.arrayContaining(['owner', 'repo']));
  });

  test('"branches do repo meu-projeto" (apenas repo, sem owner) → missing: [owner]', () => {
    const r = detectGitHubIntent('branches do repo meu-projeto');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_branches');
    expect(r.params.repo).toBe('meu-projeto');
    expect(r.missing).toEqual(['owner']);
  });
});

// ---------------------------------------------------------------------------
// 3) detectGitHubIntent — get file
// ---------------------------------------------------------------------------

describe('detectGitHubIntent — get file', () => {
  test('"mostre o arquivo README.md do repo kizirianmax/rkmmax-hibrido" → owner+repo+path', () => {
    const r = detectGitHubIntent(
      'mostre o arquivo README.md do repo kizirianmax/rkmmax-hibrido',
    );
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_get_file');
    expect(r.params.owner).toBe('kizirianmax');
    expect(r.params.repo).toBe('rkmmax-hibrido');
    expect(r.params.path).toBe('README.md');
    expect(r.missing).toBeUndefined();
  });

  test('"leia src/App.jsx em kizirianmax/rkmmax-hibrido" → owner+repo+path', () => {
    const r = detectGitHubIntent('leia src/App.jsx em kizirianmax/rkmmax-hibrido');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_get_file');
    expect(r.params.owner).toBe('kizirianmax');
    expect(r.params.repo).toBe('rkmmax-hibrido');
    expect(r.params.path).toBe('src/App.jsx');
  });

  test('"abra README.md do repo meu-projeto" → repo+path, owner faltando', () => {
    const r = detectGitHubIntent('abra README.md do repo meu-projeto');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_get_file');
    expect(r.params.repo).toBe('meu-projeto');
    expect(r.params.path).toBe('README.md');
    expect(r.missing).toEqual(['owner']);
  });

  test('"show file package.json in owner/repo" → github_get_file (EN)', () => {
    const r = detectGitHubIntent('show file package.json in owner/repo');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_get_file');
    expect(r.params.owner).toBe('owner');
    expect(r.params.repo).toBe('repo');
    expect(r.params.path).toBe('package.json');
  });

  test('"read file src/index.js from owner/repo" → github_get_file (EN)', () => {
    const r = detectGitHubIntent('read file src/index.js from owner/repo');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_get_file');
    expect(r.params.owner).toBe('owner');
    expect(r.params.repo).toBe('repo');
    expect(r.params.path).toBe('src/index.js');
  });

  test('"mostre o arquivo" (sem arquivo nem repo) → missing contém path, owner, repo', () => {
    const r = detectGitHubIntent('mostre o arquivo');
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_get_file');
    expect(r.missing).toEqual(expect.arrayContaining(['owner', 'repo', 'path']));
  });
});

// ---------------------------------------------------------------------------
// 4) detectGitHubIntent — mensagens ambíguas / não-GitHub → null
// ---------------------------------------------------------------------------

describe('detectGitHubIntent — mensagens não-GitHub → null', () => {
  test('"qual a previsão do tempo?" → null', () => {
    expect(detectGitHubIntent('qual a previsão do tempo?')).toBeNull();
  });

  test('"como implementar uma API REST em Node?" → null', () => {
    expect(detectGitHubIntent('como implementar uma API REST em Node?')).toBeNull();
  });

  test('"oi, tudo bem?" → null', () => {
    expect(detectGitHubIntent('oi, tudo bem?')).toBeNull();
  });

  test('"resumo do capítulo 3 do livro" → null', () => {
    expect(detectGitHubIntent('resumo do capítulo 3 do livro')).toBeNull();
  });

  test('mensagem vazia → null', () => {
    expect(detectGitHubIntent('')).toBeNull();
  });

  test('null → null', () => {
    expect(detectGitHubIntent(null)).toBeNull();
  });

  test('número → null', () => {
    expect(detectGitHubIntent(42)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4b) detectGitHubIntent — pedidos de geração de código → null (falso positivo corrigido)
// ---------------------------------------------------------------------------

describe('detectGitHubIntent — pedidos de geração de código → null', () => {
  test('prompt de geração de artefato com Node.js, JSON e README.md → null', () => {
    const prompt =
      'Crie um script Node.js que leia um arquivo JSON local, agrupe os itens por categoria e imprima um resumo no console. Entregue no formato de artefato de código, com arquivo principal e README.md';
    expect(detectGitHubIntent(prompt)).toBeNull();
  });

  test('"Gere uma função TypeScript que valide um schema JSON" → null', () => {
    expect(detectGitHubIntent('Gere uma função TypeScript que valide um schema JSON')).toBeNull();
  });

  test('"Escreva um script Python que leia um arquivo CSV" → null', () => {
    expect(detectGitHubIntent('Escreva um script Python que leia um arquivo CSV')).toBeNull();
  });

  test('"create a Node.js script that reads a JSON file" → null', () => {
    expect(detectGitHubIntent('create a Node.js script that reads a JSON file')).toBeNull();
  });

  test('"write a function that opens a file and returns its contents" → null', () => {
    expect(detectGitHubIntent('write a function that opens a file and returns its contents')).toBeNull();
  });

  test('"build a React component that shows a README.md preview" → null', () => {
    expect(detectGitHubIntent('build a React component that shows a README.md preview')).toBeNull();
  });

  test('criação COM owner/repo explícito ainda passa detecção → não null', () => {
    // Se o usuário especifica owner/repo junto com verbo de criação, pode precisar de contexto
    const r = detectGitHubIntent('liste meus repositórios para criar um novo script');
    // LIST_REPOS_PATTERNS deve detectar "liste meus repositórios"
    expect(r).not.toBeNull();
    expect(r.tool).toBe('github_list_repos');
  });
});

// ---------------------------------------------------------------------------
// 5) Integração orchestrator — intent GitHub detectada → tool executada
// ---------------------------------------------------------------------------

describe('Orchestrator — intent GitHub detectada → tool executada', () => {
  test('mensagem de list repos → orchestrator retorna resultado da tool', async () => {
    configEnabled();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: {
        repos: [{ id: 1, name: 'meu-repo', fullName: 'user/meu-repo', description: 'desc' }],
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result).toBeDefined();
    expect(result.provider).toBe('serginho-tools');
    expect(result.model).toBe('serginho-intent');
    expect(result.text).toContain('meu-repo');
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
    // Garantia: orchestrator NÃO chamou o router de IA
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('mensagem de list branches com owner/repo → orchestrator retorna resultado da tool', async () => {
    configEnabled();
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: {
        branches: [
          { name: 'main', sha: 'abc', protected: true },
          { name: 'develop', sha: 'def', protected: false },
        ],
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest(
      'liste as branches do repo kizirianmax/rkmmax-hibrido',
    );
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('main');
    expect(result.text).toContain('develop');
    expect(mockSerginhoListBranches).toHaveBeenCalledWith({
      owner: 'kizirianmax',
      repo: 'rkmmax-hibrido',
    });
  });

  test('mensagem de get file → orchestrator retorna conteúdo do arquivo', async () => {
    configEnabled();
    const content = Buffer.from('# Readme content').toString('base64');
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: {
        file: { name: 'README.md', path: 'README.md', content, encoding: 'base64', size: 17 },
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest(
      'mostre o arquivo README.md do repo kizirianmax/rkmmax-hibrido',
    );
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('README.md');
    expect(mockSerginhoGetFile).toHaveBeenCalledWith({
      owner: 'kizirianmax',
      repo: 'rkmmax-hibrido',
      path: 'README.md',
    });
  });
});

// ---------------------------------------------------------------------------
// 6) Integração orchestrator — parâmetros faltando → resposta estruturada
// ---------------------------------------------------------------------------

describe('Orchestrator — parâmetros faltando → resposta estruturada', () => {
  test('"liste as branches" → orchestrator pede dados faltando', async () => {
    const result = await serginho.handleRequest('liste as branches');
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toMatch(/preciso dos seguintes dados/i);
    expect(result._meta.missing).toBeDefined();
    expect(result._meta.missing.length).toBeGreaterThan(0);
    // Garantia: nenhuma tool de API foi chamada
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 7) Integração orchestrator — erro da tool → resposta de erro
// ---------------------------------------------------------------------------

describe('Orchestrator — tool retorna erro → resposta de erro estruturada', () => {
  test('feature flag off → texto com mensagem de erro GITHUB_DISABLED', async () => {
    configDisabled();
    mockSerginhoListRepos.mockResolvedValue({
      success: false,
      error: {
        code: 'GITHUB_DISABLED',
        message: 'A integração com GitHub está desabilitada.',
        details: 'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('integração com GitHub está desabilitada');
    expect(result._meta.errorCode).toBe('GITHUB_DISABLED');
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('stub mode → text com repos stub', async () => {
    configStub();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: {
        repos: [
          {
            id: 1,
            name: 'exemplo-repo',
            fullName: 'usuario/exemplo-repo',
            description: 'Repositório de exemplo (modo stub)',
          },
        ],
        mode: 'stub',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('exemplo-repo');
    expect(result._meta.mode).toBe('stub');
  });

  test('oauth sem token → texto com mensagem de erro GITHUB_NO_TOKEN', async () => {
    configOAuthNoToken();
    mockSerginhoListRepos.mockResolvedValue({
      success: false,
      error: {
        code: 'GITHUB_NO_TOKEN',
        message: 'Token GitHub não configurado para modo oauth.',
        details: 'Defina GITHUB_TOKEN no ambiente.',
      },
    });

    const result = await serginho.handleRequest('meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('Token GitHub não configurado');
    expect(result._meta.errorCode).toBe('GITHUB_NO_TOKEN');
  });
});

// ---------------------------------------------------------------------------
// 8) Fluxo normal preservado — mensagens não-GitHub passam pelo router de IA
// ---------------------------------------------------------------------------

describe('Orchestrator — fluxo normal preservado para mensagens não-GitHub', () => {
  test('"qual a previsão do tempo?" → complexidade analisada, SEM tool GitHub', async () => {
    // Simulamos o provider falhando para não precisar de setup completo de Groq
    mockAnalyzeComplexity.mockReturnValue({ scores: { complexity: 0.5 } });
    mockRouteToProvider.mockReturnValue({ provider: 'groq' });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    // Injetamos erro no provider para que o teste não precise de API real
    // O importante é que analyzeComplexity FOI chamado (fluxo normal ativado)
    let analysisWasCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisWasCalled = true;
      return { scores: { complexity: 0.5 } };
    });

    try {
      await serginho.handleRequest('qual a previsão do tempo?');
    } catch (err) {
      // Esperado: sem provider real configurado, pode falhar — o importante é que analyzeComplexity foi chamado
      expect(err).toBeDefined();
    }

    expect(analysisWasCalled).toBe(true);
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('"como implementar autenticação JWT?" → passa pelo router, NÃO usa tools GitHub', async () => {
    let analysisWasCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisWasCalled = true;
      return { scores: { complexity: 0.7 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest('como implementar autenticação JWT?');
    } catch (err) {
      // Sem provider real, falha esperada — o que importa é que o router foi chamado
      expect(err).toBeDefined();
    }

    expect(analysisWasCalled).toBe(true);
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 9) Garantia de camadas — orchestrator usa tool layer, não gateway diretamente
// ---------------------------------------------------------------------------

describe('Garantia de camadas — orchestrator usa tools, não gateway direto', () => {
  test('list repos via intent usa tool.execute, não serginhoListRepos diretamente', async () => {
    configEnabled();
    // Configuramos o mock do gateway para retornar um resultado
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ name: 'r', fullName: 'u/r' }], mode: 'oauth' },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    // O resultado deve ter vindo via tool layer (provider = serginho-tools)
    expect(result.provider).toBe('serginho-tools');
    // E o gateway SIM foi chamado (pois tool chama gateway internamente)
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
  });
});
