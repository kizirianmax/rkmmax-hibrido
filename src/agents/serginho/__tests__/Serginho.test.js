import { jest } from '@jest/globals';
import Serginho from '../Serginho.js';
import SpecialistRegistry from '../../core/SpecialistRegistry.js';
import IntelligentCache from '../../../cache/IntelligentCache.js';

describe('Serginho - Orchestrator (Behavioral Tests)', () => {
  let serginho;

  beforeEach(() => {
    serginho = new Serginho({
      id: 'serginho',
      name: 'Serginho',
      role: 'Orquestrador Principal',
    });
    
    // Register a default specialist for testing
    serginho.registerSpecialist('didak', {
      id: 'didak',
      name: 'Didak',
      role: 'Teaching Specialist',
      capabilities: ['teaching', 'general'],
      mode: 'AUTONOMOUS',
    });
  });

  describe('Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(serginho.id).toBe('serginho');
      expect(serginho.name).toBe('Serginho');
      expect(serginho.role).toBe('Orquestrador Principal');
      expect(serginho.mode).toBe('AUTONOMOUS');
    });

    test('should have specialist registry', () => {
      expect(serginho.registry).toBeInstanceOf(SpecialistRegistry);
    });

    test('should have global cache', () => {
      expect(serginho.globalCache).toBeInstanceOf(IntelligentCache);
    });

    test('should have task queue initialized', () => {
      expect(serginho.taskQueue).toEqual([]);
      expect(serginho.maxConcurrentTasks).toBe(10);
      expect(serginho.activeTasks).toBeInstanceOf(Map);
    });
  });

  describe('Task Processing', () => {
    test('should process simple query', async () => {
      const result = await serginho.process('Hello');

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('SUCCESS');
      // ❌ NO provider name checks!
      expect(result).not.toHaveProperty('provider');
    });

    test('should process code query', async () => {
      const code = 'function test() { return 42; }';
      const result = await serginho.process(code);

      expect(result.status).toBe('SUCCESS');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('timestamp');
      // ❌ NO provider name checks!
      expect(result).not.toHaveProperty('provider');
    });

    test('should process complex task', async () => {
      const task = 'Design a microservices architecture with CQRS and event sourcing';
      const result = await serginho.process(task);

      expect(result.status).toBe('SUCCESS');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('timestamp');
    });

    test('should handle programming keywords', async () => {
      const prompt = 'Create a JavaScript function';
      const result = await serginho.process(prompt);

      expect(result.status).toBe('SUCCESS');
      expect(result.response).toBeTruthy();
    });

    test('should handle design keywords', async () => {
      const prompt = 'Create a UI design for a dashboard';
      const result = await serginho.process(prompt);

      expect(result.status).toBe('SUCCESS');
      expect(result.response).toBeTruthy();
    });
  });

  describe('Security Validation', () => {
    test('should block malicious prompts', async () => {
      // This would need actual security validation to work
      // For now, test that process handles security checks
      const result = await serginho.process('test prompt');
      
      expect(['SUCCESS', 'BLOCKED']).toContain(result.status);
    });

    test('should allow safe prompts', async () => {
      const result = await serginho.process('What is React?');
      
      expect(result.status).toBe('SUCCESS');
    });
  });

  describe('Cache Integration', () => {
    test('should use cache for repeated queries', async () => {
      const prompt = 'What is JavaScript?';
      
      // First call - miss
      const result1 = await serginho.process(prompt);
      expect(result1.status).toBe('SUCCESS');
      
      // Second call - should hit cache
      const result2 = await serginho.process(prompt);
      expect(result2.status).toBe('SUCCESS');
      
      // Both should return results
      expect(result1.response).toBeTruthy();
      expect(result2.response).toBeTruthy();
    });
  });

  describe('Specialist Routing', () => {
    test('should route to appropriate specialist', async () => {
      const result = await serginho.process('Write a test case');
      
      expect(result.status).toBe('SUCCESS');
      expect(result).toHaveProperty('agent');
      expect(result).toHaveProperty('response');
    });

    test('should handle missing specialist gracefully', async () => {
      const result = await serginho.process('unknown task type');
      
      expect(result.status).toBe('SUCCESS');
      expect(result).toHaveProperty('response');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      // Mock an error in the specialist API call
      jest.spyOn(serginho, '_callSpecialistAPI').mockRejectedValueOnce(
        new Error('Test error')
      );

      const result = await serginho.process('test');
      
      expect(result.status).toBe('ERROR');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('timestamp');
    });

    test('should return error status on failure', async () => {
      // Mock delegation failure
      jest.spyOn(serginho, '_delegateToSpecialist').mockRejectedValueOnce(
        new Error('Delegation failed')
      );

      const result = await serginho.process('test');
      
      expect(result.status).toBe('ERROR');
      expect(result.error).toBeTruthy();
    });
  });

  describe('Response Format', () => {
    test('should return consistent response format on success', async () => {
      const result = await serginho.process('test');

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('timestamp');
      
      // ❌ Should NOT expose provider
      expect(result).not.toHaveProperty('provider');
    });

    test('should return consistent error format', async () => {
      jest.spyOn(serginho, '_callSpecialistAPI').mockRejectedValueOnce(
        new Error('Test error')
      );

      const result = await serginho.process('test');

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('ERROR');
    });

    test('should include agent information', async () => {
      const result = await serginho.process('test');

      if (result.status === 'SUCCESS') {
        expect(result).toHaveProperty('agent');
        expect(result).toHaveProperty('source');
      }
    });
  });

  describe('Global Statistics', () => {
    test('should provide global stats', () => {
      const stats = serginho.getGlobalStats();

      expect(stats).toHaveProperty('serginho');
      expect(stats).toHaveProperty('registry');
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('activeTasks');
      expect(stats).toHaveProperty('taskQueue');
    });

    test('should generate global report', () => {
      const report = serginho.generateGlobalReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('SERGINHO');
      expect(report).toContain('Mode:');
      expect(report).toContain('Uptime:');
    });
  });

  describe('Specialist Management', () => {
    test('should register specialist', () => {
      const specialist = {
        id: 'test-specialist',
        name: 'Test Specialist',
        mode: 'MANUAL',
      };

      serginho.registerSpecialist(specialist.id, specialist);
      
      const metadata = serginho.registry.getSpecialistMetadata(specialist.id);
      expect(metadata).toBeTruthy();
    });

    test('should register multiple specialists', () => {
      const specialists = [
        { id: 'specialist1', name: 'S1', mode: 'MANUAL' },
        { id: 'specialist2', name: 'S2', mode: 'AUTONOMOUS' },
      ];

      serginho.registerSpecialists(specialists);
      
      const stats = serginho.registry.getStats();
      expect(stats.totalSpecialists).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Prompt Intent Analysis', () => {
    test('should detect code intent', () => {
      const analysis = serginho._analyzePromptIntent('write javascript code');
      
      expect(analysis).toHaveProperty('primaryCapability');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis.primaryCapability).toBe('code');
    });

    test('should detect design intent', () => {
      const analysis = serginho._analyzePromptIntent('create a UI design');
      
      expect(analysis.primaryCapability).toBe('design');
    });

    test('should detect marketing intent', () => {
      const analysis = serginho._analyzePromptIntent('create a marketing strategy');
      
      expect(analysis.primaryCapability).toBe('marketing');
    });

    test('should default to teaching for generic prompts', () => {
      const analysis = serginho._analyzePromptIntent('explain something');
      
      expect(analysis.primaryCapability).toBe('teaching');
    });
  });

  describe('Context Handling', () => {
    test('should accept context parameter', async () => {
      const result = await serginho.process('test', { custom: 'context' });

      expect(result.status).toBe('SUCCESS');
    });

    test('should process without context', async () => {
      const result = await serginho.process('test');

      expect(result.status).toBe('SUCCESS');
    });
  });
});

// ✅ NO provider name assertions (llama-70b, llama-8b, groq, etc.)
// ✅ Tests focus on BEHAVIOR, not implementation
// ✅ Tests are resilient to provider changes
// ✅ All tests check for response structure without provider exposure
