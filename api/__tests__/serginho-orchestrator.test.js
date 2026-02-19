import { jest } from '@jest/globals';
import serginho from '../lib/serginho-orchestrator.js';
import { getProviderConfig } from '../lib/providers-config.js';

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
    
    // Mock fetch with successful responses (resolve imediatamente)
    global.fetch = jest.fn().mockImplementation((url, options) => {
      // Retorna Promise já resolvida para execução imediata em testes
      return Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          // Gemini response format
          candidates: [{
            content: {
              parts: [{ text: 'Mock response from AI' }]
            }
          }],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30
          },
          // Groq/OpenAI response format
          choices: [{
            message: {
              content: 'Mock response from AI'
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        }),
        text: jest.fn().mockResolvedValue('OK'),
      });
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('handleRequest', () => {
    test('routes simple messages to llama-8b', async () => {
      const result = await serginho.handleRequest({
        message: 'Olá, tudo bem?',
        messages: [],
        context: {},
        options: {}
      });

      expect(result.provider).toBe('llama-8b');
      expect(result.tier).toBe('simple');
      expect(result.text).toBeTruthy();
      expect(result.fromCache).toBe(false);
    });

    test('routes complex messages to llama-120b or llama-70b', async () => {
      const result = await serginho.handleRequest({
        message: 'Analise em profundidade a arquitetura hexagonal e explique como implementar microserviços',
        messages: [],
        context: {},
        options: {}
      });

      // Should route to llama-120b or llama-70b depending on complexity analysis
      expect(['llama-120b', 'llama-70b']).toContain(result.provider);
      expect(['complex', 'medium']).toContain(result.tier);
      expect(result.text).toBeTruthy();
    });

    test('routes messages with code to llama-120b', async () => {
      const result = await serginho.handleRequest({
        message: 'function test() { return "hello"; }',
        messages: [],
        context: {},
        options: {}
      });

      expect(result.provider).toBe('llama-120b');
      expect(result.tier).toBe('complex');
    });

    test('respects forceProvider option', async () => {
      const result = await serginho.handleRequest({
        message: 'Simple message',
        messages: [],
        context: {},
        options: { forceProvider: 'groq-fallback' }
      });

      expect(result.provider).toBe('groq-fallback');
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
      expect(result1.fromCache).toBe(false);

      // Second request with same message
      const result2 = await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });
      expect(result2.fromCache).toBe(true);
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

      // Second request with bypass cache
      const result = await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: { bypassCache: true }
      });
      expect(result.fromCache).toBe(false);
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
      // Mock llama-8b to fail
      global.fetch = jest.fn((url, options) => {
        const body = JSON.parse(options.body);
        if (body.model === 'llama-3.1-8b-instant') {
          return Promise.reject(new Error('Provider failed'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Fallback response' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        });
      });

      const result = await serginho.handleRequest({
        message: 'Oi',
        messages: [],
        context: {},
        options: {}
      });

      // Should have fallen back to groq-fallback
      expect(result.triedProviders).toContain('llama-8b');
      expect(result.provider).toBe('groq-fallback');
      expect(result.text).toBe('Fallback response');
    });

    test('throws error when all providers fail', async () => {
      // Mock all providers to fail
      global.fetch = jest.fn(() => Promise.reject(new Error('All providers down')));

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
      const breakers = orchestrator.circuitBreakers;
      expect(breakers.size).toBeGreaterThan(0);
      expect(breakers.has('llama-8b')).toBe(true);
      expect(breakers.has('llama-70b')).toBe(true);
      expect(breakers.has('llama-120b')).toBe(true);
    });

    test('circuit breaker opens after failures', async () => {
      // Mock to always fail
      global.fetch = jest.fn(() => Promise.reject(new Error('Consistent failure')));

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

      const states = orchestrator.getCircuitBreakerStates();
      // Circuit breaker should be open after threshold failures
      expect(['OPEN', 'HALF_OPEN']).toContain(states['llama-8b'].state);
    });
  });

  describe('provider-specific calls', () => {
    test('calls Groq API correctly', async () => {
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
      expect(options.headers['Authorization']).toContain('Bearer');
      
      const body = JSON.parse(options.body);
      expect(body.model).toBe('llama-3.1-8b-instant');
      expect(body.messages).toBeInstanceOf(Array);
    });

    test('calls Gemini API correctly', async () => {
      await serginho.handleRequest({
        message: 'Test Gemini',
        messages: [],
        context: {},
        options: { forceProvider: 'gemini-2.0-flash' }
      });

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toContain('generativelanguage.googleapis.com');
      
      const body = JSON.parse(callArgs[1].body);
      expect(body.contents).toBeInstanceOf(Array);
      expect(body.generationConfig).toBeDefined();
    });
  });

  describe('message formatting', () => {
    test('formats messages for Gemini correctly', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];
      
      const formatted = orchestrator.formatMessages(messages, 'How are you?', 'gemini');
      
      expect(formatted).toHaveLength(3);
      expect(formatted[0].role).toBe('user');
      expect(formatted[1].role).toBe('model'); // Gemini uses 'model' instead of 'assistant'
      expect(formatted[2].parts[0].text).toBe('How are you?');
    });

    test('formats messages for OpenAI/Groq correctly', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];
      
      const formatted = orchestrator.formatMessages(messages, 'How are you?', 'openai');
      
      expect(formatted).toHaveLength(3);
      expect(formatted[0].role).toBe('user');
      expect(formatted[1].role).toBe('assistant');
      expect(formatted[2].content).toBe('How are you?');
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
      // Make a request to cache it
      await serginho.handleRequest({
        message: 'Cache test',
        messages: [],
        context: {},
        options: {}
      });

      // Clear cache
      serginho.clearCache();

      // Same request should not be cached
      const result = await serginho.handleRequest({
        message: 'Cache test',
        messages: [],
        context: {},
        options: {}
      });

      expect(result.fromCache).toBe(false);
    });
  });

  describe('metrics tracking', () => {
    test('tracks provider usage', async () => {
      await serginho.handleRequest({
        message: 'Test 1',
        messages: [],
        context: {},
        options: { forceProvider: 'llama-8b' }
      });

      await serginho.handleRequest({
        message: 'Test 2',
        messages: [],
        context: {},
        options: { forceProvider: 'llama-70b' }
      });

      const metrics = serginho.getMetrics();
      expect(metrics.providerUsage['llama-8b']).toBeGreaterThan(0);
      expect(metrics.providerUsage['llama-70b']).toBeGreaterThan(0);
    });

    test('tracks cache hits', async () => {
      const message = 'Cache hit test';
      
      // First request (miss)
      await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });

      const metricsAfterMiss = serginho.getMetrics();
      const initialCacheHits = metricsAfterMiss.cacheHits;

      // Second request (hit)
      await serginho.handleRequest({
        message,
        messages: [],
        context: {},
        options: {}
      });

      const metricsAfterHit = serginho.getMetrics();
      expect(metricsAfterHit.cacheHits).toBe(initialCacheHits + 1);
    });

    test('tracks response times', async () => {
      await serginho.handleRequest({
        message: 'Response time test',
        messages: [],
        context: {},
        options: {}
      });

      const metrics = serginho.getMetrics();
      // Response time should be >= 0 (could be 0 in very fast mocked tests)
      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.avgResponseTime).toBe('number');
    });
  });
});
