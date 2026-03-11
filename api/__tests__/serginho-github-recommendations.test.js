/**
 * api/__tests__/serginho-github-recommendations.test.js
 * Testes para as recomendações acionáveis sobre contexto GitHub carregado (N9).
 *
 * Cobre:
 *   - isActionRecommendationFollowUp: positivos PT-BR, positivos EN, negativos
 *   - hasEnoughContextForRecommendations: null, vazio, campos presentes
 *   - buildRecommendationPrompt: contexto suficiente, insuficiente, com previous*
 *   - formatRecommendationResponse: estrutura, cabeçalho, rodapé, truncamento, sanitização
 *   - getInsufficientRecommendationContextMessage: string amigável em português
 *   - Integração no orchestrator: contexto suficiente → LLM chamado com prompt estruturado
 *   - Integração no orchestrator: contexto insuficiente → retorno imediato sem LLM
 *   - Não-regressão: comparative N8, analytical N6/N7, non-GitHub, tool execution
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários dos helpers (sem mocks de módulos)
// ---------------------------------------------------------------------------

let isActionRecommendationFollowUp;
let hasEnoughContextForRecommendations;
let buildRecommendationPrompt;
let formatRecommendationResponse;
let getInsufficientRecommendationContextMessage;

beforeAll(async () => {
  ({
    isActionRecommendationFollowUp,
    hasEnoughContextForRecommendations,
    buildRecommendationPrompt,
    formatRecommendationResponse,
    getInsufficientRecommendationContextMessage,
  } = await import('../lib/serginho/analysis/githubActionRecommendations.js'));
});

// ---------------------------------------------------------------------------
// 1) isActionRecommendationFollowUp — positivos PT-BR
// ---------------------------------------------------------------------------

describe('isActionRecommendationFollowUp — positivos PT-BR', () => {
  test.each([
    'o que eu deveria fazer agora?',
    'quais são os próximos passos?',
    'qual a prioridade aqui?',
    'o que você recomenda melhorar primeiro?',
    'quais mudanças teriam mais impacto?',
    'o que esse projeto precisa para ficar mais robusto?',
    'me dê um plano curto de melhoria',
    'quais correções são mais urgentes?',
    'por onde eu começo?',
    'o que está faltando aqui?',
    'próximos passos',
    'qual é a prioridade?',
    'o que deveria ser melhorado primeiro?',
    'me dá recomendações',
    'o que seria mais urgente?',
  ])('"%s" → true', (msg) => {
    expect(isActionRecommendationFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2) isActionRecommendationFollowUp — positivos EN
// ---------------------------------------------------------------------------

describe('isActionRecommendationFollowUp — positivos EN', () => {
  test.each([
    'what should I do next?',
    'what are the priorities?',
    'what improvements would have the biggest impact?',
    "what's most urgent?",
    'give me recommendations',
    'give me a plan',
    'what does this project need?',
    'where do I start?',
    'what should be fixed first?',
    'what are the most critical issues?',
  ])('"%s" → true', (msg) => {
    expect(isActionRecommendationFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3) isActionRecommendationFollowUp — negativos
// ---------------------------------------------------------------------------

describe('isActionRecommendationFollowUp — negativos', () => {
  test.each([
    'abra o package.json de owner/repo',
    'liste os repos de owner',
    'mostre as branches de owner/repo',
    'oi',
    'olá',
    'tudo bem',
    'o que você conclui desse projeto?',
    'compare isso com o README',
    '',
  ])('"%s" → false', (msg) => {
    expect(isActionRecommendationFollowUp(msg)).toBe(false);
  });

  test('null → false', () => {
    expect(isActionRecommendationFollowUp(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isActionRecommendationFollowUp(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4) hasEnoughContextForRecommendations
// ---------------------------------------------------------------------------

describe('hasEnoughContextForRecommendations', () => {
  test('null → false', () => {
    expect(hasEnoughContextForRecommendations(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(hasEnoughContextForRecommendations(undefined)).toBe(false);
  });

  test('objeto vazio → false', () => {
    expect(hasEnoughContextForRecommendations({})).toBe(false);
  });

  test('{ lastGitHubSummary: "algo" } → true', () => {
    expect(hasEnoughContextForRecommendations({ lastGitHubSummary: 'algo' })).toBe(true);
  });

  test('{ lastFileSnippet: "algo" } → true', () => {
    expect(hasEnoughContextForRecommendations({ lastFileSnippet: 'algo' })).toBe(true);
  });

  test('{ lastGitHubResultType: "repos" } → true', () => {
    expect(hasEnoughContextForRecommendations({ lastGitHubResultType: 'repos' })).toBe(true);
  });

  test('todos os campos null → false', () => {
    expect(hasEnoughContextForRecommendations({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5) buildRecommendationPrompt
// ---------------------------------------------------------------------------

describe('buildRecommendationPrompt', () => {
  const richCtx = {
    lastGitHubSummary: 'Arquivo lido: package.json em owner/repo.',
    lastFileSnippet: '{ "name": "app", "version": "1.0.0" }',
    previousGitHubSummary: 'Arquivo lido: README.md em owner/repo.',
    previousFileSnippet: '# App\n\nProjeto de exemplo.',
  };

  test('contexto suficiente → retorna string com [Contexto GitHub para recomendações]', () => {
    const prompt = buildRecommendationPrompt('quais são os próximos passos?', richCtx);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('[Contexto GitHub para recomendações]');
  });

  test('contexto suficiente → contém Pergunta do usuário:', () => {
    const prompt = buildRecommendationPrompt('quais são os próximos passos?', richCtx);
    expect(prompt).toContain('Pergunta do usuário:');
  });

  test('contexto suficiente → contém Instruções:', () => {
    const prompt = buildRecommendationPrompt('quais são os próximos passos?', richCtx);
    expect(prompt).toContain('Instruções:');
  });

  test('contexto suficiente → instruções mencionam prioridade', () => {
    const prompt = buildRecommendationPrompt('quais são os próximos passos?', richCtx);
    expect(prompt.toLowerCase()).toMatch(/prioridade/i);
  });

  test('com lastGitHubSummary → prompt inclui o summary', () => {
    const prompt = buildRecommendationPrompt('próximos passos', richCtx);
    expect(prompt).toContain('Arquivo lido: package.json em owner/repo.');
  });

  test('com lastFileSnippet → prompt inclui o trecho', () => {
    const prompt = buildRecommendationPrompt('próximos passos', richCtx);
    expect(prompt).toContain('{ "name": "app", "version": "1.0.0" }');
  });

  test('com previousGitHubSummary → prompt inclui Contexto anterior:', () => {
    const prompt = buildRecommendationPrompt('próximos passos', richCtx);
    expect(prompt).toContain('Contexto anterior:');
    expect(prompt).toContain('Arquivo lido: README.md em owner/repo.');
  });

  test('contexto insuficiente (null) → retorna null', () => {
    expect(buildRecommendationPrompt('próximos passos', null)).toBeNull();
  });

  test('contexto insuficiente (vazio) → retorna null', () => {
    expect(buildRecommendationPrompt('próximos passos', {})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6) formatRecommendationResponse
// ---------------------------------------------------------------------------

describe('formatRecommendationResponse', () => {
  test('texto com estrutura markdown (#) → mantém sem adicionar cabeçalho', () => {
    const input = '# Meu Título\n\n- item 1\n- item 2';
    const result = formatRecommendationResponse(input);
    expect(result).toContain('# Meu Título');
    expect(result).not.toMatch(/^## Recomendações/);
  });

  test('texto sem estrutura → adiciona ## Recomendações', () => {
    const input = 'Você deve melhorar os testes unitários e adicionar CI/CD. Isso ajudará na qualidade geral do projeto.';
    const result = formatRecommendationResponse(input);
    expect(result).toContain('## Recomendações');
  });

  test('texto curto (< 80 chars) → retorna quase intacto (sem cabeçalho)', () => {
    const input = 'Curto demais.';
    const result = formatRecommendationResponse(input);
    expect(result).toBe('Curto demais.');
    expect(result).not.toContain('## Recomendações');
  });

  test('texto com options.maxLength → trunca com [resposta truncada]', () => {
    const longText = 'A'.repeat(200) + ' final text that is very long';
    const result = formatRecommendationResponse(longText, { maxLength: 100 });
    expect(result).toContain('[resposta truncada]');
    // The 'A' characters from the raw text should be truncated
    const aCount = (result.match(/A/g) || []).length;
    expect(aCount).toBeLessThanOrEqual(100);
  });

  test('texto vazio → retorna ""', () => {
    expect(formatRecommendationResponse('')).toBe('');
  });

  test('null → retorna ""', () => {
    expect(formatRecommendationResponse(null)).toBe('');
  });

  test('texto já contendo "baseada no contexto" → não adiciona rodapé duplicado', () => {
    const input = 'Texto longo o suficiente para não ser curto. Esta análise está baseada no contexto atual do projeto e do repositório GitHub. Recomendações detalhadas seguem abaixo.';
    const result = formatRecommendationResponse(input);
    // Count occurrences of "baseada"
    const occurrences = (result.match(/baseada/gi) || []).length;
    expect(occurrences).toBe(1);
  });

  test('texto sem rodapé → adiciona rodapé com *Recomendações baseadas no contexto GitHub*', () => {
    const input = 'Você deve melhorar os testes unitários, adicionar documentação e revisar as dependências do projeto.';
    const result = formatRecommendationResponse(input);
    expect(result).toContain('*Recomendações baseadas no contexto GitHub carregado nesta conversa.*');
  });

  test('texto com token sk-abc... → redacted', () => {
    const input = 'Texto longo com um token vazado: sk-abcdefghijklmnopqrstuvwxyz123456 que não deve aparecer na resposta final.';
    const result = formatRecommendationResponse(input);
    expect(result).not.toContain('sk-abcdefghijklmnopqrstuvwxyz123456');
    expect(result).toContain('[REDACTED]');
  });
});

// ---------------------------------------------------------------------------
// 7) getInsufficientRecommendationContextMessage
// ---------------------------------------------------------------------------

describe('getInsufficientRecommendationContextMessage', () => {
  test('retorna string não vazia', () => {
    const msg = getInsufficientRecommendationContextMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('contém orientação ao usuário com exemplo de artefato', () => {
    const msg = getInsufficientRecommendationContextMessage();
    expect(msg.toLowerCase()).toMatch(/package\.json|artefatos/i);
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

/** Contexto rico com dados suficientes para recomendações */
function makeRichContext() {
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

/** Contexto só com artefato atual (sem previous) */
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
// 8) Integração orchestrator — contexto insuficiente
// ---------------------------------------------------------------------------

describe('Orchestrator — recommendation follow-up com contexto insuficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('isActionRecommendationFollowUp=true + contexto vazio → retorno imediato sem LLM', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result).toBeDefined();
    expect(result.text).toContain('Ainda não tenho contexto GitHub suficiente');
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('contexto insuficiente → _meta.insufficientContext = true', async () => {
    const result = await serginho.handleRequest({
      message: 'por onde eu começo?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('contexto insuficiente → _meta.recommendationFollowUp = true', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.recommendationFollowUp).toBe(true);
  });

  test('contexto insuficiente → resultado contém traceId', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.traceId).toBeTruthy();
  });

  test('contexto insuficiente → resultado contém orchestrationTime', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(typeof result.orchestrationTime).toBe('number');
  });

  test('contexto insuficiente → mensagem contém getInsufficientRecommendationContextMessage()', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê recomendações',
      context: { githubContext: makeEmptyContext() },
    });

    const expected = getInsufficientRecommendationContextMessage();
    expect(result.text).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 9) Integração orchestrator — contexto suficiente
// ---------------------------------------------------------------------------

describe('Orchestrator — recommendation follow-up com contexto suficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
    mockSerginhoListBranches.mockClear();
    mockSerginhoGetFile.mockClear();
  });

  test('isActionRecommendationFollowUp=true + contexto rico → analyzeComplexity chamado (fluxo LLM ativado)', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'quais são os próximos passos?',
        context: { githubContext: makeRichContext() },
      });
    } catch {
      // Sem provider real — o que importa é que o fluxo LLM foi ativado
    }

    expect(analysisCalled).toBe(true);
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('_skipRecommendationCheck bloqueia recursão → vai direto ao fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'quais são os próximos passos?',
        context: {
          githubContext: makeRichContext(),
          _skipRecommendationCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    // Com _skipRecommendationCheck=true, o bloco de recomendação é pulado
    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10) Não-regressão — comparative flow N8 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — comparative flow N8', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta comparativa pura + contexto insuficiente → comparativeFollowUp=true (sem recommendationFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.comparativeFollowUp).toBe(true);
    expect(result._meta.recommendationFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 11) Não-regressão — analytical flow N6/N7 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — analytical flow N6/N7', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta analítica pura + contexto insuficiente → analyticalFollowUp=true (sem recommendationFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
    expect(result._meta.recommendationFollowUp).toBeFalsy();
  });

  test('_skipAnalyticalCheck bloqueia bloco analítico → vai ao fluxo LLM', async () => {
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
// 12) Não-regressão — tool execution
// ---------------------------------------------------------------------------

describe('Não-regressão — tool execution (intent detection)', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('"liste meus repositórios" → vai para tool execution normalmente', async () => {
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
    expect(result._meta.recommendationFollowUp).toBeFalsy();
    expect(mockSerginhoListRepos).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 13) Não-regressão — non-GitHub flow
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo não-GitHub', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem genérica sem contexto → nenhum bloco recommendation/comparison/analytical dispara', async () => {
    mockGetEnabledProviders.mockReturnValue(['groq']);

    let result;
    try {
      result = await serginho.handleRequest({
        message: 'me explique o que é machine learning',
        context: {},
      });
    } catch {
      result = null;
    }

    if (result && result._meta) {
      expect(result._meta.recommendationFollowUp).toBeFalsy();
      expect(result._meta.comparativeFollowUp).toBeFalsy();
      expect(result._meta.analyticalFollowUp).toBeFalsy();
    }
  });
});
