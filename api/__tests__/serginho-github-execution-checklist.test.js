/**
 * api/__tests__/serginho-github-execution-checklist.test.js
 * Testes para o checklist executável de curto prazo sobre contexto GitHub carregado (N11).
 *
 * Cobre:
 *   - isExecutionChecklistFollowUp: positivos PT-BR, positivos EN, negativos
 *   - hasEnoughContextForChecklist: null, vazio, campos presentes
 *   - buildChecklistPrompt: contexto suficiente, insuficiente, com previous*
 *   - formatChecklistResponse: estrutura, cabeçalho, rodapé, truncamento, sanitização
 *   - getInsufficientChecklistContextMessage: string amigável em português
 *   - Integração no orchestrator: contexto suficiente → LLM chamado com prompt estruturado
 *   - Integração no orchestrator: contexto insuficiente → retorno imediato sem LLM
 *   - Não-regressão: recommendation N9, comparative N8, analytical N6/N7, action plan N10, non-GitHub
 *   - Prioridade N11 > N10
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários dos helpers (sem mocks de módulos)
// ---------------------------------------------------------------------------

let isExecutionChecklistFollowUp;
let hasEnoughContextForChecklist;
let buildChecklistPrompt;
let formatChecklistResponse;
let getInsufficientChecklistContextMessage;

beforeAll(async () => {
  ({
    isExecutionChecklistFollowUp,
    hasEnoughContextForChecklist,
    buildChecklistPrompt,
    formatChecklistResponse,
    getInsufficientChecklistContextMessage,
  } = await import('../lib/serginho/analysis/githubExecutionChecklist.js'));
});

// ---------------------------------------------------------------------------
// 1) isExecutionChecklistFollowUp — positivos PT-BR
// ---------------------------------------------------------------------------

describe('isExecutionChecklistFollowUp — positivos PT-BR', () => {
  test.each([
    'me dê um checklist',
    'checklist',
    'lista de tarefas',
    'quebra isso em tarefas',
    'transforma isso em passos executáveis',
    'passos executáveis',
    'itens práticos',
    'organize em checklist',
    'quais itens eu devo executar?',
    'me dê uma lista prática',
    'tarefas de curto prazo',
    'me dá um checklist',
    'lista executável',
    'itens executáveis',
    'itens acionáveis',
    'o que eu executo agora',
    'o que devo executar hoje',
    'me dê uma lista de tarefas',
    'itens de curto prazo',
  ])('"%s" → true', (msg) => {
    expect(isExecutionChecklistFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2) isExecutionChecklistFollowUp — positivos EN
// ---------------------------------------------------------------------------

describe('isExecutionChecklistFollowUp — positivos EN', () => {
  test.each([
    'what checklist would you suggest?',
    'break this into tasks',
    'turn this into actionable items',
    'task list',
    'execution checklist',
    'give me an actionable checklist',
    'practical steps',
    'short-term tasks',
    'actionable checklist',
    'break it into steps',
    'give me a task list',
    'break this down into executable tasks',
    'practical items',
    'what should I execute now?',
  ])('"%s" → true', (msg) => {
    expect(isExecutionChecklistFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3) isExecutionChecklistFollowUp — negativos (devem retornar false)
// ---------------------------------------------------------------------------

describe('isExecutionChecklistFollowUp — negativos', () => {
  test.each([
    // Novos comandos GitHub
    ['abra package.json de owner/repo', 'novo comando GitHub'],
    ['liste os repos de owner', 'novo comando GitHub'],
    ['mostre branches de owner/repo', 'novo comando GitHub'],

    // Analíticos puros (N6)
    ['o que você conclui?', 'analítico puro'],
    ['analise isso', 'analítico puro'],

    // Comparativos puros (N8)
    ['compare isso com o README', 'comparativo puro'],

    // Recomendações puras sem checklist (N9)
    ['o que melhorar primeiro?', 'recomendação pura N9'],
    ['quais são as prioridades?', 'recomendação pura N9'],

    // Planos puros sem checklist (N10)
    ['me dê um plano de ação', 'plano puro N10'],
    ['roadmap', 'roadmap puro N10'],
    ['sequência ideal', 'sequência pura N10'],

    // Casuais
    ['oi', 'casual PT'],
    ['tudo bem', 'casual PT'],
    ['hello', 'casual EN'],

    // Não relacionados
    ['', 'string vazia'],
  ])('"%s" (%s) → false', (msg) => {
    expect(isExecutionChecklistFollowUp(msg)).toBe(false);
  });

  test('com inline code → false', () => {
    expect(isExecutionChecklistFollowUp('function f() { return 1; } // me dê um checklist')).toBe(false);
  });

  test('null → false', () => {
    expect(isExecutionChecklistFollowUp(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isExecutionChecklistFollowUp(undefined)).toBe(false);
  });

  test('número (não string) → false', () => {
    expect(isExecutionChecklistFollowUp(123)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4) hasEnoughContextForChecklist
// ---------------------------------------------------------------------------

describe('hasEnoughContextForChecklist', () => {
  test('null → false', () => {
    expect(hasEnoughContextForChecklist(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(hasEnoughContextForChecklist(undefined)).toBe(false);
  });

  test('objeto vazio → false', () => {
    expect(hasEnoughContextForChecklist({})).toBe(false);
  });

  test('todos os campos relevantes null → false', () => {
    expect(hasEnoughContextForChecklist({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(false);
  });

  test('lastGitHubSummary preenchido → true', () => {
    expect(hasEnoughContextForChecklist({
      lastGitHubSummary: 'Arquivo lido: package.json',
      lastFileSnippet: null,
      lastGitHubResultType: null,
    })).toBe(true);
  });

  test('lastFileSnippet preenchido → true', () => {
    expect(hasEnoughContextForChecklist({
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "test" }',
      lastGitHubResultType: null,
    })).toBe(true);
  });

  test('lastGitHubResultType preenchido → true', () => {
    expect(hasEnoughContextForChecklist({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    })).toBe(true);
  });

  test('dois campos preenchidos → true', () => {
    expect(hasEnoughContextForChecklist({
      lastGitHubSummary: 'Repositórios: owner/repo',
      lastFileSnippet: '{ "name": "test" }',
      lastGitHubResultType: null,
    })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5) buildChecklistPrompt
// ---------------------------------------------------------------------------

describe('buildChecklistPrompt', () => {
  test('contexto null → retorna null', () => {
    expect(buildChecklistPrompt('me dê um checklist', null)).toBeNull();
  });

  test('contexto vazio → retorna null', () => {
    expect(buildChecklistPrompt('me dê um checklist', {})).toBeNull();
  });

  test('com lastGitHubSummary → retorna string contendo o summary', () => {
    const prompt = buildChecklistPrompt('me dê um checklist', {
      lastGitHubSummary: 'Arquivo lido: package.json em owner/repo.',
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    });
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('Arquivo lido: package.json em owner/repo.');
  });

  test('com lastFileSnippet → retorna string contendo o snippet', () => {
    const prompt = buildChecklistPrompt('lista de tarefas', {
      lastGitHubSummary: null,
      lastFileSnippet: '{ "name": "myapp" }',
      lastGitHubResultType: 'file',
    });
    expect(prompt).toContain('{ "name": "myapp" }');
    expect(prompt).toContain('Conteúdo do arquivo (trecho):');
  });

  test('com previousGitHubSummary → retorna string contendo "Contexto anterior"', () => {
    const prompt = buildChecklistPrompt('checklist', {
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
    const prompt = buildChecklistPrompt('checklist executável', {
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
    const msg = 'quais itens devo executar primeiro?';
    const prompt = buildChecklistPrompt(msg, {
      lastGitHubSummary: 'Contexto qualquer',
    });
    expect(prompt).toContain(`Pergunta do usuário: ${msg}`);
  });

  test('contém "checklist executável" nas instruções', () => {
    const prompt = buildChecklistPrompt('checklist', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt.toLowerCase()).toContain('checklist executável');
  });

  test('contém instrução "Não invente dados"', () => {
    const prompt = buildChecklistPrompt('lista de tarefas', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt).toContain('Não invente dados');
  });

  test('contém instrução de responder em PT-BR', () => {
    const prompt = buildChecklistPrompt('checklist', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt).toContain('PT-BR');
  });

  test('contém instrução sobre prioridade e critério de conclusão', () => {
    const prompt = buildChecklistPrompt('checklist', {
      lastGitHubSummary: 'Contexto',
    });
    expect(prompt).toContain('prioridade');
    expect(prompt).toContain('critério de conclusão');
  });

  test('lastGitHubSummary null mas lastGitHubResultType não-null → retorna prompt (não null)', () => {
    const prompt = buildChecklistPrompt('checklist', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
    });
    expect(prompt).not.toBeNull();
    expect(typeof prompt).toBe('string');
  });

  test('contexto parcial → prompt contém aviso "contexto parcial"', () => {
    const prompt = buildChecklistPrompt('checklist', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    });
    expect(prompt.toLowerCase()).toContain('contexto parcial');
  });
});

// ---------------------------------------------------------------------------
// 6) formatChecklistResponse
// ---------------------------------------------------------------------------

describe('formatChecklistResponse', () => {
  test('null → retorna ""', () => {
    expect(formatChecklistResponse(null)).toBe('');
  });

  test('undefined → retorna ""', () => {
    expect(formatChecklistResponse(undefined)).toBe('');
  });

  test('string vazia → retorna ""', () => {
    expect(formatChecklistResponse('')).toBe('');
  });

  test('string com apenas espaços → retorna ""', () => {
    expect(formatChecklistResponse('   ')).toBe('');
  });

  test('texto curto (< 80 chars) → retorna texto sem adicionar header/footer', () => {
    const short = 'Curto demais.';
    const result = formatChecklistResponse(short);
    expect(result).toBe('Curto demais.');
    expect(result).not.toContain('## Checklist sugerido');
  });

  test('texto que já começa com # → preserva estrutura existente', () => {
    const input = '# Meu Checklist\n\n### Item 1\n- tarefa 1\n- tarefa 2\n'.repeat(3);
    const result = formatChecklistResponse(input);
    expect(result).toContain('# Meu Checklist');
    expect(result).not.toMatch(/^## Checklist sugerido/);
  });

  test('texto sem header → adiciona ## Checklist sugerido', () => {
    const input = 'Você deve adicionar testes unitários e revisar as dependências do projeto para garantir estabilidade e qualidade do código.';
    const result = formatChecklistResponse(input);
    expect(result).toContain('## Checklist sugerido');
  });

  test('adiciona rodapé quando não há palavras-chave de footer', () => {
    const input = 'Você deve adicionar testes unitários e revisar as dependências do projeto para garantir estabilidade e qualidade do código.';
    const result = formatChecklistResponse(input);
    expect(result).toContain('*Checklist baseado no contexto GitHub carregado nesta conversa.*');
  });

  test('não duplica rodapé quando o texto já contém "baseado"', () => {
    const input = 'Este checklist está baseado no repositório carregado anteriormente na conversa. Os itens foram extraídos do contexto disponível e devem ser revisados antes da execução.';
    const result = formatChecklistResponse(input);
    const occurrences = (result.match(/baseado/gi) || []).length;
    expect(occurrences).toBe(1);
  });

  test('texto com # e sem footer → adiciona rodapé', () => {
    const input = '## Checklist\n\n### Item 1\nFazer algo importante que precisa ser feito.\n\n### Item 2\nFazer outra coisa igualmente importante.';
    const result = formatChecklistResponse(input);
    expect(result).toContain('*Checklist baseado no contexto GitHub carregado nesta conversa.*');
  });

  test('sanitiza token ghp_ (substituído por [REDACTED])', () => {
    const token = 'ghp_' + 'a'.repeat(36);
    const input = `Texto longo com token vazado: ${token} que não deve aparecer na resposta final do checklist executável.`;
    const result = formatChecklistResponse(input);
    expect(result).not.toContain(token);
    expect(result).toContain('[REDACTED]');
  });

  test('sanitiza sk- token', () => {
    const token = 'sk-' + 'a'.repeat(25);
    const input = `Texto longo com token: ${token} que não deve vazar para o usuário final desta resposta.`;
    const result = formatChecklistResponse(input);
    expect(result).not.toContain(token);
    expect(result).toContain('[REDACTED]');
  });

  test('truncamento com { maxLength: 50 } → trunca com [resposta truncada]', () => {
    const longText = 'A'.repeat(100) + ' fim do texto';
    const result = formatChecklistResponse(longText, { maxLength: 50 });
    expect(result).toContain('[resposta truncada]');
  });

  test('texto não estruturado curto não quebra', () => {
    const result = formatChecklistResponse('ok');
    expect(typeof result).toBe('string');
  });

  test('texto com indicador de contexto parcial → rodapé não duplica "parcial"', () => {
    const input = 'Este checklist está sendo gerado com contexto parcial. Valide antes de executar os itens descritos abaixo.';
    const result = formatChecklistResponse(input);
    // "parcial" é uma das footerKeywords, então o rodapé NÃO deve ser adicionado
    expect(result).not.toContain('*Checklist baseado no contexto GitHub carregado nesta conversa.*');
  });
});

// ---------------------------------------------------------------------------
// 7) getInsufficientChecklistContextMessage
// ---------------------------------------------------------------------------

describe('getInsufficientChecklistContextMessage', () => {
  test('retorna string não vazia', () => {
    const msg = getInsufficientChecklistContextMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('contém "checklist"', () => {
    const msg = getInsufficientChecklistContextMessage();
    expect(msg.toLowerCase()).toContain('checklist');
  });

  test('contém exemplo de comando (package.json)', () => {
    const msg = getInsufficientChecklistContextMessage();
    expect(msg).toContain('package.json');
  });

  test('retorna mensagem em português', () => {
    const msg = getInsufficientChecklistContextMessage();
    expect(msg).toContain('contexto GitHub');
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

/** Contexto rico com dados suficientes para checklist */
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
// 8) Integração orchestrator — checklist flow com contexto suficiente
// ---------------------------------------------------------------------------

describe('Orchestrator — checklist flow com contexto suficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
    mockSerginhoListBranches.mockClear();
    mockSerginhoGetFile.mockClear();
  });

  test('isExecutionChecklistFollowUp=true + contexto rico → analyzeComplexity chamado (fluxo LLM ativado)', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'me dê um checklist',
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

  test('_skipExecutionChecklistCheck bloqueia recursão → vai direto ao fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'me dê um checklist',
        context: {
          githubContext: makeRichContext(),
          _skipExecutionChecklistCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9) Integração orchestrator — checklist flow com contexto insuficiente
// ---------------------------------------------------------------------------

describe('Orchestrator — checklist flow com contexto insuficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('isExecutionChecklistFollowUp=true + contexto vazio → retorno imediato sem LLM', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result).toBeDefined();
    expect(result.text).toContain('Ainda não tenho contexto GitHub suficiente');
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('contexto insuficiente → _meta.insufficientContext = true', async () => {
    const result = await serginho.handleRequest({
      message: 'lista de tarefas',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('contexto insuficiente → _meta.executionChecklistFollowUp = true', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.executionChecklistFollowUp).toBe(true);
  });

  test('contexto insuficiente → resultado contém traceId', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.traceId).toBeTruthy();
  });

  test('contexto insuficiente → resultado contém orchestrationTime', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(typeof result.orchestrationTime).toBe('number');
  });

  test('contexto insuficiente → mensagem contém getInsufficientChecklistContextMessage()', async () => {
    const result = await serginho.handleRequest({
      message: 'checklist',
      context: { githubContext: makeEmptyContext() },
    });

    const expected = getInsufficientChecklistContextMessage();
    expect(result.text).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 10) Não-regressão — action plan flow N10 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — action plan flow N10', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta de plano de ação pura + contexto insuficiente → actionPlanFollowUp=true (sem executionChecklistFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.actionPlanFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });

  test('roadmap puro + contexto insuficiente → actionPlanFollowUp=true', async () => {
    const result = await serginho.handleRequest({
      message: 'sequência ideal',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.actionPlanFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 11) Não-regressão — recommendation flow N9 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — recommendation flow N9', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta de recomendação pura + contexto insuficiente → recommendationFollowUp=true (sem executionChecklistFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.recommendationFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 12) Não-regressão — comparative flow N8 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — comparative flow N8', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta comparativa pura + contexto insuficiente → comparativeFollowUp=true (sem executionChecklistFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.comparativeFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 13) Não-regressão — analytical flow N6/N7 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — analytical flow N6/N7', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta analítica pura + contexto insuficiente → analyticalFollowUp=true (sem executionChecklistFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 14) Não-regressão — fluxo não-GitHub continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo não-GitHub', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem casual sem contexto → nenhum bloco checklist dispara', async () => {
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
      expect(result._meta.executionChecklistFollowUp).toBeFalsy();
      expect(result._meta.actionPlanFollowUp).toBeFalsy();
      expect(result._meta.recommendationFollowUp).toBeFalsy();
      expect(result._meta.comparativeFollowUp).toBeFalsy();
      expect(result._meta.analyticalFollowUp).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 15) Prioridade N11 > N10 — checklist tem prioridade sobre action plan
// ---------------------------------------------------------------------------

describe('Ordem de prioridade — N11 antes de N10', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('mensagem de checklist com contexto insuficiente → executionChecklistFollowUp (não actionPlanFollowUp)', async () => {
    // "checklist" dispara N11 (não N10)
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.executionChecklistFollowUp).toBe(true);
    expect(result._meta.actionPlanFollowUp).toBeFalsy();
  });

  test('isExecutionChecklistFollowUp não interfere nos padrões N10 puros', async () => {
    // "plano de ação" é N10 puro — não deve ativar N11
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.actionPlanFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });
});
