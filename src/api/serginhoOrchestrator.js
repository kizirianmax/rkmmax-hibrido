/**
 * SERGINHO CONTEXTUAL ORCHESTRATOR v2.0
 * Single source of truth for ALL LLM requests
 * 
 * Intelligence Tiers:
 * - Llama 3.3 120B: Deep reasoning, complex analysis
 * - Llama 3.3 70B: Technical tasks, coding
 * - Llama 3.1 8B: Casual conversation, quick responses
 */

import { LlamaProvider } from './providers/llama.js';
import { GroqProvider } from './providers/groq.js';

export class SerginhoContextual {
  constructor() {
    // Initialize providers with GROQ_API_KEY (server-side only)
    const apiKey = process.env.GROQ_API_KEY;
    
    // Only require API key in production/non-test environments
    if (!apiKey && process.env.NODE_ENV !== 'test') {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.providers = {
      'llama-120b': new LlamaProvider(apiKey || 'test-key', '120b'),
      'llama-70b': new LlamaProvider(apiKey || 'test-key', '70b'),
      'llama-8b': new LlamaProvider(apiKey || 'test-key', '8b'),
      'groq-fallback': new GroqProvider(apiKey || 'test-key')
    };
    
    // Conversation history (per session)
    this.sessionHistory = new Map();
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      routingDecisions: { '120b': 0, '70b': 0, '8b': 0 },
      avgResponseTime: 0
    };
  }

  /**
   * MAIN ENTRY POINT - All requests flow through here
   */
  async handleRequest(prompt, options = {}) {
    const startTime = Date.now();
    const sessionId = options.sessionId || 'default';
    
    // Get or create session history
    const history = this.sessionHistory.get(sessionId) || [];
    
    // Detect intent shift
    const intent = this.detectIntentShift(history, prompt);
    
    // Update history
    history.push({ prompt, intent, timestamp: startTime });
    this.sessionHistory.set(sessionId, history);
    
    // SPECIAL MODE: Betinho Hybrid (parallel execution)
    if (options.mode === 'betinho-hybrid') {
      return await this.betinhoParallel(prompt, options);
    }
    
    // STANDARD MODE: Intelligent routing
    return await this.intelligentRoute(prompt, intent, options);
  }

  /**
   * Detects conversation intent shift
   * Returns: 'casual' | 'technical' | 'deep'
   */
  detectIntentShift(history, prompt) {
    const promptLower = prompt.toLowerCase();
    
    // CASUAL PATTERNS (Llama 8B)
    const casualPatterns = [
      /^(oi|olá|hey|hi|hello|e aí)/i,
      /^(tudo bem|como vai|how are you)/i,
      /^(obrigad|thanks|thank you)/i,
      /^(tchau|bye|até)/i
    ];
    
    if (casualPatterns.some(p => p.test(prompt))) {
      return 'casual';
    }
    
    // TECHNICAL PATTERNS (Llama 70B)
    const technicalKeywords = [
      'react', 'node', 'javascript', 'python', 'api', 'código',
      'function', 'class', 'component', 'debug', 'error',
      'implementar', 'criar', 'desenvolver'
    ];
    
    if (technicalKeywords.some(k => promptLower.includes(k))) {
      return 'technical';
    }
    
    // DEEP PATTERNS (Llama 120B) - default for safety
    // Complex queries, analysis, architecture, etc.
    return 'deep';
  }

  /**
   * Intelligent routing based on intent
   */
  async intelligentRoute(prompt, intent, options) {
    let provider;
    
    switch(intent) {
      case 'casual':
        provider = 'llama-8b';
        this.metrics.routingDecisions['8b']++;
        break;
      
      case 'technical':
        provider = 'llama-70b';
        this.metrics.routingDecisions['70b']++;
        break;
      
      case 'deep':
      default:
        provider = 'llama-120b';
        this.metrics.routingDecisions['120b']++;
        break;
    }
    
    console.log(`🤖 Serginho routing: ${intent} → ${provider}`);
    
    try {
      return await this.executeWithProvider(provider, prompt, options);
    } catch (error) {
      console.error(`❌ ${provider} failed, attempting fallback...`);
      return await this.fallbackChain(provider, prompt, options);
    }
  }

  /**
   * Betinho Hybrid Mode - Parallel execution for maximum depth
   * Executes 120B + 70B + 8B in parallel, returns first success
   */
  async betinhoParallel(prompt, options) {
    console.log('🔥 Betinho Hybrid Mode: Executing 3 models in parallel...');
    
    const providers = ['llama-120b', 'llama-70b', 'llama-8b'];
    
    // Execute all providers in parallel
    const promises = providers.map(async (provider) => {
      try {
        const result = await this.executeWithProvider(provider, prompt, options);
        return { ...result, source: 'parallel' };
      } catch (error) {
        console.error(`❌ Parallel execution failed for ${provider}`);
        throw error; // Throw to signal failure
      }
    });
    
    try {
      // Return first successful response using Promise.any
      const result = await Promise.any(promises);
      return result;
    } catch (error) {
      // All promises rejected
      throw new Error('All models failed in Betinho Hybrid mode');
    }
  }

  /**
   * Execute request with specific provider
   */
  async executeWithProvider(providerName, prompt, options) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    const startTime = Date.now();
    const result = await provider.generate(prompt, options);
    const duration = Date.now() - startTime;
    
    // Track metrics (increment requests after execution)
    this.metrics.totalRequests++;
    
    // Update average response time using incremental average formula
    // avgNew = (avgOld * (n-1) + newValue) / n
    // This correctly handles the first request (when totalRequests=1)
    const totalTime = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.avgResponseTime = (totalTime + duration) / this.metrics.totalRequests;
    
    return {
      success: true,
      provider: providerName,
      tier: this.getTier(providerName),
      duration,
      result: result.choices[0].message.content,
      usage: result.usage
    };
  }

  /**
   * Fallback chain: 120B → 70B → 8B → Groq
   */
  async fallbackChain(failedProvider, prompt, options, tried = []) {
    const fallbackMap = {
      'llama-120b': ['llama-70b', 'llama-8b', 'groq-fallback'],
      'llama-70b': ['llama-8b', 'groq-fallback'],
      'llama-8b': ['groq-fallback'],
      'groq-fallback': []
    };
    
    const nextProviders = fallbackMap[failedProvider] || [];
    const availableProviders = nextProviders.filter(p => !tried.includes(p));
    
    if (availableProviders.length === 0) {
      throw new Error('All providers failed');
    }
    
    const nextProvider = availableProviders[0];
    console.log(`🔄 Fallback: ${failedProvider} → ${nextProvider}`);
    
    try {
      return await this.executeWithProvider(nextProvider, prompt, options);
    } catch (error) {
      return await this.fallbackChain(
        nextProvider,
        prompt,
        options,
        [...tried, failedProvider]
      );
    }
  }

  /**
   * Get tier name for provider
   */
  getTier(provider) {
    const tierMap = {
      'llama-120b': 'genius',
      'llama-70b': 'expert',
      'llama-8b': 'fast',
      'groq-fallback': 'fallback'
    };
    return tierMap[provider] || 'unknown';
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessionHistory.size
    };
  }
}

// Singleton instance
export const serginho = new SerginhoContextual();
