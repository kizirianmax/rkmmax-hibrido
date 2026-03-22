/**
 * api/__tests__/serginho-conceptual-bypass.test.js
 * Testes para o conceptual prompt guard do Serginho Orchestrator.
 *
 * Valida que:
 *   - Perguntas puramente conceituais/estratégicas NÃO acionam o fallback GitHub
 *   - Perguntas com referência explícita a GitHub/arquivo/repo AINDA acionam o fluxo correto
 *   - Casos de borda (mensagens mistas) são tratados corretamente
 */

import { jest } from '@jest/globals';
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
// _isConceptualPrompt — unit tests for the guard method
// ---------------------------------------------------------------------------

describe('SerginhoOrchestrator._isConceptualPrompt', () => {
  // Conceptual questions that MUST return true
  const conceptualCases = [
    // Explicit PT-BR abstraction markers
    'Explique conceitualmente a diferença entre um orquestrador e um especialista',
    'teoricamente, como funciona um sistema de IA em camadas?',
    'em teoria, qual é a diferença entre LLM e RAG?',
    'de forma abstrata, o que é um construtor num sistema de agentes?',
    // Explicit EN abstraction markers
    'Explain conceptually the difference between an orchestrator and a specialist',
    'theoretically, how does a multi-agent system work?',
    'abstractly speaking, what is the role of a builder in AI systems?',
    // Explicit "sem github" instructions
    'Sem usar GitHub, sem pedir arquivos e sem depender de contexto carregado, explique a diferença entre orquestrador e especialista',
    'sem pedir arquivos, o que é RAG?',
    'sem depender de contexto, explique o padrão de arquitetura hexagonal',
    // EN "without github"
    'Without using GitHub, explain the difference between an LLM and a RAG system',
    // Conceptual explanation pattern
    'explique a diferença entre orquestrador e especialista em sistemas de IA',
    'explique a diferença entre LLM e RAG em sistemas modernos de IA',
    // Long messages without GitHub references
    'Quero entender melhor como funcionam os sistemas de IA em camadas. Existe uma distinção importante entre um orquestrador, que coordena fluxos e delega para especialistas, e os especialistas em si, que resolvem domínios específicos. Me explique essa diferença de forma detalhada.',
  ];

  test.each(conceptualCases)('should return true for: %s', (message) => {
    expect(serginho._isConceptualPrompt(message)).toBe(true);
  });

  // GitHub-related questions that MUST return false
  const githubCases = [
    'Analise o package.json do repositório facebook/react',
    'liste as branches do repo owner/repo',
    'mostre o conteúdo do arquivo src/index.js',
    'abra o README.md de owner/repo',
    'quais dependências tem o package.json?',
    'analise o conteúdo desse arquivo .ts',
  ];

  test.each(githubCases)('should return false for GitHub question: %s', (message) => {
    expect(serginho._isConceptualPrompt(message)).toBe(false);
  });

  // Edge cases
  test('returns false for empty string', () => {
    expect(serginho._isConceptualPrompt('')).toBe(false);
  });

  test('returns false for null', () => {
    expect(serginho._isConceptualPrompt(null)).toBe(false);
  });

  test('returns false for short casual message without abstraction markers', () => {
    expect(serginho._isConceptualPrompt('oi, tudo bem?')).toBe(false);
  });

  test('returns false for "o que é" when github reference present', () => {
    expect(serginho._isConceptualPrompt('o que é o package.json desse repo?')).toBe(false);
  });

  test('returns true for "o que é" without github reference', () => {
    expect(serginho._isConceptualPrompt('o que é um orquestrador de IA?')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: conceptual questions must NOT return GitHub fallback message
// ---------------------------------------------------------------------------

describe('Conceptual bypass integration', () => {
  const GITHUB_FALLBACK_SNIPPET = 'Ainda não tenho dados GitHub carregados';

  test('conceptual question does not return GitHub fallback', async () => {
    const result = await serginho.handleRequest({
      message: 'Sem usar GitHub, sem pedir arquivos e sem depender de contexto carregado, explique conceitualmente a diferença entre um orquestrador, um especialista e um construtor dentro de um sistema de IA em camadas.',
      messages: [],
      context: {},
      options: {},
    });

    expect(result.text).not.toContain(GITHUB_FALLBACK_SNIPPET);
    expect(result.text).toBeTruthy();
  });

  test('conceptual "what is" question does not return GitHub fallback', async () => {
    const result = await serginho.handleRequest({
      message: 'o que é um orquestrador de IA?',
      messages: [],
      context: {},
      options: {},
    });

    expect(result.text).not.toContain(GITHUB_FALLBACK_SNIPPET);
    expect(result.text).toBeTruthy();
  });

  test('GitHub repo question still routes correctly (not bypassed)', async () => {
    // A GitHub question should NOT be bypassed — it should either use context or
    // return a GitHub-related response. We just verify it does not crash.
    const result = await serginho.handleRequest({
      message: 'Analise o package.json do repositório facebook/react e me diga se há dependências legadas.',
      messages: [],
      context: {},
      options: {},
    });

    expect(result.text).toBeTruthy();
    // This will hit the GitHub intent or follow-up chain — result.text may vary,
    // but the request must not throw.
  });
});
