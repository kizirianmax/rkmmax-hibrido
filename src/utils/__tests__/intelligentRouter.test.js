/**
 * INTELLIGENT ROUTER TESTS
 * Complete unit tests for the intelligent routing system
 * 
 * ⚠️ These tests are for INTERNAL router implementation
 * External code should use aiAdapter.js interfaces
 */

import {
  analyzeComplexity,
  routeToProvider,
  intelligentRoute,
  getNextFallback,
  FALLBACK_CHAIN,
} from '../intelligentRouter.js';

describe('IntelligentRouter - Internal Implementation Tests', () => {
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
    test('should route messages with code to llama-120b (complex tier)', () => {
      const analysis = {
        hasCode: true,
        scores: { complexity: 5, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-120b');
      expect(result.confidence).toBe(0.95);
      expect(result.reason).toContain('código');
      expect(result.tier).toBe('complex');
    });

    test('should route very high complexity messages to llama-120b (complex tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 10, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: true, hasTechnicalTerms: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-120b');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.tier).toBe('complex');
    });

    test('should route high complexity messages to llama-70b (medium tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 6, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.tier).toBe('medium');
    });

    test('should route very short messages to llama-8b (simple tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 0, speed: 1, simple: 2 },
        analysis: { isVeryShort: true, isLong: false, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-8b');
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('curta');
      expect(result.tier).toBe('simple');
    });

    test('should route medium complexity to llama-70b (medium tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 3, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false, isMedium: true, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('medium');
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
    test('should return llama-70b as first fallback for llama-120b (complex tier)', () => {
      const next = getNextFallback('llama-120b', []);
      expect(next).toBe('llama-70b');
    });

    test('should return groq-fallback when llama-70b tried for llama-120b (NEVER llama-8b)', () => {
      const next = getNextFallback('llama-120b', ['llama-70b']);
      expect(next).toBe('groq-fallback');
      // Critical: NEVER returns llama-8b for complex tier
    });

    test('should return groq-fallback as first fallback for llama-70b (medium tier, skip llama-8b)', () => {
      const next = getNextFallback('llama-70b', []);
      expect(next).toBe('groq-fallback');
      // Medium tier skips llama-8b entirely
    });

    test('should return groq-fallback for llama-8b (simple tier)', () => {
      const next = getNextFallback('llama-8b', []);
      expect(next).toBe('groq-fallback');
    });

    test('should return null when no fallback available', () => {
      const next = getNextFallback('groq-fallback', []);
      expect(next).toBeNull();
    });

    test('should return null when all providers tried for llama-120b', () => {
      const next = getNextFallback('llama-120b', ['llama-70b', 'groq-fallback']);
      expect(next).toBeNull();
    });
  });
});
