import { jest } from '@jest/globals';
import serginho from '../lib/serginho-orchestrator.js';
import { getProviderConfig } from '../lib/providers-config.js';
import { createMockFetch, createGeminiMockFetch, createFailingMockFetch } from '../lib/test-helpers/mockFetch.js';

// Mock environment variables
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.GOOGLE_API_KEY = 'test-google-key';

describe('SerginhoOrchestrator', () => {
  let originalFetch;

  beforeEach(() => {
    // Use singleton instance (serginho is already instantiated)
    // Reset circuit breakers and cache before each test
    serginho.resetMetrics();
    serginho.clearCache();
    
    // Save original fetch
    originalFetch = global.fetch;
    
    // Mock fetch with successful responses using helper
    global.fetch = createMockFetch();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('handleRequest', () => {
    test('routes simple messages correctly', async () => {
      const result = await serginho.handleRequest({
        message: 'Olá, tudo bem?',
        messages: [],
        context: {},
        options: {}
      });

      // Verify response structure
      expect(result.model.logicalTier).toBe('simple');
      expect(result.model.infrastructure).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.routing.cacheHit).toBe(false);
    });

    test('routes complex messages correctly', async () => {
      const result = await serginho.handleRequest({
        message: 'Analise em profundidade a arquitetura hexagonal e explique como implementar microserviços com DDD',
        messages: [],
        context: {},
        options: {}
      });

      // Should route to complex or medium tier
      expect(['complex', 'medium']).toContain(result.model.logicalTier);
      expect(result.text).toBeTruthy();
    });

    test('routes messages with code to complex tier', async () => {
      const result = await serginho.handleRequest({
        message: 'function test() { return "hello"; } // analyze this code',
        messages: [],
        context: {},
        options: {}
      });

      expect(result.model.logicalTier).toBe('complex');
    });

    test('respects forceProvider option', async () => {
      const result = await serginho.handleRequest({
        message: 'Simple message',
        messages: [],
        context: {},
        options: { forceProvider: 'groq-fallback' }
      });

      expect(result.routing.routingReason).toBe('forced');
      expect(result.text).toBeTruthy();
    });

    test('uses cache on repeated messages', async () => {
      const message = 'Test cache message';
      
      // First request
      const result1 = await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });
      expect(result1.routing.cacheHit).toBe(false);

      // Second request with same message
      const result2 = await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });
      expect(result2.routing.cacheHit).toBe(true);
      expect(result2.text).toBe(result1.text);
    });

    test('bypasses cache when option is set', async () => {
      const message = 'Test bypass cache';
      
      // First request
      await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });

      // Second request with bypassCache
      const result = await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: { bypassCache: true }
      });
      expect(result.routing.cacheHit).toBe(false);
    });

    test('includes conversation history', async () => {
      const result = await serginho.handleRequest({
        message: 'What did I just ask?',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ],
        context: {},
        options: {}
      });

      expect(result.text).toBeTruthy();
      expect(global.fetch).toHaveBeenCalled();
    });

    test('tracks metrics correctly', async () => {
      const initialMetrics = serginho.getMetrics();
      const initialRequests = initialMetrics.totalRequests;

      await serginho.handleRequest({
        message: 'Test metrics',
        messages: [],
        context: {},
        options: {}
      });

      const newMetrics = serginho.getMetrics();
      expect(newMetrics.totalRequests).toBe(initialRequests + 1);
      expect(newMetrics.successfulRequests).toBeGreaterThan(0);
    });
  });

  describe('fallback mechanism', () => {
    test('falls back to next provider on failure', async () => {
      // Mock llama-8b to fail, others succeed
      global.fetch = createMockFetch({
        failProviders: { 'llama-8b': true }
      });

      const result = await serginho.handleRequest({
        message: 'Simple test',
        messages: [],
        context: {},
        options: {}
      });

      // Should fallback successfully
      expect(result.execution.status).toBe('fallback');
      expect(result.execution.fallbackLevel).toBeGreaterThan(0);
      expect(result.text).toBeTruthy();
    });

    test('throws error when all providers fail', async () => {
      // Mock all providers to fail
      global.fetch = createFailingMockFetch('All providers down');

      await expect(serginho.handleRequest({
        message: 'Test failure',
        messages: [],
        context: {},
        options: {}
      })).rejects.toThrow('All providers failed');
    });
  });

  describe('circuit breaker integration', () => {
    test('circuit breaker protects providers', async () => {
      const result = await serginho.handleRequest({
        message: 'Test',
        messages: [],
        context: {},
        options: {}
      });

      // Verify circuit breakers exist and work
      expect(result.model).toHaveProperty('infrastructure');
      expect(result.execution).toHaveProperty('circuitBreakerStates');
      expect(result.text).toBeTruthy();
    });

    test('circuit breaker opens after failures', async () => {
      // Mock to always fail
      global.fetch = createFailingMockFetch('Consistent failure');

      // Try multiple times to trip circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await serginho.handleRequest({
            message: 'Test',
            messages: [],
            context: {},
            options: { forceProvider: 'llama-8b' }
          });
        } catch (e) {
          // Expected to fail
        }
      }

      // Circuit breaker should have recorded failures
      const metrics = serginho.getMetrics();
      expect(metrics.failedRequests).toBeGreaterThan(0);
    });
  });

  describe('provider-specific calls', () => {
    test('calls Groq API correctly', async () => {
      // Reset mock and circuit breakers for this test
      global.fetch = createMockFetch();
      serginho.resetMetrics();
      serginho.clearCache();
      serginho.resetCircuitBreakers();

      await serginho.handleRequest({
        message: 'Test Groq',
        messages: [],
        context: {},
        options: { forceProvider: 'llama-8b' }
      });

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toContain('api.groq.com');
      
      const options = callArgs[1];
      const body = JSON.parse(options.body);
      expect(body.model).toBe('llama-3.1-8b-instant');
      expect(body.messages).toBeDefined();
    });

    test('calls Gemini API correctly', async () => {
      // Mock Gemini-specific response
      global.fetch = createGeminiMockFetch();

      const result = await serginho.handleRequest({
        message: 'Test Gemini',
        messages: [],
        context: {},
        options: { forceProvider: 'gemini-2.0-flash' }
      });

      expect(result.text).toBeTruthy();
      expect(result.model.infrastructure).toBe('gemini');
    });
  });

  describe('message formatting', () => {
    test('formats messages for Gemini correctly', () => {
      const config = getProviderConfig('gemini-2.0-flash');
      expect(config.type).toBe('gemini');
      expect(config.generationConfig).toBeDefined();
    });

    test('formats messages for OpenAI/Groq correctly', () => {
      const config = getProviderConfig('llama-8b');
      expect(config.type).toBe('groq');
      expect(config.defaultParams).toBeDefined();
    });
  });

  describe('cache management', () => {
    test('generates consistent cache keys', () => {
      const key1 = serginho.getCacheKey('Test message', 'llama-8b');
      const key2 = serginho.getCacheKey('Test message', 'llama-8b');
      const key3 = serginho.getCacheKey('Test message', 'llama-70b');
      
      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    test('clearCache removes all cached responses', async () => {
      // Reset mock and circuit breakers for this test
      global.fetch = createMockFetch();
      serginho.resetMetrics();
      serginho.clearCache();
      serginho.resetCircuitBreakers();

      // Make a request to populate cache
      await serginho.handleRequest({
        message: 'Test cache',
        messages: [],
        context: {},
        options: {}
      });

      // Clear cache
      serginho.clearCache();

      // Next request should not be from cache
      const result = await serginho.handleRequest({
        message: 'Test cache',
        messages: [],
        context: {},
        options: {}
      });
      expect(result.routing.cacheHit).toBe(false);
    });
  });

  describe('metrics tracking', () => {
    test('tracks provider usage', async () => {
      // Reset mock and circuit breakers for this test
      global.fetch = createMockFetch();
      serginho.resetMetrics();
      serginho.clearCache();
      serginho.resetCircuitBreakers();

      await serginho.handleRequest({
        message: 'Test metrics',
        messages: [],
        context: {},
        options: { forceProvider: 'llama-8b' }
      });

      const metrics = serginho.getMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.successfulRequests).toBeGreaterThan(0);
    });

    test('tracks cache hits', async () => {
      // Reset mock and circuit breakers for this test
      global.fetch = createMockFetch();
      serginho.resetMetrics();
      serginho.clearCache();
      serginho.resetCircuitBreakers();

      const message = 'Test cache metrics';
      
      // First request (miss)
      await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });

      // Second request (hit)
      await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });

      const metrics = serginho.getMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });

    test('tracks response times', async () => {
      // Reset mock and circuit breakers for this test
      global.fetch = createMockFetch();
      serginho.resetMetrics();
      serginho.clearCache();
      serginho.resetCircuitBreakers();

      const result = await serginho.handleRequest({
        message: 'Test timing',
        messages: [],
        context: {},
        options: {}
      });

      expect(result.execution.totalOrchestrationTime).toBeDefined();
      expect(typeof result.execution.totalOrchestrationTime).toBe('number');
      expect(result.execution.totalOrchestrationTime).toBeGreaterThanOrEqual(0);
    });
  });
});
