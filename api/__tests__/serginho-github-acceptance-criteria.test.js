/**
 * api/__tests__/serginho-github-acceptance-criteria.test.js
 * Testes para critérios de aceite/validação sobre contexto GitHub carregado (N12).
 *
 * Cobre:
 *   - isAcceptanceCriteriaFollowUp: positivos PT-BR, positivos EN, negativos
 *   - hasEnoughContextForAcceptanceCriteria: null, vazio, campos presentes
 *   - buildAcceptanceCriteriaPrompt: contexto suficiente, insuficiente, com previous*
 *   - formatAcceptanceCriteriaResponse: estrutura, cabeçalho, rodapé, truncamento, sanitização
 *   - getInsufficientAcceptanceCriteriaContextMessage: string amigável em português
 *   - Integração no orchestrator: contexto suficiente → LLM chamado com prompt estruturado
 *   - Integração no orchestrator: contexto insuficiente → retorno imediato sem LLM
 *   - Não-regressão: N11, N10, N9, N8, N6/N7, non-GitHub
 *   - Prioridade N12 > N11
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários dos helpers (sem mocks de módulos)
// ---------------------------------------------------------------------------

let isAcceptanceCriteriaFollowUp;
let hasEnoughContextForAcceptanceCriteria;
let buildAcceptanceCriteriaPrompt;
let formatAcceptanceCriteriaResponse;
let getInsufficientAcceptanceCriteriaContextMessage;

beforeAll(async () => {
  ({
    isAcceptanceCriteriaFollowUp,
    hasEnoughContextForAcceptanceCriteria,
    buildAcceptanceCriteriaPrompt,
    formatAcceptanceCriteriaResponse,
    getInsufficientAcceptanceCriteriaContextMessage,
  } = await import('../lib/serginho/analysis/githubAcceptanceCriteria.js'));
});

// ---------------------------------------------------------------------------
// 1) isAcceptanceCriteriaFollowUp — positivos PT-BR
// ---------------------------------------------------------------------------

describe('isAcceptanceCriteriaFollowUp — positivos PT-BR', () => {
  test.each([
    'critérios de aceite',
    'critério de aceite',
    'critérios de aceitação',
    'critérios de validação',
    'critério de conclusão',
    'critérios de conclusão',
    'como eu valido isso?',
    'como posso validar a solução?',
    'como saber se está pronto?',
    'como saber quando está concluído?',
    'definição de pronto',
    'definição de done',
    'quando posso considerar isso pronto?',
    'quando podemos considerar a tarefa concluída?',
    'precondições de aceite',
    'evidência de validação',
    'evidências de aceite',
    'condição de pronto',
    'condições de aceite',
    'risco de não validar',
    'o que precisa ser verdadeiro para considerar?',
    'o que precisa estar feito para marcar?',
  ])('"%s" → true', (msg) => {
    expect(isAcceptanceCriteriaFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2) isAcceptanceCriteriaFollowUp — positivos EN
// ---------------------------------------------------------------------------

describe('isAcceptanceCriteriaFollowUp — positivos EN', () => {
  test.each([
    'acceptance criteria',
    'what is the acceptance criteria?',
    'validation criteria',
    'definition of done',
    'how do I validate this?',
    'how do we validate the solution?',
    'how to validate the result?',
    'how do I know this is done?',
    'how do we know the task is done?',
    'how can I know it is complete?',
    'what needs to be true to consider this done?',
    'when can I consider this complete?',
    'completion criteria',
    'done criteria',
    'expected evidence',
    'preconditions for acceptance',
    'preconditions of completion',
    'risks of not validating',
    'risk if skipping validation',
    'what is the exit criteria',
    'what is the ready criteria',
    'ready condition',
  ])('"%s" → true', (msg) => {
    expect(isAcceptanceCriteriaFollowUp(msg)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3) isAcceptanceCriteriaFollowUp — negativos (devem retornar false)
// ---------------------------------------------------------------------------

describe('isAcceptanceCriteriaFollowUp — negativos', () => {
  test.each([
    // Nulos/vazios
    [null, 'null'],
    [undefined, 'undefined'],
    ['', 'string vazia'],

    // Casuais
    ['oi', 'casual PT'],
    ['olá', 'casual PT'],
    ['tudo bem', 'casual PT'],
    ['hello', 'casual EN'],
    ['hi', 'casual EN'],

    // Novos comandos GitHub
    ['abra o package.json de owner/repo', 'novo comando GitHub'],
    ['liste repos de owner', 'novo comando GitHub'],
    ['mostre branches de owner/repo', 'novo comando GitHub'],
    ['busque o arquivo de owner/repo', 'novo comando GitHub'],

    // Analíticos puros
    ['o que você conclui?', 'analítico puro'],
    ['analise isso', 'analítico puro'],

    // Comparação pura
    ['compare isso com o README', 'comparação pura'],
    ['compare os dois', 'comparação pura'],

    // Recomendações puras
    ['o que melhorar primeiro?', 'recomendação pura'],
    ['quais são os próximos passos?', 'recomendação pura'],

    // Plano puro
    ['me dê um plano de ação', 'plano puro N10'],
    ['roadmap', 'plano puro N10'],

    // Checklist puro
    ['me dê um checklist', 'checklist puro N11'],
    ['lista de tarefas', 'checklist puro N11'],
  ])('"%s" (%s) → false', (msg) => {
    expect(isAcceptanceCriteriaFollowUp(msg)).toBe(false);
  });

  test('com inline code → false', () => {
    expect(isAcceptanceCriteriaFollowUp('function f() { return 1; } // critérios de aceite')).toBe(false);
  });

  test('null → false', () => {
    expect(isAcceptanceCriteriaFollowUp(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isAcceptanceCriteriaFollowUp(undefined)).toBe(false);
  });

  test('número (não string) → false', () => {
    expect(isAcceptanceCriteriaFollowUp(123)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4) hasEnoughContextForAcceptanceCriteria
// ---------------------------------------------------------------------------

describe('hasEnoughContextForAcceptanceCriteria', () => {
  test('null → false', () => {
    expect(hasEnoughContextForAcceptanceCriteria(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(hasEnoughContextForAcceptanceCriteria(undefined)).toBe(false);
  });

  test('{} → false', () => {
    expect(hasEnoughContextForAcceptanceCriteria({})).toBe(false);
  });

  test('contexto vazio (todos null) → false', () => {
    expect(hasEnoughContextForAcceptanceCriteria({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
      previousGitHubSummary: null,
      previousFileSnippet: null,
    })).toBe(false);
  });

  test('com lastGitHubSummary → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({ lastGitHubSummary: 'resumo' })).toBe(true);
  });

  test('com lastFileSnippet → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({ lastFileSnippet: 'conteudo' })).toBe(true);
  });

  test('com lastGitHubResultType → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({ lastGitHubResultType: 'file' })).toBe(true);
  });

  test('com previousGitHubSummary → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({ previousGitHubSummary: 'anterior' })).toBe(true);
  });

  test('com previousFileSnippet → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({ previousFileSnippet: 'trecho anterior' })).toBe(true);
  });

  test('com combinação de campos → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({
      lastGitHubSummary: 'resumo',
      lastFileSnippet: 'conteudo',
      lastGitHubResultType: 'file',
    })).toBe(true);
  });

  test('apenas contexto anterior → true', () => {
    expect(hasEnoughContextForAcceptanceCriteria({
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
      previousGitHubSummary: 'anterior',
      previousFileSnippet: null,
    })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5) buildAcceptanceCriteriaPrompt
// ---------------------------------------------------------------------------

describe('buildAcceptanceCriteriaPrompt', () => {
  test('contexto insuficiente → retorna null', () => {
    const result = buildAcceptanceCriteriaPrompt('critérios de aceite', null);
    expect(result).toBeNull();
  });

  test('contexto vazio → retorna null', () => {
    const result = buildAcceptanceCriteriaPrompt('critérios de aceite', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: null,
      previousGitHubSummary: null,
      previousFileSnippet: null,
    });
    expect(result).toBeNull();
  });

  test('contexto com lastGitHubSummary → contém marcador de contexto', () => {
    const result = buildAcceptanceCriteriaPrompt('critérios de aceite', {
      lastGitHubSummary: 'Arquivo lido: package.json',
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    });
    expect(result).toContain('[Contexto GitHub para critérios de aceite]');
  });

  test('inclui lastGitHubSummary quando presente', () => {
    const result = buildAcceptanceCriteriaPrompt('como validar?', {
      lastGitHubSummary: 'Repositório kizirianmax/rkmmax-hibrido',
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
    });
    expect(result).toContain('Repositório kizirianmax/rkmmax-hibrido');
  });

  test('inclui lastFileSnippet quando presente', () => {
    const result = buildAcceptanceCriteriaPrompt('evidência de conclusão', {
      lastGitHubSummary: null,
      lastFileSnippet: '{ "version": "3.0.0" }',
      lastGitHubResultType: 'file',
    });
    expect(result).toContain('Conteúdo do arquivo (trecho):');
    expect(result).toContain('{ "version": "3.0.0" }');
  });

  test('inclui contexto anterior quando disponível', () => {
    const result = buildAcceptanceCriteriaPrompt('definição de pronto', {
      lastGitHubSummary: 'Atual',
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
      previousGitHubSummary: 'Anterior',
      previousFileSnippet: null,
    });
    expect(result).toContain('Contexto anterior:');
    expect(result).toContain('Anterior');
  });

  test('inclui instrução sobre Condição de pronto', () => {
    const result = buildAcceptanceCriteriaPrompt('critérios de aceite', {
      lastGitHubSummary: 'resumo',
      lastGitHubResultType: 'file',
    });
    expect(result).toContain('Condição de pronto');
  });

  test('inclui instrução sobre Evidência esperada', () => {
    const result = buildAcceptanceCriteriaPrompt('como validar?', {
      lastGitHubSummary: 'resumo',
      lastGitHubResultType: 'file',
    });
    expect(result).toContain('Evidência esperada');
  });

  test('inclui instrução sobre Risco se não validar', () => {
    const result = buildAcceptanceCriteriaPrompt('definition of done', {
      lastGitHubSummary: 'resumo',
      lastGitHubResultType: 'file',
    });
    expect(result).toContain('Risco se não validar');
  });

  test('inclui indicador de contexto parcial quando lastGitHubSummary e lastFileSnippet são null', () => {
    const result = buildAcceptanceCriteriaPrompt('critérios de aceite', {
      lastGitHubSummary: null,
      lastFileSnippet: null,
      lastGitHubResultType: 'repos',
    });
    expect(result).toContain('ATENÇÃO');
    expect(result).toContain('contexto parcial');
  });

  test('sem indicador de contexto parcial quando lastGitHubSummary está presente', () => {
    const result = buildAcceptanceCriteriaPrompt('critérios de aceite', {
      lastGitHubSummary: 'resumo completo',
      lastFileSnippet: null,
      lastGitHubResultType: 'file',
    });
    expect(result).not.toContain('contexto parcial');
  });

  test('inclui "Pergunta do usuário:" com a mensagem original', () => {
    const result = buildAcceptanceCriteriaPrompt('como eu sei que está pronto?', {
      lastGitHubSummary: 'resumo',
      lastGitHubResultType: 'file',
    });
    expect(result).toContain('Pergunta do usuário: como eu sei que está pronto?');
  });
});

// ---------------------------------------------------------------------------
// 6) formatAcceptanceCriteriaResponse
// ---------------------------------------------------------------------------

describe('formatAcceptanceCriteriaResponse', () => {
  test('texto vazio → retorna ""', () => {
    expect(formatAcceptanceCriteriaResponse('')).toBe('');
  });

  test('null → retorna ""', () => {
    expect(formatAcceptanceCriteriaResponse(null)).toBe('');
  });

  test('undefined → retorna ""', () => {
    expect(formatAcceptanceCriteriaResponse(undefined)).toBe('');
  });

  test('texto curto (< 80 chars) → retorna quase intacto', () => {
    const short = 'Critério: funciona.';
    const result = formatAcceptanceCriteriaResponse(short);
    expect(result).toBe(short);
  });

  test('texto sem header → adiciona "## Critérios de aceite sugeridos"', () => {
    const longText = 'Este é um critério de aceite. '.repeat(5);
    const result = formatAcceptanceCriteriaResponse(longText);
    expect(result).toContain('## Critérios de aceite sugeridos');
  });

  test('texto com "#" → preserva header, não duplica', () => {
    const withHeader = '## Meu cabeçalho\n\nCritério 1: funciona corretamente quando invocado com os dados corretos.';
    const result = formatAcceptanceCriteriaResponse(withHeader);
    expect(result).toContain('## Meu cabeçalho');
    expect(result).not.toContain('## Critérios de aceite sugeridos');
  });

  test('adiciona footer quando não presente', () => {
    const text = 'Critério de aceite para o item. '.repeat(5);
    const result = formatAcceptanceCriteriaResponse(text);
    expect(result).toContain('*Critérios baseados no contexto GitHub carregado nesta conversa.*');
  });

  test('não duplica footer quando já presente (keyword "baseado")', () => {
    const textWithFooter = 'Critérios baseados no contexto GitHub carregado nesta conversa. '.repeat(3);
    const result = formatAcceptanceCriteriaResponse(textWithFooter);
    const count = (result.match(/baseado/gi) || []).length;
    expect(count).toBeGreaterThanOrEqual(1);
    // Não deve adicionar o footer padrão novamente
    expect(result).not.toContain('---\n*Critérios baseados');
  });

  test('não duplica footer quando keyword "critérios baseados" presente', () => {
    const textWithFooter = 'critérios baseados no contexto disponível. '.repeat(3);
    const result = formatAcceptanceCriteriaResponse(textWithFooter);
    expect(result).not.toContain('---\n*Critérios baseados');
  });

  test('sanitiza token sk-...', () => {
    const text = 'Token: sk-abcdefghijklmnopqrstuvwxyz123456. Critério válido quando autenticado. '.repeat(3);
    const result = formatAcceptanceCriteriaResponse(text);
    expect(result).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(result).toContain('[REDACTED]');
  });

  test('sanitiza token ghp_...', () => {
    const token = 'ghp_' + 'a'.repeat(36);
    const text = `Token: ${token}. Critério válido quando autenticado com GitHub. `.repeat(3);
    const result = formatAcceptanceCriteriaResponse(text);
    expect(result).not.toContain(token);
    expect(result).toContain('[REDACTED]');
  });

  test('sanitiza token Bearer ...', () => {
    const text = 'Authorization: Bearer minhachavesupersecreta. Critério válido. '.repeat(3);
    const result = formatAcceptanceCriteriaResponse(text);
    expect(result).not.toContain('Bearer minhachavesupersecreta');
    expect(result).toContain('[REDACTED]');
  });

  test('trunca com "[resposta truncada]" quando options.maxLength fornecido', () => {
    const longText = 'A'.repeat(100) + ' fim do texto';
    const result = formatAcceptanceCriteriaResponse(longText, { maxLength: 50 });
    expect(result).toContain('[resposta truncada]');
  });

  test('fallback seguro para texto não estruturado', () => {
    const result = formatAcceptanceCriteriaResponse('ok');
    expect(typeof result).toBe('string');
  });

  test('texto com indicador de contexto parcial → rodapé não duplica "parcial"', () => {
    const input = 'Este critério está sendo gerado com contexto parcial. Valide antes de aplicar os critérios descritos abaixo.';
    const result = formatAcceptanceCriteriaResponse(input);
    // "parcial" é uma das footerKeywords, então o rodapé NÃO deve ser adicionado
    expect(result).not.toContain('*Critérios baseados no contexto GitHub carregado nesta conversa.*');
  });
});

// ---------------------------------------------------------------------------
// 7) getInsufficientAcceptanceCriteriaContextMessage
// ---------------------------------------------------------------------------

describe('getInsufficientAcceptanceCriteriaContextMessage', () => {
  test('retorna string não vazia', () => {
    const msg = getInsufficientAcceptanceCriteriaContextMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('contém "critérios de aceite"', () => {
    const msg = getInsufficientAcceptanceCriteriaContextMessage();
    expect(msg.toLowerCase()).toContain('critérios de aceite');
  });

  test('contém exemplo de comando (package.json)', () => {
    const msg = getInsufficientAcceptanceCriteriaContextMessage();
    expect(msg).toContain('package.json');
  });

  test('retorna mensagem em português', () => {
    const msg = getInsufficientAcceptanceCriteriaContextMessage();
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

/** Contexto rico com dados suficientes para critérios de aceite */
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
// 8) Integração orchestrator — acceptance criteria flow com contexto suficiente
// ---------------------------------------------------------------------------

describe('Orchestrator — acceptance criteria flow com contexto suficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
    mockSerginhoListBranches.mockClear();
    mockSerginhoGetFile.mockClear();
  });

  test('isAcceptanceCriteriaFollowUp=true + contexto rico → analyzeComplexity chamado (fluxo LLM ativado)', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'critérios de aceite',
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

  test('_skipAcceptanceCriteriaCheck bloqueia recursão → vai direto ao fluxo LLM', async () => {
    let analysisCalled = false;
    mockAnalyzeComplexity.mockImplementation(() => {
      analysisCalled = true;
      return { scores: { complexity: 0.5 } };
    });
    mockGetEnabledProviders.mockReturnValue(['groq']);

    try {
      await serginho.handleRequest({
        message: 'critérios de aceite',
        context: {
          githubContext: makeRichContext(),
          _skipAcceptanceCriteriaCheck: true,
        },
      });
    } catch {
      // sem provider real
    }

    expect(analysisCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9) Integração orchestrator — acceptance criteria flow com contexto insuficiente
// ---------------------------------------------------------------------------

describe('Orchestrator — acceptance criteria flow com contexto insuficiente', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('isAcceptanceCriteriaFollowUp=true + contexto vazio → retorno imediato sem LLM', async () => {
    const result = await serginho.handleRequest({
      message: 'critérios de aceite',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result).toBeDefined();
    expect(result.text).toContain('Ainda não tenho contexto GitHub suficiente');
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('contexto insuficiente → _meta.insufficientContext = true', async () => {
    const result = await serginho.handleRequest({
      message: 'definição de pronto',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.insufficientContext).toBe(true);
  });

  test('contexto insuficiente → _meta.acceptanceCriteriaFollowUp = true', async () => {
    const result = await serginho.handleRequest({
      message: 'acceptance criteria',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.acceptanceCriteriaFollowUp).toBe(true);
  });

  test('contexto insuficiente → resultado contém traceId', async () => {
    const result = await serginho.handleRequest({
      message: 'critérios de validação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result.traceId).toBeTruthy();
  });

  test('contexto insuficiente → resultado contém orchestrationTime', async () => {
    const result = await serginho.handleRequest({
      message: 'definition of done',
      context: { githubContext: makeEmptyContext() },
    });

    expect(typeof result.orchestrationTime).toBe('number');
  });

  test('contexto insuficiente → mensagem contém getInsufficientAcceptanceCriteriaContextMessage()', async () => {
    const result = await serginho.handleRequest({
      message: 'critérios de aceite',
      context: { githubContext: makeEmptyContext() },
    });

    const expected = getInsufficientAcceptanceCriteriaContextMessage();
    expect(result.text).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 10) Não-regressão — execution checklist flow N11 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — execution checklist flow N11', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta de checklist pura + contexto insuficiente → executionChecklistFollowUp=true (sem acceptanceCriteriaFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.executionChecklistFollowUp).toBe(true);
    expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 11) Não-regressão — action plan flow N10 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — action plan flow N10', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta de plano de ação pura + contexto insuficiente → actionPlanFollowUp=true (sem acceptanceCriteriaFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'me dê um plano de ação',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.actionPlanFollowUp).toBe(true);
    expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 12) Não-regressão — recommendation flow N9 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — recommendation flow N9', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta de recomendação pura + contexto insuficiente → recommendationFollowUp=true (sem acceptanceCriteriaFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'quais são os próximos passos?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.recommendationFollowUp).toBe(true);
    expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 13) Não-regressão — comparative flow N8 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — comparative flow N8', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta comparativa pura + contexto insuficiente → comparativeFollowUp=true (sem acceptanceCriteriaFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'compare os dois',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.comparativeFollowUp).toBe(true);
    expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 14) Não-regressão — analytical flow N6/N7 continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — analytical flow N6/N7', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('pergunta analítica pura + contexto insuficiente → analyticalFollowUp=true (sem acceptanceCriteriaFollowUp)', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
    expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 15) Não-regressão — fluxo não-GitHub continua intacto
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo não-GitHub', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem casual sem contexto → nenhum bloco acceptance criteria dispara', async () => {
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
      expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
      expect(result._meta.executionChecklistFollowUp).toBeFalsy();
      expect(result._meta.actionPlanFollowUp).toBeFalsy();
      expect(result._meta.recommendationFollowUp).toBeFalsy();
      expect(result._meta.comparativeFollowUp).toBeFalsy();
      expect(result._meta.analyticalFollowUp).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 16) Prioridade N12 > N11 — acceptance criteria tem prioridade sobre checklist
// ---------------------------------------------------------------------------

describe('Ordem de prioridade — N12 antes de N11', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
  });

  test('mensagem de critérios de aceite com contexto insuficiente → acceptanceCriteriaFollowUp (não executionChecklistFollowUp)', async () => {
    // "critérios de aceite" dispara N12 (não N11)
    const result = await serginho.handleRequest({
      message: 'critérios de aceite',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.acceptanceCriteriaFollowUp).toBe(true);
    expect(result._meta.executionChecklistFollowUp).toBeFalsy();
  });

  test('isAcceptanceCriteriaFollowUp não interfere nos padrões N11 puros', async () => {
    // "me dê um checklist" é N11 puro — não deve ativar N12
    const result = await serginho.handleRequest({
      message: 'me dê um checklist',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.executionChecklistFollowUp).toBe(true);
    expect(result._meta.acceptanceCriteriaFollowUp).toBeFalsy();
  });
});
