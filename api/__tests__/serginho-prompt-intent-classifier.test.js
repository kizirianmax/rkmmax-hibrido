/**
 * api/__tests__/serginho-prompt-intent-classifier.test.js
 * Testes para o classificador de intenção de prompt do Serginho.
 *
 * Valida:
 *   - Intenção 'conceptual' não retorna fallback GitHub
 *   - Intenção 'repo_analysis' roteia corretamente (GitHub chain ativo)
 *   - Intenção 'mixed' não trava no fallback genérico
 *   - Classificação unitária dos três casos + edge cases
 */

import { classifyPromptIntent } from '../lib/serginho/intent/promptIntentClassifier.js';
import { createMockFetch } from '../lib/test-helpers/mockFetch.js';

process.env.GROQ_API_KEY = 'test-groq-key';

let serginho;

beforeAll(async () => {
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

beforeEach(() => {
  serginho.resetMetrics();
  serginho.clearCache();
  global.fetch = createMockFetch();
});

// ---------------------------------------------------------------------------
// classifyPromptIntent — unit tests
// ---------------------------------------------------------------------------

describe('classifyPromptIntent', () => {
  // --- conceptual ---
  describe('intent: conceptual', () => {
    const conceptualCases = [
      'Explique conceitualmente a diferença entre um orquestrador e um especialista',
      'teoricamente, como funciona um sistema de IA em camadas?',
      'em teoria, qual é a diferença entre LLM e RAG?',
      'de forma abstrata, o que é um construtor num sistema de agentes?',
      'Explain conceptually the difference between an orchestrator and a specialist',
      'theoretically, how does a multi-agent system work?',
      'Sem usar GitHub, sem pedir arquivos, explique a diferença entre orquestrador e especialista',
      'sem pedir arquivos, o que é RAG?',
      'sem depender de contexto, explique o padrão de arquitetura hexagonal',
      'Without using GitHub, explain the difference between an LLM and a RAG system',
      'explique a diferença entre orquestrador e especialista em sistemas de IA',
      'o que é um orquestrador de IA?',
      'what is a multi-agent orchestration system?',
      // Pedidos de geração de código — NÃO devem ser roteados para o fluxo GitHub
      'Crie um script Node.js que leia um arquivo JSON local, agrupe os itens por categoria e imprima um resumo no console. Entregue no formato de artefato de código, com arquivo principal e README.md',
      'Gere uma função TypeScript que valide um schema JSON e retorne um relatório de erros',
      'Escreva um componente React que exiba uma lista de itens com paginação',
      'create a Python script that reads a CSV file and outputs a summary report',
      'write a Node.js server with Express that handles REST API requests',
      'build a JavaScript function that parses markdown and returns HTML',
    ];

    test.each(conceptualCases)('returns conceptual for: %s', (message) => {
      const result = classifyPromptIntent(message);
      expect(result.intent).toBe('conceptual');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  // --- repo_analysis ---
  describe('intent: repo_analysis', () => {
    const repoCases = [
      'Analise o package.json do repositório facebook/react',
      'liste as branches do repo owner/repo',
      'mostre o conteúdo do arquivo src/index.js',
      'abra o README.md de owner/repo',
      'quais dependências tem o package.json?',
      'analise o conteúdo desse arquivo .ts',
      'oi, tudo bem?',
      'ajuda com uma dúvida',
    ];

    test.each(repoCases)('returns repo_analysis for: %s', (message) => {
      const result = classifyPromptIntent(message);
      expect(result.intent).toBe('repo_analysis');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  // --- mixed ---
  describe('intent: mixed', () => {
    const mixedCases = [
      'explique a diferença entre DDD e Clean Architecture e mostre como está implementado no facebook/react',
      'conceitualmente, o que é injeção de dependência? E como está no package.json desse projeto?',
      'teoricamente, qual é o papel de um orquestrador? E como funciona no src/index.js?',
    ];

    test.each(mixedCases)('returns mixed for: %s', (message) => {
      const result = classifyPromptIntent(message);
      expect(result.intent).toBe('mixed');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  // --- edge cases ---
  describe('edge cases', () => {
    test('returns repo_analysis for empty string', () => {
      expect(classifyPromptIntent('').intent).toBe('repo_analysis');
    });

    test('returns repo_analysis for null', () => {
      expect(classifyPromptIntent(null).intent).toBe('repo_analysis');
    });

    test('confidence is between 0 and 1', () => {
      const cases = [
        'explique conceitualmente',
        'analise o package.json',
        'conceitualmente, mostre src/index.js',
      ];
      for (const msg of cases) {
        const { confidence } = classifyPromptIntent(msg);
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: os 3 casos obrigatórios da spec
// ---------------------------------------------------------------------------

const GITHUB_FALLBACK_SNIPPET = 'Ainda não tenho dados GitHub carregados';

describe('Prompt intent routing — 3 casos obrigatórios', () => {
  /**
   * Caso 1 — pergunta conceitual: NÃO deve retornar fallback GitHub.
   */
  test('Caso 1 — conceitual: não retorna fallback GitHub', async () => {
    const result = await serginho.handleRequest({
      message: 'Sem usar GitHub, sem pedir arquivos e sem depender de contexto carregado, explique conceitualmente a diferença entre um orquestrador, um especialista e um construtor dentro de um sistema de IA em camadas.',
      messages: [],
      context: {},
      options: {},
    });

    expect(result.text).not.toContain(GITHUB_FALLBACK_SNIPPET);
    expect(result.text).toBeTruthy();
  });

  /**
   * Caso 2 — pergunta de repositório: roteia corretamente (sem crash).
   * Não deve usar fallback desnecessariamente, mas pode sinalizar que precisa de contexto.
   */
  test('Caso 2 — repo_analysis: roteia sem crash', async () => {
    const result = await serginho.handleRequest({
      message: 'Analise o package.json do repositório facebook/react e me diga se há dependências legadas.',
      messages: [],
      context: {},
      options: {},
    });

    expect(result.text).toBeTruthy();
    // classificação deve ser repo_analysis (verificar via classifyPromptIntent direto)
    const { intent } = serginho.classifyPromptIntent('Analise o package.json do repositório facebook/react e me diga se há dependências legadas.');
    expect(intent).toBe('repo_analysis');
  });

  /**
   * Caso 3 — pergunta mista: NÃO deve travar no fallback genérico.
   * Deve responder (ainda que parcialmente) sem retornar somente o fallback de contexto vazio.
   */
  test('Caso 3 — mixed: não trava no fallback genérico', async () => {
    const result = await serginho.handleRequest({
      message: 'Explique conceitualmente o que é DDD e mostre como está implementado no facebook/react.',
      messages: [],
      context: {},
      options: {},
    });

    expect(result.text).toBeTruthy();
    expect(result.text).not.toContain(GITHUB_FALLBACK_SNIPPET);
    // classificação deve ser mixed
    const { intent } = serginho.classifyPromptIntent('Explique conceitualmente o que é DDD e mostre como está implementado no facebook/react.');
    expect(intent).toBe('mixed');
  });
});

// ---------------------------------------------------------------------------
// Thin wrapper on the orchestrator
// ---------------------------------------------------------------------------

describe('SerginhoOrchestrator.classifyPromptIntent', () => {
  test('delegates to the module and returns correct structure', () => {
    const result = serginho.classifyPromptIntent('o que é RAG?');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    expect(['conceptual', 'repo_analysis', 'mixed']).toContain(result.intent);
  });

  test('returns same result as calling the module directly', () => {
    const messages = [
      'o que é RAG?',
      'Analise o package.json do repositório facebook/react',
      'conceitualmente, o que é DDD? E como funciona no src/index.js?',
    ];
    for (const msg of messages) {
      expect(serginho.classifyPromptIntent(msg)).toEqual(classifyPromptIntent(msg));
    }
  });
});
