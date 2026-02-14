/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects against serverless function timeouts with automatic failover.
 * Implements a 3-state pattern: CLOSED → OPEN → HALF_OPEN
 * 
 * @class CircuitBreaker
 * @example
 * const breaker = new CircuitBreaker({
 *   timeout: 8000,
 *   failureThreshold: 3,
 *   resetTimeout: 60000,
 *   name: 'my-api'
 * });
 * 
 * const result = await breaker.execute(async () => {
 *   return await callExternalAPI();
 * });
 */
export default class CircuitBreaker {
  /**
   * Creates a new Circuit Breaker instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.timeout=8000] - Timeout in milliseconds (default: 8s for 12s serverless limit)
   * @param {number} [options.failureThreshold=3] - Number of failures before opening circuit
   * @param {number} [options.resetTimeout=60000] - Time in ms before attempting recovery (default: 1 minute)
   * @param {string} [options.name='CircuitBreaker'] - Name for identification in errors
   */
  constructor(options = {}) {
    this.timeout = options.timeout || 8000; // 8s (4s margin for 12s serverless limit)
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.nextAttempt = Date.now();
    this.name = options.name || 'CircuitBreaker';
  }

  /**
   * Executes a function with circuit breaker protection
   * 
   * @param {Function} fn - Async function to execute
   * @returns {Promise<*>} Result of the function
   * @throws {Error} If circuit is OPEN or function fails/times out
   */
  async execute(fn) {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      // Try half-open
      this.state = 'HALF_OPEN';
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Executes a function with timeout protection
   * 
   * @private
   * @param {Function} fn - Function to execute
   * @returns {Promise<*>} Result of the function or timeout error
   */
  async executeWithTimeout(fn) {
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Timeout after ${this.timeout}ms`)),
        this.timeout
      );
    });

    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handles successful execution
   * Resets failure count and closes circuit if in HALF_OPEN state
   * 
   * @private
   */
  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  /**
   * Handles failed execution
   * Increments failure count and opens circuit if threshold is reached
   * In HALF_OPEN state, any failure immediately opens the circuit
   * 
   * @private
   */
  onFailure() {
    this.failures++;
    
    // In HALF_OPEN state, any failure immediately opens the circuit
    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  /**
   * Gets current circuit breaker state
   * 
   * @returns {Object} Current state information
   * @returns {string} state - Current state (CLOSED, OPEN, HALF_OPEN)
   * @returns {number} failures - Number of consecutive failures
   * @returns {number} nextAttempt - Timestamp for next attempt (when in OPEN state)
   */
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.nextAttempt
    };
  }

  /**
   * Manually resets the circuit breaker to initial state
   * Useful for forced recovery or testing
   */
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttempt = Date.now();
  }
}
