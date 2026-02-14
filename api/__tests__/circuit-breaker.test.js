import CircuitBreaker from '../lib/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      timeout: 100,
      failureThreshold: 2,
      resetTimeout: 200,
      name: 'test-breaker'
    });
  });

  describe('CLOSED state', () => {
    test('executes function successfully', async () => {
      const fn = async () => 'success';
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
      expect(breaker.getState().state).toBe('CLOSED');
    });

    test('handles timeout', async () => {
      const fn = () => new Promise(resolve => setTimeout(() => resolve('late'), 200));
      await expect(breaker.execute(fn)).rejects.toThrow('Timeout after 100ms');
    });

    test('tracks failures', async () => {
      const fn = async () => {
        throw new Error('fail');
      };
      
      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState().failures).toBe(1);
      
      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState().state).toBe('OPEN');
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      const fn = async () => {
        throw new Error('fail');
      };
      await expect(breaker.execute(fn)).rejects.toThrow();
      await expect(breaker.execute(fn)).rejects.toThrow();
    });

    test('rejects immediately without calling function', async () => {
      let called = false;
      const fn = async () => {
        called = true;
        return 'success';
      };
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker test-breaker is OPEN');
      expect(called).toBe(false);
    });

    test('transitions to HALF_OPEN after reset timeout', async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const fn = async () => 'success';
      const result = await breaker.execute(fn);
      
      expect(result).toBe('success');
      expect(breaker.getState().state).toBe('CLOSED');
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      const fn = async () => {
        throw new Error('fail');
      };
      await expect(breaker.execute(fn)).rejects.toThrow();
      await expect(breaker.execute(fn)).rejects.toThrow();
      await new Promise(resolve => setTimeout(resolve, 250));
    });

    test('transitions to CLOSED on success', async () => {
      const fn = async () => 'success';
      await breaker.execute(fn);
      expect(breaker.getState().state).toBe('CLOSED');
    });

    test('transitions back to OPEN on failure', async () => {
      const fn = async () => {
        throw new Error('fail');
      };
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState().state).toBe('OPEN');
    });
  });

  describe('reset()', () => {
    test('resets circuit to initial state', async () => {
      const fn = async () => {
        throw new Error('fail');
      };
      await expect(breaker.execute(fn)).rejects.toThrow();
      
      breaker.reset();
      
      expect(breaker.getState().state).toBe('CLOSED');
      expect(breaker.getState().failures).toBe(0);
    });
  });

  describe('getState()', () => {
    test('returns current state information', () => {
      const state = breaker.getState();
      expect(state).toHaveProperty('state');
      expect(state).toHaveProperty('failures');
      expect(state).toHaveProperty('nextAttempt');
    });
  });
});
