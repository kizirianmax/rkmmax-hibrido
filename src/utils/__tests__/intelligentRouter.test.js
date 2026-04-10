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

    test('should route very high complexity messages without code to gemini-pro (complex tier)', () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 10, speed: 0, simple: 0 },
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
        scores: { complexity: 6, speed: 0, simple: 0 },
        analysis: { isVeryShort: false, isLong: false, hasTechnicalTerms: true },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('gemini-pro');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.tier).toBe('complex');
    });

    test('should route very short messages with score 0 to llama-8b (simple tier)', () => {
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

    test('should route very short messages with score >= 2 to llama-70b (content creation)', () => {
      // Mensagens curtas com keywords de criação ("prompt", "criar", etc.) não devem ir para o 8B.
      // "Faz um prompt de tecnologia" tem score 2 e deve ir para o 70B.
      const analysis = {
        hasCode: false,
        scores: { complexity: 2, speed: 0, simple: 0 },
        analysis: { isVeryShort: true, isLong: false, hasTechnicalTerms: false },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('medium');
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
    test('should return gemini-pro as first fallback for llama-120b (complex tier)', () => {
      const next = getNextFallback('llama-120b', []);
      expect(next).toBe('gemini-pro');
    });

    test('should return llama-70b as fallback for llama-120b when gemini-pro tried (NEVER llama-8b)', () => {
      const next = getNextFallback('llama-120b', ['gemini-pro']);
      expect(next).toBe('llama-70b');
      // Critical: NEVER returns llama-8b for complex tier
    });

    test('should return llama-120b as first fallback for llama-70b (medium tier — avoids double-fail on same endpoint)', () => {
      // 70B e groq-fallback usam endpoints diferentes, mas o 120B é um modelo mais
      // robusto para continuar a tarefa. Se o 70B falha por rate limit, o 120B usa
      // um endpoint diferente (openai/gpt-oss-120b) e não sofre o mesmo rate limit.
      // Portanto: 70B → 120B → groq-fallback garante resiliência real.
      const next = getNextFallback('llama-70b', []);
      expect(next).toBe('llama-120b');
    });

    test('should return groq-fallback for llama-70b when llama-120b already tried', () => {
      const next = getNextFallback('llama-70b', ['llama-120b']);
      expect(next).toBe('groq-fallback');
    });

    test('should return llama-70b as first fallback for llama-8b (resilience — avoids same-model double failure)', () => {
      // llama-8b e groq-fallback usam o mesmo modelo (llama-3.1-8b-instant).
      // Se o 8B falhar por rate limit, o groq-fallback também falharia com o mesmo erro.
      // Portanto: 8B → 70B → groq-fallback garante resiliência real.
      const next = getNextFallback('llama-8b', []);
      expect(next).toBe('llama-70b');
    });

    test('should return groq-fallback for llama-8b when llama-70b already tried', () => {
      const next = getNextFallback('llama-8b', ['llama-70b']);
      expect(next).toBe('groq-fallback');
    });

    test('should return null when no fallback available', () => {
      const next = getNextFallback('groq-fallback', []);
      expect(next).toBeNull();
    });

    test('should return null when all providers tried for llama-120b', () => {
      const next = getNextFallback('llama-120b', ['gemini-pro', 'llama-70b', 'groq-fallback']);
      expect(next).toBeNull();
    });
  });
});
