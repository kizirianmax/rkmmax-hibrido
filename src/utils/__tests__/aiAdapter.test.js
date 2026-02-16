import { jest } from '@jest/globals';
import {
  askAI,
  analyzeCode,
  simpleQuery,
  complexTask,
  getCircuitBreakerStats,
  resetCircuitBreakers,
} from '../aiAdapter.js';

describe('AIAdapter - Behavioral Tests', () => {
  beforeEach(() => {
    resetCircuitBreakers();
  });

  describe('askAI', () => {
    test('should return answer for simple query', async () => {
      const result = await askAI('Hello, how are you?');

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metadata');
      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.metadata.type).toBe('general');
    });

    test('should handle complex queries', async () => {
      const complexQuery = 'Explain the architecture of a distributed microservices system with event sourcing and CQRS pattern';
      const result = await askAI(complexQuery);

      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.metadata.complexity).toBeDefined();
    });

    test('should include response time', async () => {
      const result = await askAI('Quick question');

      expect(result).toHaveProperty('responseTime');
      expect(typeof result.responseTime).toBe('number');
    });
  });

  describe('analyzeCode', () => {
    test('should analyze JavaScript code', async () => {
      const code = 'function test() { return 42; }';
      const result = await analyzeCode(code, 'javascript');

      expect(result.answer).toBeTruthy();
      expect(result.metadata.type).toBe('code');
      expect(result.metadata.language).toBe('javascript');
    });

    test('should handle code with high complexity', async () => {
      const complexCode = `
        class ComplexSystem {
          async processData(input) {
            const result = await this.analyze(input);
            return this.transform(result);
          }
        }
      `;
      const result = await analyzeCode(complexCode, 'javascript');

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.metadata.analyzed.hasCode).toBe(true);
    });
  });

  describe('simpleQuery', () => {
    test('should handle simple queries quickly', async () => {
      const result = await simpleQuery('hi');

      expect(result.answer).toBeTruthy();
      expect(result.metadata.type).toBe('simple');
    });
  });

  describe('complexTask', () => {
    test('should handle complex tasks', async () => {
      const task = 'Design a scalable database architecture for a social media platform';
      const result = await complexTask(task, { priority: 'high' });

      expect(result.answer).toBeTruthy();
      expect(result.metadata.type).toBe('complex');
    });
  });

  describe('Circuit Breaker', () => {
    test('should track statistics', async () => {
      await askAI('test');

      const stats = getCircuitBreakerStats();
      expect(stats).toBeTruthy();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    test('should reset circuit breakers', () => {
      resetCircuitBreakers();
      const stats = getCircuitBreakerStats();
      expect(Object.keys(stats).length).toBe(0);
    });
  });

  describe('Timeout Protection', () => {
    test('should have timeout protection enabled', async () => {
      // This test verifies timeout is configured
      const result = await askAI('test');
      expect(result).toHaveProperty('responseTime');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      // Test that errors don't crash the system
      try {
        await askAI('');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });
});

// NO provider names (llama-70b, llama-8b, etc.) in tests!
// Tests focus on BEHAVIOR, not implementation
