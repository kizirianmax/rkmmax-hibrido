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
        scores: { complexity: 5, speed: 0 },
        analysis: { isVeryShort: false, isLong: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-120b');
      expect(result.confidence).toBe(0.95);
      expect(result.reason).toContain('código');
      expect(result.tier).toBe('complex');
    });

    test('should route very high complexity messages without code to gemini-pro (complex tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 10, speed: 0 },
        analysis: { isVeryShort: false, isLong: true, hasTechnicalTerms: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('gemini-pro');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.tier).toBe('complex');
    });

    test('should route high complexity messages without code to gemini-pro (complex tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 6, speed: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('gemini-pro');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.tier).toBe('complex');
    });

    test('should route very short messages with score 0 to llama-70b (potencial máximo — sem 8B)', () => {
      // llama-8b removido: trivial vai para llama-70b (potencial máximo em todas as interações)
      const analysis = {
        hasCode: false,
        scores: { complexity: 0, speed: 1 },
        analysis: { isVeryShort: true, isLong: false, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('medium');
    });

    test('should route very short messages with score >= 2 to llama-70b (content creation)', () => {
      // Mensagens curtas com keywords de criação ("prompt", "criar", etc.) vão para o 70B.
      // "Faz um prompt de tecnologia" tem score 4 e deve ir para o 70B.
      const analysis = {
        hasCode: false,
        scores: { complexity: 4, speed: 0 },
        analysis: { isVeryShort: true, isLong: false, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('medium');
    });

    test('should route medium complexity to llama-70b (medium tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 3, speed: 0 },
        analysis: { isVeryShort: false, isLong: false, isMedium: true, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('medium');
    });

    test('should route high complexity without Gemini to llama-120b', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 8, speed: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: true },
      };

      // Sem Gemini disponível
      const result = routeToProvider(analysis, { enabledProviders: ['llama-120b', 'llama-70b', 'gemini-3-flash'] });

      expect(result.provider).toBe('llama-120b');
      expect(result.tier).toBe('complex');
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

    test('trivial messages route to llama-70b (no 8B downgrade)', () => {
      const result = intelligentRoute('Boa noite');
      expect(result.provider).toBe('llama-70b');
    });

    test('content creation messages route to llama-70b or higher', () => {
      const result = intelligentRoute('Faz um prompt de tecnologia');
      expect(['llama-70b', 'llama-120b', 'gemini-pro']).toContain(result.provider);
    });
  });

  describe('FALLBACK_CHAIN', () => {
    test('llama-8b is NOT in FALLBACK_CHAIN (removed)', () => {
      expect(FALLBACK_CHAIN['llama-8b']).toBeUndefined();
    });

    test('gemini-pro chain never includes llama-8b', () => {
      expect(FALLBACK_CHAIN['gemini-pro']).not.toContain('llama-8b');
    });

    test('llama-120b chain never includes llama-8b', () => {
      expect(FALLBACK_CHAIN['llama-120b']).not.toContain('llama-8b');
    });

    test('llama-70b chain never includes llama-8b', () => {
      expect(FALLBACK_CHAIN['llama-70b']).not.toContain('llama-8b');
    });
  });

  describe('getNextFallback', () => {
    test('should return gemini-pro as first fallback for llama-120b (complex tier)', () => {
      const next = getNextFallback('llama-120b', []);
      expect(next).toBe('gemini-pro');
    });

    test('should return llama-70b as fallback for llama-120b when gemini-pro tried (NEVER llama-8b)', () => {
      const next = getNextFallback('llama-120b', ['gemini-pro']);
      expect(next).toBe('llama-70b');
      // Critical: NEVER returns llama-8b for complex tier
    });

    test('should return llama-120b as first fallback for llama-70b (medium tier)', () => {
      const next = getNextFallback('llama-70b', []);
      expect(next).toBe('llama-120b');
    });

    test('should return gemini-pro for llama-70b when llama-120b already tried', () => {
      const next = getNextFallback('llama-70b', ['llama-120b']);
      expect(next).toBe('gemini-pro');
    });

    test('should return gemini-3-flash for llama-70b when llama-120b and gemini-pro tried', () => {
      const next = getNextFallback('llama-70b', ['llama-120b', 'gemini-pro']);
      expect(next).toBe('gemini-3-flash');
    });

    test('should return null when no fallback available', () => {
      const next = getNextFallback('gemini-3-flash', []);
      expect(next).toBeNull();
    });

    test('should return null when all providers tried for llama-120b', () => {
      const next = getNextFallback('llama-120b', ['gemini-pro', 'llama-70b', 'gemini-3-flash']);
      expect(next).toBeNull();
    });

    test('should return null when all providers tried for llama-70b', () => {
      const next = getNextFallback('llama-70b', ['llama-120b', 'gemini-pro', 'gemini-3-flash']);
      expect(next).toBeNull();
    });
  });
});
