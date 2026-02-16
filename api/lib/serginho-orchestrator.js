/**
 * SERGINHO ORCHESTRATOR - Central Intelligence Router
 * 
 * ÚNICO ponto de entrada para TODAS as requisições de IA.
 * Coordena providers, fallbacks, circuit breakers, cache.
 * 
 * Features:
 * - Automatic complexity analysis and provider selection
 * - Circuit breaker protection per provider
 * - Automatic fallback chains
 * - Response caching
 * - Metrics tracking
 * 
 * Usage:
 *   const result = await serginho.handleRequest({
 *     message: 'User question',
 *     messages: [], // conversation history
 *     context: {},  // additional context
 *     options: {}   // override options
 *   });
 */

import { analyzeComplexity, routeToProvider, getNextFallback, FALLBACK_CHAIN } from '../../src/utils/intelligentRouter.js';
import CircuitBreaker from './circuit-breaker.js';
import { getProviderConfig, PROVIDERS } from './providers-config.js';

/**
 * Simple in-memory cache
 * In production, consider using Redis or similar
 */
class SimpleCache {
  constructor(ttl = 3600000) { // 1 hour default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Simple metrics tracker
 */
class MetricsTracker {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      providerUsage: {},
      avgResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  recordRequest(provider, responseTime, success = true, fromCache = false) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    if (fromCache) {
      this.metrics.cacheHits++;
    }
    
    if (!this.metrics.providerUsage[provider]) {
      this.metrics.providerUsage[provider] = 0;
    }
    this.metrics.providerUsage[provider]++;
    
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      providerUsage: {},
      avgResponseTime: 0,
      totalResponseTime: 0,
    };
  }
}

/**
 * Serginho Orchestrator Class
 */
class SerginhoOrchestrator {
  constructor() {
    this.circuitBreakers = new Map();
    this.cache = new SimpleCache();
    this.metrics = new MetricsTracker();
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for all providers
   */
  initializeCircuitBreakers() {
    Object.keys(PROVIDERS).forEach(provider => {
      this.circuitBreakers.set(provider, new CircuitBreaker({
        name: provider,
        timeout: 8000, // 8s per provider (safe for 12s serverless limit)
        failureThreshold: 3,
        resetTimeout: 30000, // 30s cooldown
      }));
    });
  }

  /**
   * Handle ANY AI request - Main entry point
   * @param {object} params
   * @param {string} params.message - User message
   * @param {array} params.messages - Full conversation history (optional)
   * @param {object} params.context - Additional context (optional)
   * @param {object} params.options - Override options (optional)
   * @returns {Promise<object>} { text, provider, tier, complexity, stats, ... }
   */
  async handleRequest({ message, messages = [], context = {}, options = {} }) {
    const startTime = Date.now();
    
    // 1. Analyze complexity
    const analysis = analyzeComplexity(message);
    const routing = routeToProvider(analysis);

    console.log('[Serginho] Complexity:', analysis.scores.complexity, '→ Provider:', routing.provider);

    // 2. Try primary provider (or forced provider)
    let triedProviders = [];
    let currentProvider = options.forceProvider || routing.provider;

    while (currentProvider) {
      triedProviders.push(currentProvider);

      try {
        // Check cache first
        const cacheKey = this.getCacheKey(message, currentProvider);
        const cached = this.cache.get(cacheKey);
        if (cached && !options.bypassCache) {
          console.log('[Serginho] Cache hit:', currentProvider);
          const responseTime = Date.now() - startTime;
          this.metrics.recordRequest(currentProvider, responseTime, true, true);
          return { ...cached, fromCache: true, responseTime };
        }

        // Execute with circuit breaker
        const result = await this.executeWithProvider(currentProvider, {
          message,
          messages,
          context,
          analysis,
        });

        // Cache successful response
        this.cache.set(cacheKey, result);

        const responseTime = Date.now() - startTime;
        this.metrics.recordRequest(currentProvider, responseTime, true, false);

        return {
          ...result,
          provider: currentProvider,
          tier: routing.tier,
          complexity: analysis.scores.complexity,
          triedProviders,
          fromCache: false,
          responseTime,
        };

      } catch (error) {
        console.error(`[Serginho] Provider ${currentProvider} failed:`, error.message);
        
        const responseTime = Date.now() - startTime;
        this.metrics.recordRequest(currentProvider, responseTime, false, false);
        
        // Get next fallback
        currentProvider = getNextFallback(currentProvider, triedProviders);
        
        if (!currentProvider) {
          throw new Error(`All providers failed. Tried: ${triedProviders.join(', ')}`);
        }

        console.log('[Serginho] Falling back to:', currentProvider);
      }
    }
  }

  /**
   * Execute request with specific provider
   * @private
   */
  async executeWithProvider(providerName, { message, messages, context, analysis }) {
    const config = getProviderConfig(providerName);
    const breaker = this.circuitBreakers.get(providerName);

    if (!breaker) {
      throw new Error(`Circuit breaker not found for provider: ${providerName}`);
    }

    return breaker.execute(async () => {
      switch (config.type) {
        case 'gemini':
          return this.callGemini(config, message, messages, context);
        case 'groq':
          return this.callGroq(config, message, messages, context);
        case 'openai':
          return this.callOpenAI(config, message, messages, context);
        default:
          throw new Error(`Unknown provider type: ${config.type}`);
      }
    });
  }

  /**
   * Call Gemini API
   * @private
   */
  async callGemini(config, message, messages, context) {
    const formattedMessages = this.formatMessages(messages, message, 'gemini');
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: config.generationConfig,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid Gemini response structure');
    }

    return {
      text: data.candidates[0].content.parts[0].text,
      model: config.model,
      usage: data.usageMetadata || {},
    };
  }

  /**
   * Call Groq API (OpenAI-compatible)
   * @private
   */
  async callGroq(config, message, messages, context) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey && process.env.NODE_ENV !== 'test') {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    const formattedMessages = this.formatMessages(messages, message, 'openai');
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey || 'test-key'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: formattedMessages,
        ...config.defaultParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid Groq response structure');
    }

    return {
      text: data.choices[0].message.content,
      model: config.model,
      usage: data.usage || {},
    };
  }

  /**
   * Call OpenAI API (future support)
   * @private
   */
  async callOpenAI(config, message, messages, context) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const formattedMessages = this.formatMessages(messages, message, 'openai');
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: formattedMessages,
        ...config.defaultParams,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      model: config.model,
      usage: data.usage || {},
    };
  }

  /**
   * Format messages for different API formats
   * @private
   */
  formatMessages(history, newMessage, format) {
    // Gemini format: { role, parts: [{text}] }
    // OpenAI format: { role, content }
    
    const allMessages = [
      ...history,
      { role: 'user', content: newMessage },
    ];
    
    if (format === 'gemini') {
      return allMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));
    } else {
      // OpenAI, Groq, etc.
      return allMessages;
    }
  }

  /**
   * Generate cache key
   * @private
   */
  getCacheKey(message, provider) {
    // Simple cache key - hash of first 100 chars + provider
    return `${provider}:${message.substring(0, 100).replace(/\s+/g, '_')}`;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates() {
    const states = {};
    for (const [provider, breaker] of this.circuitBreakers.entries()) {
      states[provider] = breaker.getState();
    }
    return states;
  }

  /**
   * Reset all circuit breakers (for testing)
   */
  resetCircuitBreakers() {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Clear cache (for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const serginho = new SerginhoOrchestrator();
export { SerginhoOrchestrator };
export default serginho;
