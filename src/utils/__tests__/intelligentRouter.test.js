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
  });

  describe('routeToProvider', () => {
    test('should route messages with code to llama-70b', () => {
      const analysis = {
        hasCode: true,
        scores: { complexity: 5, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false },
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
        analysis: { isVeryShort: false, isLong: true, hasTechnicalTerms: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    test('should route very short messages to llama-8b', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 0, speed: 1, simple: 2 },
        analysis: { isVeryShort: true, isLong: false, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-8b');
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('curta');
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

    test('should skip tried providers in fallback', () => {
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
  });
});
