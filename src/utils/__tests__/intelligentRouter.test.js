/**
 * INTELLIGENT ROUTER TESTS
 * Complete unit tests for the intelligent routing system
 */

import {
  analyzeComplexity,
  routeToProvider,
  intelligentRoute,
  getNextFallback,
  FALLBACK_CHAIN,
} from '../intelligentRouter.js';

describe('Intelligent Router', () => {
  describe('analyzeComplexity', () => {
    test('should analyze very short simple message correctly', () => {
      const message = 'Olá, como vai?';
      const result = analyzeComplexity(message);

      expect(result.wordCount).toBe(3);
      expect(result.hasCode).toBe(false);
      expect(result.analysis.isVeryShort).toBe(true);
      expect(result.scores.simple).toBeGreaterThan(0);
    });

    test('should detect code patterns in messages', () => {
      const messageWithCode = '```javascript\nfunction test() { return 42; }\n```';
      const result = analyzeComplexity(messageWithCode);

      expect(result.hasCode).toBe(true);
      expect(result.scores.complexity).toBeGreaterThan(0);
    });

    test('should detect async/await patterns', () => {
      const message = 'async function fetchData() { await getData(); }';
      const result = analyzeComplexity(message);

      expect(result.hasCode).toBe(true);
      expect(result.scores.complexity).toBeGreaterThan(0);
    });

    test('should detect technical terms', () => {
      const message = 'Como configurar a API REST com database e frontend?';
      const result = analyzeComplexity(message);

      expect(result.analysis.hasTechnicalTerms).toBe(true);
      expect(result.scores.complexity).toBeGreaterThan(0);
    });

    test('should detect long messages with multiple lines', () => {
      // Create a message with > 100 words to trigger isLong
      const words = [];
      for (let i = 0; i < 110; i++) {
        words.push(`word${i}`);
      }
      const message = words.join(' ') + '\n' + 'linha2\n' + 'linha3';
      const result = analyzeComplexity(message);

      expect(result.analysis.isLong).toBe(true);
      expect(result.lineCount).toBeGreaterThan(1);
      expect(result.scores.complexity).toBeGreaterThan(0);
    });

    test('should detect multiple questions', () => {
      const message = 'Como fazer isso? E aquilo? E mais isso? E também aquilo?';
      const result = analyzeComplexity(message);

      expect(result.analysis.hasMultipleQuestions).toBe(true);
    });

    test('should analyze medium-length messages', () => {
      const message = 'Esta é uma mensagem de tamanho médio que deve ter entre 30 e 100 palavras para testar a análise de complexidade do sistema de roteamento inteligente que estamos desenvolvendo para o projeto.';
      const result = analyzeComplexity(message);

      expect(result.analysis.isMedium).toBe(true);
      expect(result.wordCount).toBeGreaterThanOrEqual(30);
      expect(result.wordCount).toBeLessThan(100);
    });

    test('should analyze short messages', () => {
      const message = 'Esta é uma mensagem curta com poucas palavras';
      const result = analyzeComplexity(message);

      expect(result.analysis.isShort).toBe(true);
      expect(result.wordCount).toBeLessThan(30);
    });
  });

  describe('routeToProvider', () => {
    test('should route messages with code to llama-70b', () => {
      const analysis = {
        hasCode: true,
        scores: { complexity: 5, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: false, hasMultipleQuestions: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.confidence).toBe(0.95);
      expect(result.reason).toContain('código');
    });

    test('should route high complexity messages to llama-70b', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 8, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: true, hasMultipleQuestions: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.confidence).toBe(0.9);
      expect(result.reason).toContain('complexidade');
    });

    test('should route long messages with technical terms to llama-70b', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 3, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: true, hasTechnicalTerms: true, hasMultipleQuestions: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('longa');
    });

    test('should route multiple complex questions to llama-70b', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 4, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: false, hasMultipleQuestions: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.confidence).toBe(0.85);
      expect(result.reason).toContain('perguntas');
    });

    test('should route very short messages to llama-8b', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 0, speed: 1, simple: 2 },
        analysis: { isVeryShort: true, isLong: false, hasTechnicalTerms: false, hasMultipleQuestions: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-8b');
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('curta');
    });

    test('should route standard messages to llama-8b by default', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 2, speed: 0, simple: 1 },
        analysis: { isVeryShort: false, isShort: false, isMedium: true, isLong: false, hasTechnicalTerms: false, hasMultipleQuestions: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-8b');
      expect(result.confidence).toBe(0.7);
      expect(result.reason).toContain('padrão');
    });
  });

  describe('intelligentRoute', () => {
    test('should perform complete intelligent routing', () => {
      const message = 'Como implementar uma API REST?';
      const result = intelligentRoute(message);

      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });
  });

  describe('getNextFallback', () => {
    test('should return first fallback for llama-70b', () => {
      const next = getNextFallback('llama-70b', []);
      expect(next).toBe('llama-8b');
    });

    test('should skip tried providers in fallback chain', () => {
      const next = getNextFallback('llama-70b', ['llama-8b']);
      expect(next).toBe('groq-fallback');
    });

    test('should return null when no fallback available', () => {
      const next = getNextFallback('groq-fallback', []);
      expect(next).toBeNull();
    });

    test('should return null when all providers tried', () => {
      const next = getNextFallback('llama-70b', ['llama-8b', 'groq-fallback']);
      expect(next).toBeNull();
    });

    test('should handle unknown provider gracefully', () => {
      const next = getNextFallback('unknown-provider', []);
      expect(next).toBeNull();
    });

    test('should return first available when some providers tried', () => {
      const next = getNextFallback('llama-8b', []);
      expect(next).toBe('groq-fallback');
    });
  });
});
