/**
 * api/__tests__/serginho-github-action-plan.test.js
 * Testes para o plano de ação sequencial sobre contexto GitHub carregado (N10).
 *
 * Cobre:
 *   - isActionPlanFollowUp: positivos PT-BR, positivos EN, negativos
 *   - hasEnoughContextForActionPlan: null, vazio, campos presentes
 *   - buildActionPlanPrompt: contexto suficiente, insuficiente, com previous*
 *   - formatActionPlanResponse: estrutura, cabeçalho, rodapé, truncamento, sanitização
 *   - getInsufficientActionPlanContextMessage: string amigável em português
 *   - Integração no orchestrator: contexto suficiente → LLM chamado com prompt estruturado
 *   - Integração no orchestrator: contexto insuficiente → retorno imediato sem LLM
 *   - Não-regressão: recommendation N9, comparative N8, analytical N6/N7, non-GitHub
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários dos helpers (sem mocks de módulos)
// ---------------------------------------------------------------------------

let isActionPlanFollowUp;
let hasEnoughContextForActionPlan;
let buildActionPlanPrompt;
let formatActionPlanResponse;
let getInsufficientActionPlanContextMessage;

beforeAll(async () => {
  ({
    isActionPlanFollowUp,
    hasEnoughContextForActionPlan,
    buildActionPlanPrompt,
    formatActionPlanResponse,
    getInsufficientActionPlanContextMessage,
  } = await import('../lib/serginho/analysis/githubActionPlan.js'));
});

// ---------------------------------------------------------------------------
// 1) isActionPlanFollowUp — positivos PT-BR
// ---------------------------------------------------------------------------

describe('isActionPlanFollowUp — positivos PT-BR', () => {
  test.each([
    'me dê um plano de ação',
    'qual seria a sequência ideal?',
    'quais passos eu devo seguir agora?',
    'monte um mini roadmap',
    'ordene isso por impacto e esforço',
    'qual seria um plano curto para melhorar esse repo?',
    'plano de implementação',
    'sequência de execução',
    'organize em etapas',
    'roadmap para o projeto',
    'qual é a ordem de execução?',
    'sequência prática para melhorar o projeto',
    'quais etapas devo seguir?',
    'me dê um roadmap',
    'plano de melhoria',
    'sequência de trabalho',
    'plano rápido',
    'por ordem de prioridade',
  ])('"%s" → true', (msg) => {
    expect(isActionPlanFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2) isActionPlanFollowUp — positivos EN
// ---------------------------------------------------------------------------

describe('isActionPlanFollowUp — positivos EN', () => {
  test.each([
    'what plan would you suggest?',
    'give me a short roadmap',
    'what sequence should I follow?',
    'action plan',
    'give me a step-by-step plan',
    'what steps should we take?',
    'implementation plan',
    'give me a roadmap',
    'execution order',
    'ordered steps',
    'what sequence of actions?',
    'prioritize these steps',
  ])('"%s" → true', (msg) => {
    expect(isActionPlanFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3) isActionPlanFollowUp — negativos (devem retornar false)
// ---------------------------------------------------------------------------

describe('isActionPlanFollowUp — negativos', () => {
  test.each([
    // Novos comandos GitHub
    ['abra package.json de owner/repo', 'novo comando GitHub'],
    ['liste os repos de owner', 'novo comando GitHub'],
    ['mostre branches de owner/repo', 'novo comando GitHub'],

    // Analíticos puros (N6)
    ['o que você conclui?', 'analítico puro'],
    ['analise isso', 'analítico puro'],
    ['what do you think?', 'analítico puro EN'],

    // Comparativos puros (N8)
    ['compare isso com o README', 'comparativo puro'],
    ['compare os dois', 'comparativo puro'],

    // Recomendações puras sem sequência (N9)
    ['o que melhorar primeiro?', 'recomendação pura N9'],
    ['quais são as prioridades?', 'recomendação pura N9'],

    // Casuais
    ['oi', 'casual PT'],
    ['tudo bem', 'casual PT'],
    ['hello', 'casual EN'],

    // Não relacionados
    ['qual é o capital do Brasil?', 'não relacionado'],
    ['', 'string vazia'],
  ])('"%s" (%s) → false', (msg) => {
    expect(isActionPlanFollowUp(msg)).toBe(false);
  });

  test('com inline code → false', () => {
    expect(isActionPlanFollowUp('function f() { return 1; } // me dê um plano')).toBe(false);
  });

  test('null → false', () => {
    expect(isActionPlanFollowUp(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isActionPlanFollowUp(undefined)).toBe(false);
  });

  test('número (não string) → false', () => {
    expect(isActionPlanFollowUp(123)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4) hasEnoughContextForActionPlan
// ---------------------------------------------------------------------------

describe('hasEnoughContextForActionPlan', () => {
  test('null → false', () => {
    expect(hasEnoughContextForActionPlan(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(hasEnoughContextForActionPlan(undefined)).toBe(false);
  });

  test('objeto vazio → false', () => {
    expect(hasEnoughContextForActionPlan({})).toBe(false);
  });

  test('todos os campos relevantes null → false', () => {
    expect(hasEnoughContextForActionPlan({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(false);
  });

  test('lastGitHubSummary preenchido → true', () => {
    expect(hasEnoughContextForActionPlan({
      lastGitHubSummary: 'Arquivo lido: package.json',
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(true);
  });

  test('lastFileSnippet preenchido → true', () => {
    expect(hasEnoughContextForActionPlan({
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "test" }',
      lastGitHubResultType: null,
    })).toBe(true);
  });

  test('lastGitHubResultType preenchido → true', () => {
    expect(hasEnoughContextForActionPlan({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    })).toBe(true);
  });

  test('dois campos preenchidos → true', () => {
    expect(hasEnoughContextForActionPlan({
      lastGitHubSummary: 'Repositórios: owner/repo',
      lastFileSnippet: '{ "name": "test" }',
      lastGitHubResultType: null,
    })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5) buildActionPlanPrompt
// ---------------------------------------------------------------------------

describe('buildActionPlanPrompt', () => {
  test('contexto null → retorna null', () => {
    expect(buildActionPlanPrompt('me dê um plano', null)).toBeNull();
  });

  test('contexto vazio → retorna null', () => {
    expect(buildActionPlanPrompt('me dê um plano', {})).toBeNull();
  });

  test('com lastGitHubSummary → retorna string contendo o summary', () => {
    const prompt = buildActionPlanPrompt('me dê um plano de ação', {
      lastGitHubSummary: 'Arquivo lido: package.json em owner/repo.',
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    });
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('Arquivo lido: package.json em owner/repo.');
  });

  test('com lastFileSnippet → retorna string contendo o snippet', () => {
    const prompt = buildActionPlanPrompt('me dê um plano', {
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "myapp" }',
      lastGitHubResultType: 'file',
    });
    expect(prompt).toContain('{ "name": "myapp" }');
    expect(prompt).toContain('Conteúdo do arquivo (trecho):');
  });

  test('com previousGitHubSummary → retorna string contendo "Contexto anterior"', () => {
    const prompt = buildActionPlanPrompt('sequência ideal', {
      lastGitHubSummary: 'Arquivo lido: package.json em owner/repo.',
      lastFileSnippet: '{ "name": "app" }',
      lastGitHubResultType: 'file',
      previousGitHubSummary: 'Arquivo lido: README.md em owner/repo.',
      previousFileSnippet: '# Meu Projeto',
    });
    expect(prompt).toContain('Contexto anterior:');
    expect(prompt).toContain('Arquivo lido: README.md em owner/repo.');
  });

  test('com previousFileSnippet → retorna string contendo o snippet anterior', () => {
    const prompt = buildActionPlanPrompt('roadmap', {
      lastGitHubSummary: 'Summary atual',
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
      previousGitHubSummary: 'Summary anterior',
      previousFileSnippet: 'conteúdo anterior do arquivo',
    });
    expect(prompt).toContain('Conteúdo anterior (trecho):');
    expect(prompt).toContain('conteúdo anterior do arquivo');
  });

  test('contém "Pergunta do usuário:" com a mensagem original', () => {
    const msg = 'qual seria a sequência ideal de execução?';
    const prompt = buildActionPlanPrompt(msg, {
      lastGitHubSummary: 'Contexto qualquer',
    });
    expect(prompt).toContain(`Pergunta do usuário: ${msg}`);
  });

  test('contém instrução "Não invente dados"', () => {
    const prompt = buildActionPlanPrompt('plano de ação', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt).toContain('Não invente dados');
  });

  test('contém instrução de responder em PT-BR', () => {
    const prompt = buildActionPlanPrompt('plano de ação', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt).toContain('PT-BR');
  });

  test('contém instrução sobre prioridade, impacto, esforço, risco', () => {
    const prompt = buildActionPlanPrompt('plano de ação', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt).toContain('prioridade');
    expect(prompt).toContain('impacto');
    expect(prompt).toContain('esforço');
    expect(prompt).toContain('risco');
  });

  test('lastGitHubSummary null mas lastGitHubResultType não-null → retorna prompt (não null)', () => {
    const prompt = buildActionPlanPrompt('plano de ação', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
    });
    expect(prompt).not.toBeNull();
    expect(typeof prompt).toBe('string');
  });

  test('contexto parcial → prompt contém aviso "contexto parcial"', () => {
    const prompt = buildActionPlanPrompt('plano de ação', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    });
    expect(prompt.toLowerCase()).toContain('contexto parcial');
  });
});

// ---------------------------------------------------------------------------
// 6) formatActionPlanResponse
// ---------------------------------------------------------------------------

describe('formatActionPlanResponse', () => {
  test('null → retorna ""', () => {
    expect(formatActionPlanResponse(null)).toBe('');
  });

  test('undefined → retorna ""', () => {
    expect(formatActionPlanResponse(undefined)).toBe('');
  });

  test('string vazia → retorna ""', () => {
    expect(formatActionPlanResponse('')).toBe('');
  });

  test('string com apenas espaços → retorna ""', () => {
    expect(formatActionPlanResponse('   ')).toBe('');
  });

  test('texto curto (< 80 chars) → retorna texto sem adicionar header/footer', () => {
    const short = 'Curto demais.';
    const result = formatActionPlanResponse(short);
    expect(result).toBe('Curto demais.');
    expect(result).not.toContain('## Plano de ação sugerido');
  });

  test('texto que já começa com # → preserva estrutura existente', () => {
    const input = '# Meu Plano\n\n### Etapa 1\n- item 1\n- item 2\n'.repeat(3);
    const result = formatActionPlanResponse(input);
    expect(result).toContain('# Meu Plano');
    expect(result).not.toMatch(/^## Plano de ação sugerido/);
  });

  test('texto sem header → adiciona ## Plano de ação sugerido', () => {
    const input = 'Você deve adicionar testes unitários e revisar as dependências do projeto para garantir estabilidade e qualidade.';
    const result = formatActionPlanResponse(input);
    expect(result).toContain('## Plano de ação sugerido');
  });

  test('adiciona rodapé quando não há palavras-chave de footer', () => {
    const input = 'Você deve adicionar testes unitários e revisar as dependências do projeto para garantir estabilidade e qualidade.';
    const result = formatActionPlanResponse(input);
    expect(result).toContain('*Plano baseado no contexto GitHub carregado nesta conversa.*');
  });

  test('não duplica rodapé quando o texto já contém "baseado"', () => {
    const input = 'Texto longo o suficiente para não ser curto. Este plano está baseado no repositório carregado anteriormente na conversa. Etapas detalhadas seguem abaixo para sua análise.';
    const result = formatActionPlanResponse(input);
    const occurrences = (result.match(/baseado/gi) || []).length;
    expect(occurrences).toBe(1);
  });

  test('texto com # e sem footer → adiciona rodapé', () => {
    const input = '## Plano\n\n### Etapa 1\nFazer algo importante que precisa ser feito.\n\n### Etapa 2\nFazer outra coisa igualmente importante.';
    const result = formatActionPlanResponse(input);
    expect(result).toContain('*Plano baseado no contexto GitHub carregado nesta conversa.*');
  });

  test('sanitiza token ghp_ (substituído por [REDACTED])', () => {
    const token = 'ghp_' + 'a'.repeat(36);
    const input = `Texto longo com token vazado: ${token} que não deve aparecer na resposta final do plano.`;
    const result = formatActionPlanResponse(input);
    expect(result).not.toContain(token);
    expect(result).toContain('[REDACTED]');
  });

  test('sanitiza sk- token', () => {
    const token = 'sk-' + 'a'.repeat(25);
    const input = `Texto longo com token: ${token} que não deve vazar para o usuário final.`;
    const result = formatActionPlanResponse(input);
    expect(result).not.toContain(token);
    expect(result).toContain('[REDACTED]');
  });

  test('truncamento com { maxLength: 50 } → trunca com [resposta truncada]', () => {
    const longText = 'A'.repeat(100) + ' fim do texto';
    const result = formatActionPlanResponse(longText, { maxLength: 50 });
    expect(result).toContain('[resposta truncada]');
  });

  test('texto não estruturado curto não quebra', () => {
    const result = formatActionPlanResponse('ok');
    expect(typeof result).toBe('string');
  });

  test('texto com indicador de contexto parcial → rodapé não duplica "parcial"', () => {
    const input = 'Este plano está sendo gerado com contexto parcial. Valide antes de executar as etapas descritas abaixo.';
    const result = formatActionPlanResponse(input);
    // "parcial" é uma das footerKeywords, então o rodapé NÃO deve ser adicionado
    expect(result).not.toContain('*Plano baseado no contexto GitHub carregado nesta conversa.*');
  });
});

// ---------------------------------------------------------------------------
// 7) getInsufficientActionPlanContextMessage
// ---------------------------------------------------------------------------

describe('getInsufficientActionPlanContextMessage', () => {
  test('retorna string não vazia', () => {
    const msg = getInsufficientActionPlanContextMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('contém "contexto GitHub"', () => {
    const msg = getInsufficientActionPlanContextMessage();
    expect(msg.toLowerCase()).toContain('contexto github');
  });

  test('contém exemplo de comando (package.json)', () => {
    const msg = getInsufficientActionPlanContextMessage();
    expect(msg).toContain('package.json');
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

/** Contexto rico com dados suficientes para plano de ação */
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

// ---------------------------------------------------------------------------
// 8) Integração orchestrator — action plan flow
// ---------------------------------------------------------------------------

describe('Orchestrator — action plan flow com contexto suficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
    mockSerginhoListBranches.mockClear();
    mockSerginhoGetFile.mockClear();
  });

  test('isActionPlanFollowUp=true + contexto rico → analyzeComplexity chamado (fluxo LLM ativado)', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'me dê um plano de ação',
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

  test('_skipActionPlanCheck bloqueia recursão → vai direto ao fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'me dê um plano de ação',
        context: {
          githubContext: makeRichContext(),
          _skipActionPlanCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
  });
});

describe('Orchestrator — action plan flow com contexto insuficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('isActionPlanFollowUp=true + contexto vazio → retorno imediato sem LLM', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result).toBeDefined();
    expect(result.text).toContain('Ainda não tenho contexto GitHub suficiente');
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('contexto insuficiente → _meta.insufficientContext = true', async () => {
    const result = await serginho.handleRequest({
      message: 'monte um mini roadmap',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('contexto insuficiente → _meta.actionPlanFollowUp = true', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.actionPlanFollowUp).toBe(true);
  });

  test('contexto insuficiente → resultado contém traceId', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.traceId).toBeTruthy();
  });

  test('contexto insuficiente → resultado contém orchestrationTime', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(typeof result.orchestrationTime).toBe('number');
  });

  test('contexto insuficiente → mensagem contém getInsufficientActionPlanContextMessage()', async () => {
    const result = await serginho.handleRequest({
      message: 'monte um roadmap',
      context: { githubContext: makeEmptyContext() },
    });

    const expected = getInsufficientActionPlanContextMessage();
    expect(result.text).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 9) Não-regressão — recommendation flow N9 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — recommendation flow N9', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta de recomendação pura + contexto insuficiente → recommendationFollowUp=true (sem actionPlanFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.recommendationFollowUp).toBe(true);
    expect(result._meta.actionPlanFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 10) Não-regressão — comparative flow N8 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — comparative flow N8', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta comparativa pura + contexto insuficiente → comparativeFollowUp=true (sem actionPlanFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.comparativeFollowUp).toBe(true);
    expect(result._meta.actionPlanFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 11) Não-regressão — analytical flow N6/N7 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — analytical flow N6/N7', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta analítica pura + contexto insuficiente → analyticalFollowUp=true (sem actionPlanFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
    expect(result._meta.actionPlanFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 12) Não-regressão — non-GitHub flow continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo não-GitHub', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem casual sem contexto → nenhum bloco action plan dispara', async () => {
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
      expect(result._meta.actionPlanFollowUp).toBeFalsy();
      expect(result._meta.recommendationFollowUp).toBeFalsy();
      expect(result._meta.comparativeFollowUp).toBeFalsy();
      expect(result._meta.analyticalFollowUp).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 13) Ordem de prioridade — action plan (N10) tem prioridade sobre N9
// ---------------------------------------------------------------------------

describe('Ordem de prioridade — N10 antes de N9', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('mensagem de plano de ação com contexto insuficiente → actionPlanFollowUp (não recommendationFollowUp)', async () => {
    // "plano de ação" dispara N10 (não N9)
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.actionPlanFollowUp).toBe(true);
    expect(result._meta.recommendationFollowUp).toBeFalsy();
  });
});
