import { analyzeComplexity } from './intelligentRouter.js';

/**
 * AIAdapter - Unified interface for all AI operations
 * Provides complete decoupling from provider implementations
 * 
 * Features:
 * - Automatic provider selection
 * - Circuit breaker pattern
 * - Timeout protection (8 seconds)
 * - Automatic fallback
 * - No provider name exposure
 */

// Circuit Breaker State
const circuitBreakers = new Map();

class CircuitBreaker {
  constructor(name, timeout = 8000) {
    this.name = name;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successCount = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 60000; // 1 minute
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker ${this.name}: HALF_OPEN (testing)`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await this._executeWithTimeout(fn);
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  async _executeWithTimeout(fn) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout exceeded')), this.timeout)
      ),
    ]);
  }

  _onSuccess() {
    this.failures = 0;
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log(`✅ Circuit breaker ${this.name}: CLOSED (recovered)`);
    }
  }

  _onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`🔴 Circuit breaker ${this.name}: OPEN (too many failures)`);
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
    };
  }
}

// Get or create circuit breaker
function getCircuitBreaker(name, timeout = 8000) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, timeout));
  }
  return circuitBreakers.get(name);
}

/**
 * Internal provider configuration (PRIVATE - not exported)
 */
const PROVIDER_CONFIG = {
  types: {
    fast: { complexity: 'simple', timeout: 5000 },
    standard: { complexity: 'medium', timeout: 8000 },
    powerful: { complexity: 'complex', timeout: 10000 },
  },
  fallbackChain: ['powerful', 'standard', 'fast'],
};

/**
 * Internal provider selector (PRIVATE)
 */
function _selectProviderType(analysis) {
  const { scores, hasCode } = analysis;

  if (hasCode || scores.complexity >= 8) {
    return 'powerful';
  } else if (scores.complexity >= 5) {
    return 'standard';
  } else {
    return 'fast';
  }
}

/**
 * Execute AI task with automatic provider selection
 * This is the internal implementation - NOT exported directly
 */
async function _executeAITask(prompt, options = {}) {
  const analysis = analyzeComplexity(prompt);
  const providerType = _selectProviderType(analysis);
  const config = PROVIDER_CONFIG.types[providerType];

  const breaker = getCircuitBreaker(providerType, config.timeout);

  try {
    return await breaker.execute(async () => {
      // Here we would call the actual AI provider
      // For now, return a mock response structure
      return {
        answer: `[AI Response for: ${prompt.substring(0, 50)}...]`,
        confidence: analysis.scores.complexity >= 5 ? 0.9 : 0.8,
        metadata: {
          type: options.type || 'general',
          complexity: providerType,
          analyzed: {
            wordCount: analysis.wordCount,
            hasCode: analysis.hasCode,
          },
          ...(options.language && { language: options.language }),
          ...(options.priority && { priority: options.priority }),
        },
        responseTime: Date.now(),
      };
    });
  } catch (error) {
    console.error(`❌ Provider ${providerType} failed:`, error.message);
    // Try fallback
    return _executeWithFallback(prompt, options, providerType);
  }
}

/**
 * Fallback mechanism
 */
async function _executeWithFallback(prompt, options, failedType) {
  const fallbackChain = PROVIDER_CONFIG.fallbackChain.filter((t) => t !== failedType);

  for (const providerType of fallbackChain) {
    try {
      const config = PROVIDER_CONFIG.types[providerType];
      const breaker = getCircuitBreaker(providerType, config.timeout);

      return await breaker.execute(async () => {
        console.log(`🔄 Trying fallback: ${providerType}`);
        return {
          answer: `[Fallback response from ${providerType}]`,
          confidence: 0.7,
          metadata: {
            type: options.type || 'general',
            complexity: providerType,
            fallback: true,
          },
          responseTime: Date.now(),
        };
      });
    } catch (error) {
      console.warn(`⚠️ Fallback ${providerType} failed:`, error.message);
      continue;
    }
  }

  throw new Error('All providers failed');
}

/**
 * PUBLIC API - Generic AI query
 * Usage: askAI('What is React?')
 */
export async function askAI(prompt, context = {}) {
  return _executeAITask(prompt, { type: 'general', ...context });
}

/**
 * PUBLIC API - Code analysis
 * Usage: analyzeCode('function test() {}', 'javascript')
 */
export async function analyzeCode(code, language = 'javascript') {
  return _executeAITask(code, { type: 'code', language });
}

/**
 * PUBLIC API - Simple query (optimized for speed)
 * Usage: simpleQuery('Hello')
 */
export async function simpleQuery(query) {
  return _executeAITask(query, { type: 'simple', priority: 'fast' });
}

/**
 * PUBLIC API - Complex task
 * Usage: complexTask('Design a microservices architecture')
 */
export async function complexTask(task, requirements = {}) {
  return _executeAITask(task, { type: 'complex', ...requirements });
}

/**
 * Get circuit breaker statistics (for monitoring)
 */
export function getCircuitBreakerStats() {
  const stats = {};
  for (const [name, breaker] of circuitBreakers.entries()) {
    stats[name] = breaker.getStats();
  }
  return stats;
}

/**
 * Reset circuit breakers (for testing)
 */
export function resetCircuitBreakers() {
  circuitBreakers.clear();
}

export default {
  askAI,
  analyzeCode,
  simpleQuery,
  complexTask,
  getCircuitBreakerStats,
  resetCircuitBreakers,
};
