/**
 * Tests for Circuit Breaker functionality
 */

import { CircuitBreaker } from '../lib/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-breaker', {
      timeout: 1000,
      threshold: 2,
      resetTimeout: 5000,
    });
  });

  test('should execute function successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await breaker.execute(mockFn);
    
    expect(result).toBe('success');
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.successCount).toBe(1);
  });

  test('should timeout if function takes too long', async () => {
    const slowFn = () => new Promise(resolve => setTimeout(() => resolve('done'), 2000));
    
    await expect(breaker.execute(slowFn)).rejects.toThrow('Timeout after 1000ms');
    expect(breaker.failures).toBe(1);
  });

  test('should open circuit after threshold failures', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // First failure
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    expect(breaker.state).toBe('CLOSED');
    
    // Second failure - should open circuit
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    expect(breaker.state).toBe('OPEN');
  });

  test('should use fallback when circuit is open', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
    const fallbackFn = jest.fn().mockResolvedValue('fallback-result');
    
    // Open the circuit
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    expect(breaker.state).toBe('OPEN');
    
    // Should use fallback
    const result = await breaker.execute(failingFn, fallbackFn);
    expect(result).toBe('fallback-result');
    expect(fallbackFn).toHaveBeenCalled();
  });

  test('should return correct stats', () => {
    const stats = breaker.getStats();
    
    expect(stats).toHaveProperty('name', 'test-breaker');
    expect(stats).toHaveProperty('state', 'CLOSED');
    expect(stats).toHaveProperty('failures', 0);
    expect(stats).toHaveProperty('successCount', 0);
    expect(stats).toHaveProperty('totalCalls', 0);
    expect(stats).toHaveProperty('successRate');
  });

  test('should reset circuit correctly', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    expect(breaker.state).toBe('OPEN');
    
    // Reset
    breaker.reset();
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failures).toBe(0);
  });
});
