import { jest } from '@jest/globals';
import { SerginhoContextual } from '../serginhoOrchestrator.js';

// Mock providers
class MockProvider {
  constructor(name) {
    this.name = name;
  }
  
  async generate(prompt, options = {}) {
    return {
      choices: [{
        message: {
          content: `Mock response from ${this.name} for: ${prompt.substring(0, 30)}...`
        }
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }
}

describe('Serginho Contextual Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    // Create new orchestrator instance for each test
    orchestrator = new SerginhoContextual();
    
    // Mock all providers
    orchestrator.providers = {
      'llama-120b': new MockProvider('llama-120b'),
      'llama-70b': new MockProvider('llama-70b'),
      'llama-8b': new MockProvider('llama-8b'),
      'groq-fallback': new MockProvider('groq-fallback')
    };
  });

  describe('Intent Detection', () => {
    test('Routes casual queries to Llama 8B', async () => {
      const result = await orchestrator.handleRequest('Oi, tudo bem?');
      expect(result.provider).toBe('llama-8b');
      expect(result.tier).toBe('fast');
      expect(result.success).toBe(true);
    });

    test('Routes greetings to Llama 8B', async () => {
      const result = await orchestrator.handleRequest('Hello, how are you?');
      expect(result.provider).toBe('llama-8b');
      expect(result.tier).toBe('fast');
    });

    test('Routes technical queries to Llama 70B', async () => {
      const result = await orchestrator.handleRequest('Como criar uma função React?');
      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('expert');
    });

    test('Routes code-related queries to Llama 70B', async () => {
      const result = await orchestrator.handleRequest('Explain this JavaScript function');
      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('expert');
    });

    test('Routes deep queries to Llama 120B by default', async () => {
      const result = await orchestrator.handleRequest('Explique a arquitetura hexagonal em detalhes');
      expect(result.provider).toBe('llama-120b');
      expect(result.tier).toBe('genius');
    });

    test('Routes complex analysis to Llama 120B', async () => {
      const result = await orchestrator.handleRequest('Analyze the microservices architecture');
      expect(result.provider).toBe('llama-120b');
      expect(result.tier).toBe('genius');
    });
  });

  describe('Betinho Hybrid Mode', () => {
    test('Executes in parallel mode', async () => {
      const result = await orchestrator.handleRequest('Análise profunda', {
        mode: 'betinho-hybrid'
      });
      expect(result.source).toBe('parallel');
      expect(result.success).toBe(true);
      expect(['llama-120b', 'llama-70b', 'llama-8b']).toContain(result.provider);
    });

    test('Returns first successful response', async () => {
      const result = await orchestrator.handleRequest('Test parallel', {
        mode: 'betinho-hybrid'
      });
      expect(result.result).toBeTruthy();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fallback Chain', () => {
    test('Falls back from 120B to 70B on failure', async () => {
      // Mock 120B failure
      orchestrator.providers['llama-120b'].generate = jest.fn().mockRejectedValue(
        new Error('Timeout')
      );
      
      const result = await orchestrator.handleRequest('Deep query');
      expect(result.provider).toBe('llama-70b');
      expect(result.success).toBe(true);
    });

    test('Falls back through entire chain if needed', async () => {
      // Mock 120B and 70B failures
      orchestrator.providers['llama-120b'].generate = jest.fn().mockRejectedValue(
        new Error('Timeout')
      );
      orchestrator.providers['llama-70b'].generate = jest.fn().mockRejectedValue(
        new Error('Timeout')
      );
      
      const result = await orchestrator.handleRequest('Deep query');
      expect(['llama-8b', 'groq-fallback']).toContain(result.provider);
      expect(result.success).toBe(true);
    });

    test('Throws error when all providers fail', async () => {
      // Mock all providers to fail
      Object.keys(orchestrator.providers).forEach(key => {
        orchestrator.providers[key].generate = jest.fn().mockRejectedValue(
          new Error('Failed')
        );
      });
      
      await expect(orchestrator.handleRequest('Test query')).rejects.toThrow('All providers failed');
    });
  });

  describe('Session Management', () => {
    test('Maintains conversation history', async () => {
      await orchestrator.handleRequest('Oi', { sessionId: 'test-1' });
      await orchestrator.handleRequest('Como vai?', { sessionId: 'test-1' });
      
      const history = orchestrator.sessionHistory.get('test-1');
      expect(history).toHaveLength(2);
      expect(history[0].prompt).toBe('Oi');
      expect(history[1].prompt).toBe('Como vai?');
    });

    test('Separates sessions correctly', async () => {
      await orchestrator.handleRequest('Session 1', { sessionId: 'test-1' });
      await orchestrator.handleRequest('Session 2', { sessionId: 'test-2' });
      
      const history1 = orchestrator.sessionHistory.get('test-1');
      const history2 = orchestrator.sessionHistory.get('test-2');
      
      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].prompt).toBe('Session 1');
      expect(history2[0].prompt).toBe('Session 2');
    });

    test('Uses default session when not specified', async () => {
      await orchestrator.handleRequest('Default session');
      
      const history = orchestrator.sessionHistory.get('default');
      expect(history).toHaveLength(1);
    });
  });

  describe('Metrics Tracking', () => {
    test('Tracks total requests', async () => {
      const initialRequests = orchestrator.metrics.totalRequests;
      
      await orchestrator.handleRequest('Test query 1');
      await orchestrator.handleRequest('Test query 2');
      
      expect(orchestrator.metrics.totalRequests).toBe(initialRequests + 2);
    });

    test('Tracks routing decisions', async () => {
      const initial8b = orchestrator.metrics.routingDecisions['8b'];
      
      await orchestrator.handleRequest('Oi');
      
      expect(orchestrator.metrics.routingDecisions['8b']).toBe(initial8b + 1);
    });

    test('Calculates average response time', async () => {
      await orchestrator.handleRequest('Test query');
      
      expect(orchestrator.metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
    });

    test('Returns metrics correctly', () => {
      const metrics = orchestrator.getMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('routingDecisions');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('activeSessions');
    });
  });

  describe('Provider Execution', () => {
    test('Executes with correct provider', async () => {
      const result = await orchestrator.executeWithProvider('llama-70b', 'Test prompt', {});
      
      expect(result.provider).toBe('llama-70b');
      expect(result.tier).toBe('expert');
      expect(result.result).toBeTruthy();
    });

    test('Throws error for unknown provider', async () => {
      await expect(
        orchestrator.executeWithProvider('unknown-provider', 'Test', {})
      ).rejects.toThrow('Provider unknown-provider not found');
    });

    test('Passes options to provider', async () => {
      const generateSpy = jest.spyOn(orchestrator.providers['llama-70b'], 'generate');
      
      await orchestrator.executeWithProvider('llama-70b', 'Test', {
        systemPrompt: 'Custom system prompt',
        temperature: 0.9
      });
      
      expect(generateSpy).toHaveBeenCalledWith('Test', {
        systemPrompt: 'Custom system prompt',
        temperature: 0.9
      });
    });
  });

  describe('Tier Mapping', () => {
    test('Maps 120B to genius tier', () => {
      expect(orchestrator.getTier('llama-120b')).toBe('genius');
    });

    test('Maps 70B to expert tier', () => {
      expect(orchestrator.getTier('llama-70b')).toBe('expert');
    });

    test('Maps 8B to fast tier', () => {
      expect(orchestrator.getTier('llama-8b')).toBe('fast');
    });

    test('Maps groq to fallback tier', () => {
      expect(orchestrator.getTier('groq-fallback')).toBe('fallback');
    });

    test('Returns unknown for unmapped providers', () => {
      expect(orchestrator.getTier('unknown')).toBe('unknown');
    });
  });
});
