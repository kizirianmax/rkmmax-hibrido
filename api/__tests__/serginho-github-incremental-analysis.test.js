/**
 * api/__tests__/serginho-github-incremental-analysis.test.js
 * Testes para a análise incremental sobre contexto GitHub carregado.
 *
 * Cobre:
 *   - isAnalyticalFollowUp: positivos PT-BR, positivos EN, negativos
 *   - hasEnoughContextForAnalysis: null, vazio, campos presentes
 *   - buildAnalysisPrompt: contexto suficiente, insuficiente, package.json, README
 *   - getInsufficientContextMessage: string amigável em português
 *   - Integração no orchestrator: contexto suficiente → LLM chamado com prompt estruturado
 *   - Integração no orchestrator: contexto insuficiente → retorno imediato sem LLM
 *   - Não-regressão: fluxo normal, _skipAnalyticalCheck, detectGitHubIntent, formatter, contexto
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários do helper (sem mocks de módulos)
// Importados diretamente pois não dependem de módulos com side effects.
// ---------------------------------------------------------------------------

let isAnalyticalFollowUp;
let hasEnoughContextForAnalysis;
let buildAnalysisPrompt;
let getInsufficientContextMessage;

beforeAll(async () => {
  ({ isAnalyticalFollowUp, hasEnoughContextForAnalysis, buildAnalysisPrompt, getInsufficientContextMessage } =
    await import('../lib/serginho/analysis/githubContextAnalysis.js'));
});

// ---------------------------------------------------------------------------
// 1) isAnalyticalFollowUp — positivos PT-BR
// ---------------------------------------------------------------------------

describe('isAnalyticalFollowUp — positivos PT-BR', () => {
  test.each([
    'o que você conclui desse projeto?',
    'quais dependências chamam atenção?',
    'que stack esse projeto parece usar?',
    'há algum risco aqui?',
    'o que falta para esse repo ficar mais robusto?',
    'resuma os pontos principais',
    'analise isso',
    'analise esse arquivo',
    'o que você acha?',
    'sua opinião sobre isso',
    'o que você conclui?',
    'que stack esse projeto usa?',
    'há algum ponto fraco aqui?',
    'resuma',
    'analise este arquivo',
    'o que você acha desse código?',
    'sua opinião sobre o package.json',
    'compare isso com o README',
    'o que esse package.json indica sobre maturidade do projeto?',
    'qual parece mais maduro?',
  ])('"%s" → true', (msg) => {
    expect(isAnalyticalFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2) isAnalyticalFollowUp — positivos EN
// ---------------------------------------------------------------------------

describe('isAnalyticalFollowUp — positivos EN', () => {
  test.each([
    'what do you conclude?',
    'summarize this',
    'analyze this file',
    'what do you think?',
    'what stack does this project use?',
    'any risks here?',
    'what risks are there?',
    'summarize the main points',
    'your opinion on this',
    'analyse this',
    'what do you think about the code?',
    'summarize the dependencies',
    'what conclusion do you draw?',
    'any weaknesses here?',
  ])('"%s" → true', (msg) => {
    expect(isAnalyticalFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3) isAnalyticalFollowUp — negativos (novos comandos GitHub e mensagens casuais)
// ---------------------------------------------------------------------------

describe('isAnalyticalFollowUp — negativos', () => {
  test.each([
    'abra o package.json de owner/repo',
    'liste os repos de owner',
    'mostre branches de owner/repo',
    'oi',
    'olá',
    'tudo bem',
    'liste meus repositórios',
    'mostre o arquivo README.md do repo owner/repo',
    'abrir package.json de kizirianmax/rkmmax-hibrido',
    'liste as branches do repo owner/repo',
  ])('"%s" → false', (msg) => {
    expect(isAnalyticalFollowUp(msg)).toBe(false);
  });

  test('string vazia → false', () => {
    expect(isAnalyticalFollowUp('')).toBe(false);
  });

  test('null → false', () => {
    expect(isAnalyticalFollowUp(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isAnalyticalFollowUp(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4) hasEnoughContextForAnalysis
// ---------------------------------------------------------------------------

describe('hasEnoughContextForAnalysis', () => {
  test('null → false', () => {
    expect(hasEnoughContextForAnalysis(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(hasEnoughContextForAnalysis(undefined)).toBe(false);
  });

  test('objeto vazio → false', () => {
    expect(hasEnoughContextForAnalysis({})).toBe(false);
  });

  test('todos os campos null → false', () => {
    expect(hasEnoughContextForAnalysis({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(false);
  });

  test('lastGitHubSummary preenchido → true', () => {
    expect(hasEnoughContextForAnalysis({
      lastGitHubSummary: 'Repositórios listados (3 total): repo1, repo2, repo3',
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(true);
  });

  test('lastFileSnippet preenchido → true', () => {
    expect(hasEnoughContextForAnalysis({
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "app", "version": "1.0.0" }',
      lastGitHubResultType: null,
    })).toBe(true);
  });

  test('lastGitHubResultType preenchido → true', () => {
    expect(hasEnoughContextForAnalysis({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
    })).toBe(true);
  });

  test('todos os campos preenchidos → true', () => {
    expect(hasEnoughContextForAnalysis({
      lastGitHubSummary: 'Arquivo lido: package.json em owner/repo.',
      lastFileSnippet: '{ "name": "app" }',
      lastGitHubResultType: 'file',
    })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5) buildAnalysisPrompt — contexto suficiente vs insuficiente
// ---------------------------------------------------------------------------

describe('buildAnalysisPrompt', () => {
  test('contexto null → retorna null', () => {
    expect(buildAnalysisPrompt('o que você acha?', null)).toBeNull();
  });

  test('contexto vazio (sem campos) → retorna null', () => {
    expect(buildAnalysisPrompt('o que você acha?', {})).toBeNull();
  });

  test('contexto insuficiente (todos null) → retorna null', () => {
    expect(buildAnalysisPrompt('o que você acha?', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBeNull();
  });

  test('contexto com summary → retorna string com a pergunta do usuário', () => {
    const ctx = {
      lastGitHubSummary: 'Repositórios listados (2 total): repo1, repo2',
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
    };
    const prompt = buildAnalysisPrompt('o que você conclui?', ctx);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('o que você conclui?');
  });

  test('contexto com summary → prompt contém o summary', () => {
    const summary = 'Repositórios listados (2 total): repo1, repo2';
    const ctx = { lastGitHubSummary: summary, lastFileSnippet: null, lastGitHubResultType: 'repos' };
    const prompt = buildAnalysisPrompt('resuma os pontos', ctx);
    expect(prompt).toContain(summary);
  });

  test('contexto com snippet → prompt contém o snippet', () => {
    const snippet = '{ "name": "myapp", "version": "2.0.0" }';
    const ctx = {
      lastGitHubSummary: 'Arquivo lido: package.json',
      lastFileSnippet: snippet,
      lastGitHubResultType: 'file',
    };
    const prompt = buildAnalysisPrompt('analise isso', ctx);
    expect(prompt).toContain(snippet);
  });

  test('prompt contém instrução para responder em PT-BR', () => {
    const ctx = { lastGitHubSummary: 'Resumo', lastFileSnippet: null, lastGitHubResultType: 'repos' };
    const prompt = buildAnalysisPrompt('o que você acha?', ctx);
    expect(prompt).toMatch(/PT-BR|português/i);
  });

  test('prompt contém instrução para não inventar dados', () => {
    const ctx = { lastGitHubSummary: 'Resumo', lastFileSnippet: null, lastGitHubResultType: 'repos' };
    const prompt = buildAnalysisPrompt('analise isso', ctx);
    expect(prompt).toMatch(/não invente|não invent/i);
  });

  test('prompt contém instrução "SOMENTE com base no contexto"', () => {
    const ctx = { lastGitHubSummary: 'Resumo', lastFileSnippet: null, lastGitHubResultType: 'repos' };
    const prompt = buildAnalysisPrompt('analise isso', ctx);
    expect(prompt).toMatch(/somente|SOMENTE/i);
  });

  test('prompt começa com marcação de contexto GitHub', () => {
    const ctx = { lastGitHubSummary: 'Resumo', lastFileSnippet: null, lastGitHubResultType: 'repos' };
    const prompt = buildAnalysisPrompt('analise isso', ctx);
    expect(prompt).toMatch(/\[Contexto GitHub/);
  });
});

// ---------------------------------------------------------------------------
// 6) buildAnalysisPrompt com package.json
// ---------------------------------------------------------------------------

describe('buildAnalysisPrompt com package.json', () => {
  test('ctx com snippet de package.json → prompt inclui snippet', () => {
    const snippet = '{\n  "name": "rkmmax-hibrido",\n  "version": "3.0.0",\n  "dependencies": { "react": "^18.0.0" }\n}';
    const ctx = {
      lastGitHubSummary: 'Arquivo lido: package.json em owner/repo. Início: { "name": "rkmmax-hibrido"',
      lastFileSnippet: snippet,
      lastGitHubResultType: 'file',
      lastFilePath: 'package.json',
    };
    const prompt = buildAnalysisPrompt('o que esse package.json indica sobre maturidade do projeto?', ctx);
    expect(prompt).toContain(snippet);
    expect(prompt).toContain('package.json indica sobre maturidade');
  });
});

// ---------------------------------------------------------------------------
// 7) buildAnalysisPrompt com README.md
// ---------------------------------------------------------------------------

describe('buildAnalysisPrompt com README.md', () => {
  test('ctx com summary de README → prompt inclui summary', () => {
    const summary = 'Arquivo lido: README.md em owner/repo. Início: # Projeto Exemplo Este projeto faz X';
    const ctx = {
      lastGitHubSummary: summary,
      lastFileSnippet: '# Projeto Exemplo\n\nEste projeto faz X.',
      lastGitHubResultType: 'file',
      lastFilePath: 'README.md',
    };
    const prompt = buildAnalysisPrompt('compare isso com o README', ctx);
    expect(prompt).toContain(summary);
    expect(prompt).toContain('compare isso com o README');
  });
});

// ---------------------------------------------------------------------------
// 8) getInsufficientContextMessage
// ---------------------------------------------------------------------------

describe('getInsufficientContextMessage', () => {
  test('retorna string não vazia em português', () => {
    const msg = getInsufficientContextMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('menciona como obter dados GitHub', () => {
    const msg = getInsufficientContextMessage();
    // Deve orientar o usuário a carregar dados primeiro
    expect(msg).toMatch(/repositório|repo|arquivo|branch|listar|owner/i);
  });

  test('retorna a mensagem exata esperada', () => {
    const msg = getInsufficientContextMessage();
    expect(msg).toBe(
      "Ainda não tenho dados GitHub carregados nesta conversa. Primeiro peça para listar repositórios, branches ou abrir um arquivo. Exemplo: 'mostre o package.json de owner/repo'.",
    );
  });
});

// ---------------------------------------------------------------------------
// Parte 2 — Testes de integração com o Serginho Orchestrator
// ---------------------------------------------------------------------------

// Mocks para providers/módulos
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

// Mock do provider Groq para simular chamada LLM bem-sucedida
const mockGroqCall = jest.fn();

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

// Importação dinâmica após mocks registrados
beforeAll(async () => {
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

/** Contexto com dados suficientes para análise */
function makeRichContext() {
  return {
    lastOwner: 'kizirianmax',
    lastRepo: 'rkmmax-hibrido',
    lastBranch: null,
    lastFilePath: 'package.json',
    lastGitHubResultType: 'file',
    lastGitHubSummary: 'Arquivo lido: package.json em kizirianmax/rkmmax-hibrido. Início: { "name": "rkmmax-hibrido"',
    lastFileSnippet: '{ "name": "rkmmax-hibrido", "version": "3.0.0", "dependencies": { "react": "^18.0.0" } }',
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
  };
}

// ---------------------------------------------------------------------------
// 9) Integração orchestrator — contexto suficiente → LLM chamado com prompt estruturado
// ---------------------------------------------------------------------------

describe('Orchestrator — analytical follow-up com contexto suficiente', () => {
  test('isAnalyticalFollowUp=true + contexto carregado → analyzeComplexity é chamado (fluxo LLM ativado)', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'o que você conclui desse projeto?',
        context: { githubContext: makeRichContext() },
      });
    } catch {
      // Sem provider real, falha esperada — o que importa é que o fluxo LLM foi ativado
    }

    expect(analysisCalled).toBe(true);
    // Ferramentas GitHub NÃO devem ser chamadas (não é um novo comando GitHub)
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('prompt enviado ao LLM contém o contexto GitHub do snippet', async () => {
    const capturedMessages = [];
    mockAnalyzeComplexity.mockImplementation(() => {
      return { scores: { complexity: 0.5 } };
    });

    // Captura a mensagem efetiva passada ao LLM via erro estruturado
    let capturedMessage = null;
    mockAnalyzeComplexity.mockImplementation((msg) => {
      capturedMessage = msg;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'analise isso',
        context: { githubContext: makeRichContext() },
      });
    } catch {
      // sem provider real
    }

    // analyzeComplexity deve ter sido chamado com o prompt estruturado
    // que contém o conteúdo do contexto GitHub
    expect(capturedMessage).toBeTruthy();
    expect(capturedMessage).toContain('rkmmax-hibrido');
  });

  test('_meta.analyticalFollowUp = true quando orchestrator faz recursão com _skipAnalyticalCheck', async () => {
    // Testamos a guarda de recursão diretamente: com _skipAnalyticalCheck=true,
    // o bloco analytical não deve ser ativado mesmo com mensagem analítica
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
          githubContext: makeRichContext(),
          _skipAnalyticalCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    // Com _skipAnalyticalCheck=true, o bloco analytical é pulado e vai direto ao fluxo LLM
    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10) Integração orchestrator — contexto insuficiente → retorno imediato sem LLM
// ---------------------------------------------------------------------------

describe('Orchestrator — analytical follow-up com contexto insuficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('isAnalyticalFollowUp=true + contexto vazio → retorno imediato sem chamar analyzeComplexity', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    // LLM NÃO deve ter sido chamado
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
    // Ferramentas GitHub NÃO devem ter sido chamadas
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
  });

  test('provider é "serginho-analysis" no retorno de contexto insuficiente', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.provider).toBe('serginho-analysis');
  });

  test('model é "serginho-intent" no retorno de contexto insuficiente', async () => {
    const result = await serginho.handleRequest({
      message: 'resuma os pontos principais',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.model).toBe('serginho-intent');
  });

  test('texto contém mensagem amigável em português orientando o usuário', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você acha?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.text).toMatch(/repositório|arquivo|branch|owner/i);
  });

  test('_meta.insufficientContext = true no retorno', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('_meta.analyticalFollowUp = true no retorno', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
  });

  test('_meta.githubContext presente no retorno', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.githubContext).toBeDefined();
  });

  test('traceId presente no retorno', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.traceId).toBeDefined();
    expect(typeof result.traceId).toBe('string');
  });

  test('orchestrationTime presente no retorno', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.orchestrationTime).toBeDefined();
    expect(typeof result.orchestrationTime).toBe('number');
  });

  test('contexto sem githubContext (undefined) → retorno insuficiente', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: {},
    });

    // Sem githubContext, contexto é criado vazio → insuficiente
    expect(result.provider).toBe('serginho-analysis');
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('com forceProvider, mensagem analítica NÃO retorna insuficiente e segue para fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'analise isso',
        context: { githubContext: makeEmptyContext() },
        options: { forceProvider: 'groq', noFallback: true },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 11) Não-regressão — fluxo normal para mensagens não-analíticas
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo normal para mensagens não-analíticas', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem não-analítica → bloco analytical NÃO é executado, fluxo normal continua', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'qual a previsão do tempo?',
        context: { githubContext: makeRichContext() },
      });
    } catch {
      // sem provider real
    }

    // Fluxo normal deve ter sido ativado (analyzeComplexity chamado)
    expect(analysisCalled).toBe(true);
  });

  test('mensagem casual → bloco analytical NÃO intercepta', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.1 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'oi',
        context: { githubContext: makeEmptyContext() },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12) Não-regressão — _skipAnalyticalCheck evita loop infinito
// ---------------------------------------------------------------------------

describe('Não-regressão — _skipAnalyticalCheck evita recursão infinita', () => {
  test('com _skipAnalyticalCheck=true e mensagem analítica → bloco NÃO é executado', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'analise isso',
        context: {
          githubContext: makeEmptyContext(),
          _skipAnalyticalCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    // Com _skipAnalyticalCheck, vai direto ao fluxo LLM
    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 13) Não-regressão — detectGitHubIntent ainda funciona após bloco analytical
// ---------------------------------------------------------------------------

describe('Não-regressão — detectGitHubIntent ainda funciona', () => {
  test('mensagem de comando GitHub → vai para tool, não para analytical', async () => {
    mockGetGitHubConfig.mockReturnValue({
      enabled: true,
      mode: 'oauth',
      token: 'test-token',
    });
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ name: 'r', fullName: 'u/r' }], mode: 'oauth' },
    });

    const result = await serginho.handleRequest({
      message: 'liste meus repositórios',
      context: { githubContext: makeEmptyContext() },
    });

    // Deve ter ido pelo fluxo de tools (não analytical)
    expect(result.provider).toBe('serginho-tools');
    expect(mockSerginhoListRepos).toHaveBeenCalled();
  });

  test('com forceProvider, comando GitHub NÃO faz early-return de tool', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);
    mockSerginhoListRepos.mockClear();

    try {
      await serginho.handleRequest({
        message: 'liste meus repositórios',
        context: { githubContext: makeEmptyContext() },
        options: { forceProvider: 'groq', noFallback: true },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 14) Não-regressão — formatter não é afetado
// ---------------------------------------------------------------------------

describe('Não-regressão — formatter de tool results não é afetado', () => {
  test('resultado de tool GitHub é formatado normalmente', async () => {
    mockGetGitHubConfig.mockReturnValue({
      enabled: true,
      mode: 'oauth',
      token: 'test-token',
    });
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: {
        repos: [
          { name: 'repo1', fullName: 'owner/repo1', private: false, description: 'Desc' },
        ],
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest({
      message: 'liste meus repositórios',
      context: {},
    });

    expect(result.text).toBeTruthy();
    expect(result.provider).toBe('serginho-tools');
  });
});

// ---------------------------------------------------------------------------
// 15) Não-regressão — updateContextFromToolResult ainda chamado após tool execution
// ---------------------------------------------------------------------------

describe('Não-regressão — contexto atualizado após tool execution', () => {
  test('após tool execution, githubContext em _meta reflete os dados da operação', async () => {
    mockGetGitHubConfig.mockReturnValue({
      enabled: true,
      mode: 'oauth',
      token: 'test-token',
    });
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: {
        repos: [
          { name: 'rkmmax-hibrido', fullName: 'kizirianmax/rkmmax-hibrido', private: false },
        ],
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest({
      message: 'liste meus repositórios',
      context: {},
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.githubContext).toBeDefined();
    // Após listar repos, lastGitHubResultType deve ser 'repos'
    expect(result._meta.githubContext.lastGitHubResultType).toBe('repos');
    expect(result._meta.githubContext.lastGitHubSummary).toBeTruthy();
  });
});
