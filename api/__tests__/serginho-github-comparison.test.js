/**
 * api/__tests__/serginho-github-comparison.test.js
 * Testes para a camada de comparação entre contextos GitHub carregados (N8).
 *
 * Cobre:
 *   - isComparativeFollowUp: positivos PT-BR, positivos EN, negativos
 *   - hasEnoughContextForComparison: null, vazio, campos presentes
 *   - buildComparisonPrompt: contexto suficiente, insuficiente, snippets, null
 *   - getInsufficientComparisonContextMessage: string amigável
 *   - Extensão do contexto (shift de campos previous*)
 *   - Integração no orchestrator: comparativo suficiente, insuficiente
 *   - Não-regressão: analytical N6/N7, non-GitHub, tool execution
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários dos helpers (sem mocks de módulos)
// ---------------------------------------------------------------------------

let isComparativeFollowUp;
let hasEnoughContextForComparison;
let buildComparisonPrompt;
let getInsufficientComparisonContextMessage;

let createGitHubContext;
let updateContextFromToolResult;
let clearGitHubContext;

beforeAll(async () => {
  ({ isComparativeFollowUp, hasEnoughContextForComparison, buildComparisonPrompt, getInsufficientComparisonContextMessage } =
    await import('../lib/serginho/analysis/githubContextComparison.js'));

  ({ createGitHubContext, updateContextFromToolResult, clearGitHubContext } =
    await import('../lib/serginho/context/githubConversationContext.js'));
});

// ---------------------------------------------------------------------------
// 1) isComparativeFollowUp — positivos PT-BR
// ---------------------------------------------------------------------------

describe('isComparativeFollowUp — positivos PT-BR', () => {
  test.each([
    'compare isso com o README',
    'compare os dois',
    'compare ambos',
    'compare o package.json com o README',
    'está alinhado com o README?',
    'alinhado com o readme',
    'alinhado com o package',
    'há inconsistências entre esse arquivo e o README?',
    'inconsistência entre os dois',
    'inconsistências entre contexto atual e anterior',
    'há divergência entre contexto atual e anterior?',
    'divergência entre os dois arquivos',
    'combina com o que o projeto diz fazer?',
    'o que aparece em um e não no outro?',
    'README e package.json contam a mesma história?',
    'o que difere entre eles?',
    'o que é diferente entre os dois?',
  ])('"%s" → true', (msg) => {
    expect(isComparativeFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2) isComparativeFollowUp — positivos EN
// ---------------------------------------------------------------------------

describe('isComparativeFollowUp — positivos EN', () => {
  test.each([
    'compare both',
    'compare the two',
    'is this aligned with the README?',
    'aligned with the README',
    'any inconsistency between these two?',
    'inconsistency between the files',
    'any divergence between them?',
    'divergence between the two',
    'matches with the README',
    'what differs between them?',
    'what is different between the two?',
    'same story',
  ])('"%s" → true', (msg) => {
    expect(isComparativeFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3) isComparativeFollowUp — negativos
// ---------------------------------------------------------------------------

describe('isComparativeFollowUp — negativos', () => {
  test.each([
    'liste meus repos',
    'abra o README.md de owner/repo',
    'oi',
    'olá',
    'tudo bem',
    'o que você conclui?',
    '',
  ])('"%s" → false', (msg) => {
    expect(isComparativeFollowUp(msg)).toBe(false);
  });

  test('null → false', () => {
    expect(isComparativeFollowUp(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isComparativeFollowUp(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4) hasEnoughContextForComparison
// ---------------------------------------------------------------------------

describe('hasEnoughContextForComparison', () => {
  test('null → false', () => {
    expect(hasEnoughContextForComparison(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(hasEnoughContextForComparison(undefined)).toBe(false);
  });

  test('objeto vazio → false', () => {
    expect(hasEnoughContextForComparison({})).toBe(false);
  });

  test('só lastGitHubSummary preenchido, previous all null → false', () => {
    expect(hasEnoughContextForComparison({
      lastGitHubSummary: 'Repositórios listados',
      lastFileSnippet: null,
      previousGitHubSummary: null,
      previousFileSnippet: null,
    })).toBe(false);
  });

  test('só previousGitHubSummary preenchido, last all null → false', () => {
    expect(hasEnoughContextForComparison({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      previousGitHubSummary: 'Arquivo lido: README.md',
      previousFileSnippet: null,
    })).toBe(false);
  });

  test('lastGitHubSummary + previousGitHubSummary → true', () => {
    expect(hasEnoughContextForComparison({
      lastGitHubSummary: 'Arquivo lido: package.json',
      lastFileSnippet: null,
      previousGitHubSummary: 'Arquivo lido: README.md',
      previousFileSnippet: null,
    })).toBe(true);
  });

  test('lastFileSnippet + previousFileSnippet → true', () => {
    expect(hasEnoughContextForComparison({
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "app" }',
      previousGitHubSummary: null,
      previousFileSnippet: '# README content',
    })).toBe(true);
  });

  test('lastFileSnippet + previousGitHubSummary → true', () => {
    expect(hasEnoughContextForComparison({
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "app" }',
      previousGitHubSummary: 'Arquivo lido: README.md',
      previousFileSnippet: null,
    })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5) buildComparisonPrompt
// ---------------------------------------------------------------------------

describe('buildComparisonPrompt', () => {
  const richCtx = {
    lastGitHubSummary: 'Arquivo lido: package.json em owner/repo.',
    lastFileSnippet: '{ "name": "app", "version": "2.0.0" }',
    previousGitHubSummary: 'Arquivo lido: README.md em owner/repo.',
    previousFileSnippet: '# App\n\nEste é o projeto.',
  };

  test('contexto suficiente → retorna string com [Comparação GitHub]', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('[Comparação GitHub]');
  });

  test('contexto suficiente → contém summary anterior', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toContain(richCtx.previousGitHubSummary);
  });

  test('contexto suficiente → contém summary atual', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toContain(richCtx.lastGitHubSummary);
  });

  test('contexto suficiente → contém "Pergunta do usuário:"', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toContain('Pergunta do usuário:');
    expect(prompt).toContain('compare os dois');
  });

  test('contexto suficiente → contém "Instruções:"', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toContain('Instruções:');
  });

  test('contexto suficiente → contém instrução anti-alucinação', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toMatch(/não invente|Não invente/i);
  });

  test('contexto com snippets → prompt inclui trechos de arquivo', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toContain(richCtx.lastFileSnippet);
    expect(prompt).toContain(richCtx.previousFileSnippet);
  });

  test('contexto suficiente → contém Artefato 1 e Artefato 2', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toContain('Artefato 1');
    expect(prompt).toContain('Artefato 2');
  });

  test('contexto insuficiente (só last, sem previous) → retorna null', () => {
    const ctx = {
      lastGitHubSummary: 'Arquivo lido: package.json',
      lastFileSnippet: '{ "name": "app" }',
      previousGitHubSummary: null,
      previousFileSnippet: null,
    };
    expect(buildComparisonPrompt('compare os dois', ctx)).toBeNull();
  });

  test('null → retorna null', () => {
    expect(buildComparisonPrompt('compare os dois', null)).toBeNull();
  });

  test('undefined → retorna null', () => {
    expect(buildComparisonPrompt('compare os dois', undefined)).toBeNull();
  });

  test('contexto suficiente → contém instrução para responder em PT-BR', () => {
    const prompt = buildComparisonPrompt('compare os dois', richCtx);
    expect(prompt).toMatch(/PT-BR|português/i);
  });
});

// ---------------------------------------------------------------------------
// 6) getInsufficientComparisonContextMessage
// ---------------------------------------------------------------------------

describe('getInsufficientComparisonContextMessage', () => {
  test('retorna string não vazia em português', () => {
    const msg = getInsufficientComparisonContextMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('menciona como obter contexto suficiente', () => {
    const msg = getInsufficientComparisonContextMessage();
    expect(msg).toMatch(/README|package\.json|artefato|arquivo/i);
  });

  test('retorna a mensagem exata esperada', () => {
    const msg = getInsufficientComparisonContextMessage();
    expect(msg).toBe(
      'Ainda não tenho contexto GitHub suficiente para comparar. Primeiro abra ou analise pelo menos dois artefatos relacionados, como README.md e package.json.',
    );
  });
});

// ---------------------------------------------------------------------------
// 7) Extensão do contexto — shift de campos previous*
// ---------------------------------------------------------------------------

describe('Extensão do contexto — campos previous*', () => {
  test('createGitHubContext retorna previousGitHubSummary = null', () => {
    const ctx = createGitHubContext();
    expect(ctx.previousGitHubSummary).toBeNull();
  });

  test('createGitHubContext retorna previousFileSnippet = null', () => {
    const ctx = createGitHubContext();
    expect(ctx.previousFileSnippet).toBeNull();
  });

  test('createGitHubContext retorna previousFilePath = null', () => {
    const ctx = createGitHubContext();
    expect(ctx.previousFilePath).toBeNull();
  });

  test('createGitHubContext retorna previousGitHubResultType = null', () => {
    const ctx = createGitHubContext();
    expect(ctx.previousGitHubResultType).toBeNull();
  });

  test('após primeiro updateContextFromToolResult (repos), previous* todos null', () => {
    const ctx = createGitHubContext();
    updateContextFromToolResult(ctx, 'github_list_repos', {}, {
      success: true,
      data: { repos: [{ name: 'repo1', fullName: 'owner/repo1', private: false }] },
    });
    // Não havia contexto anterior antes do primeiro update
    expect(ctx.previousGitHubResultType).toBeNull();
    expect(ctx.previousGitHubSummary).toBeNull();
    expect(ctx.previousFileSnippet).toBeNull();
    expect(ctx.previousFilePath).toBeNull();
  });

  test('após segundo updateContextFromToolResult (file), previousGitHubSummary = o que era lastGitHubSummary do primeiro update', () => {
    const ctx = createGitHubContext();

    // Primeiro update: repos
    updateContextFromToolResult(ctx, 'github_list_repos', {}, {
      success: true,
      data: { repos: [{ name: 'repo1', fullName: 'owner/repo1', private: false }] },
    });
    const summaryAfterFirstUpdate = ctx.lastGitHubSummary;
    expect(summaryAfterFirstUpdate).toBeTruthy();

    // Segundo update: file
    updateContextFromToolResult(ctx, 'github_get_file', { owner: 'owner', repo: 'repo1', path: 'README.md' }, {
      success: true,
      data: { file: { content: '# README content', encoding: 'utf-8' } },
    });

    // O summary do primeiro update deve estar em previousGitHubSummary
    expect(ctx.previousGitHubSummary).toBe(summaryAfterFirstUpdate);
    // O lastGitHubSummary deve ser o novo
    expect(ctx.lastGitHubSummary).not.toBe(summaryAfterFirstUpdate);
  });

  test('clearGitHubContext limpa também os campos previous*', () => {
    const ctx = createGitHubContext();
    // Preenche manualmente
    ctx.previousGitHubResultType = 'repos';
    ctx.previousGitHubSummary = 'Repositórios listados';
    ctx.previousFileSnippet = '{ "name": "app" }';
    ctx.previousFilePath = 'package.json';

    clearGitHubContext(ctx);

    expect(ctx.previousGitHubResultType).toBeNull();
    expect(ctx.previousGitHubSummary).toBeNull();
    expect(ctx.previousFileSnippet).toBeNull();
    expect(ctx.previousFilePath).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Parte 2 — Testes de integração com o Serginho Orchestrator
// ---------------------------------------------------------------------------

const mockAnalyzeComplexity = jest.fn(() => ({ scores: { complexity: 0.5 } }));
const mockRouteToProvider = jest.fn(() => ({ provider: 'groq' }));
const mockGetNextFallback = jest.fn(() => null);
const mockGetProviderConfig = jest.fn(() => ({ model: 'llama-test' }));
const mockGetModelMetadata = jest.fn(() => ({}));
const mockGetEnabledProviders = jest.fn(() => ['groq']);
const mockGetWeightedProviders = jest.fn(() => ['groq']);
const mockGetGitHubConfig = jest.fn();
const mockSerginhoListRepos = jest.fn();
const mockSerginhoListBranches = jest.fn();
const mockSerginhoGetFile = jest.fn();

const routerModulePath = path.resolve(__dirname, '../../src/utils/intelligentRouter.js');
const circuitBreakerModulePath = path.resolve(__dirname, '../lib/circuit-breaker.js');
const providersConfigModulePath = path.resolve(__dirname, '../lib/providers-config.js');
const modelRegistryModulePath = path.resolve(__dirname, '../lib/model-registry.js');
const configModulePath = path.resolve(__dirname, '../lib/github/githubConfig.js');
const gatewayModulePath = path.resolve(__dirname, '../lib/serginho/githubGateway.js');

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

jest.unstable_mockModule(configModulePath, () => ({
  getGitHubConfig: mockGetGitHubConfig,
}));

jest.unstable_mockModule(gatewayModulePath, () => ({
  serginhoListRepos: mockSerginhoListRepos,
  serginhoListBranches: mockSerginhoListBranches,
  serginhoGetFile: mockSerginhoGetFile,
}));

let serginho;

beforeAll(async () => {
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

/** Contexto com dados suficientes para comparação (dois artefatos) */
function makeComparisonContext() {
  return {
    lastOwner: 'kizirianmax',
    lastRepo: 'rkmmax-hibrido',
    lastBranch: null,
    lastFilePath: 'package.json',
    lastGitHubResultType: 'file',
    lastGitHubSummary: 'Arquivo lido: package.json em kizirianmax/rkmmax-hibrido.',
    lastFileSnippet: '{ "name": "rkmmax-hibrido", "version": "3.0.0" }',
    previousGitHubResultType: 'file',
    previousGitHubSummary: 'Arquivo lido: README.md em kizirianmax/rkmmax-hibrido.',
    previousFileSnippet: '# rkmmax-hibrido\n\nProjeto React com IA.',
    previousFilePath: 'README.md',
  };
}

/** Contexto vazio (sem dados GitHub carregados) */
function makeEmptyContext() {
  return {
    lastOwner: null,
    lastRepo: null,
    lastBranch: null,
    lastFilePath: null,
    lastGitHubResultType: null,
    lastGitHubSummary: null,
    lastFileSnippet: null,
    previousGitHubResultType: null,
    previousGitHubSummary: null,
    previousFileSnippet: null,
    previousFilePath: null,
  };
}

/** Contexto analítico (só artefato atual, sem anterior) */
function makeAnalyticalOnlyContext() {
  return {
    lastOwner: 'kizirianmax',
    lastRepo: 'rkmmax-hibrido',
    lastBranch: null,
    lastFilePath: 'package.json',
    lastGitHubResultType: 'file',
    lastGitHubSummary: 'Arquivo lido: package.json em kizirianmax/rkmmax-hibrido.',
    lastFileSnippet: '{ "name": "rkmmax-hibrido", "version": "3.0.0" }',
    previousGitHubResultType: null,
    previousGitHubSummary: null,
    previousFileSnippet: null,
    previousFilePath: null,
  };
}

// ---------------------------------------------------------------------------
// 8) Integração orchestrator — contexto suficiente (comparative)
// ---------------------------------------------------------------------------

describe('Orchestrator — comparative follow-up com contexto suficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
    mockSerginhoListBranches.mockClear();
    mockSerginhoGetFile.mockClear();
  });

  test('isComparativeFollowUp=true + contexto com dois artefatos → analyzeComplexity chamado (fluxo LLM ativado)', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'compare os dois',
        context: { githubContext: makeComparisonContext() },
      });
    } catch {
      // Sem provider real — o que importa é que o fluxo LLM foi ativado
    }

    expect(analysisCalled).toBe(true);
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('_skipComparisonCheck bloqueia o bloco comparativo → vai direto ao fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'compare os dois',
        context: {
          githubContext: makeComparisonContext(),
          _skipComparisonCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    // Com _skipComparisonCheck=true, o bloco comparativo é pulado
    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9) Integração orchestrator — contexto insuficiente (comparative)
// ---------------------------------------------------------------------------

describe('Orchestrator — comparative follow-up com contexto insuficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('isComparativeFollowUp=true + contexto vazio → retorno imediato com mensagem amigável', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result).toBeDefined();
    expect(result.text).toBe(
      'Ainda não tenho contexto GitHub suficiente para comparar. Primeiro abra ou analise pelo menos dois artefatos relacionados, como README.md e package.json.',
    );
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('isComparativeFollowUp=true + contexto insuficiente → _meta.insufficientContext = true', async () => {
    const result = await serginho.handleRequest({
      message: 'compare ambos',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('isComparativeFollowUp=true + contexto insuficiente → _meta.comparativeFollowUp = true', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.comparativeFollowUp).toBe(true);
  });

  test('isComparativeFollowUp=true + só artefato atual (sem previous) → retorno imediato sem LLM', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeAnalyticalOnlyContext() },
    });

    expect(result._meta.insufficientContext).toBe(true);
    expect(result._meta.comparativeFollowUp).toBe(true);
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('retorno de contexto insuficiente tem traceId', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.traceId).toBeTruthy();
  });

  test('retorno de contexto insuficiente tem orchestrationTime', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(typeof result.orchestrationTime).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 10) Não-regressão — analytical flow N6/N7 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — analytical flow N6/N7', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta analítica não comparativa com contexto insuficiente → analyticalFollowUp=true (não comparativeFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
    expect(result._meta.comparativeFollowUp).toBeFalsy();
  });

  test('_skipAnalyticalCheck bloqueia o bloco analítico → vai ao fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'o que você conclui desse projeto?',
        context: {
          githubContext: makeAnalyticalOnlyContext(),
          _skipAnalyticalCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 11) Não-regressão — non-GitHub flow
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo não-GitHub', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem casual sem contexto GitHub → nenhum bloco comparativo/analítico dispara', async () => {
    mockGetEnabledProviders.mockReturnValue(['groq']);

    let result;
    try {
      result = await serginho.handleRequest({
        message: 'oi, tudo bem?',
        context: {},
      });
    } catch {
      result = null;
    }

    if (result && result._meta) {
      expect(result._meta.comparativeFollowUp).toBeFalsy();
      expect(result._meta.analyticalFollowUp).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 12) Não-regressão — tool execution (intent detection)
// ---------------------------------------------------------------------------

describe('Não-regressão — tool execution (intent detection)', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('"liste meus repos" → vai para tool execution sem interferência do bloco comparativo', async () => {
    mockGetGitHubConfig.mockReturnValue({ enabled: true, token: 'fake-token', useStub: false });
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ name: 'repo1', fullName: 'owner/repo1', private: false }] },
    });

    const result = await serginho.handleRequest({
      message: 'liste meus repositórios',
      context: {},
    });

    expect(result).toBeDefined();
    // Deve ter ido para tool execution, não comparativo
    expect(result._meta.comparativeFollowUp).toBeFalsy();
    expect(mockSerginhoListRepos).toHaveBeenCalled();
  });
});
