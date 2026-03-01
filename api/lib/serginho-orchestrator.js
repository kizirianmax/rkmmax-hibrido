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
 * - ✨ NOVO: Metadata estruturada de transparência
 * 
 * Usage:
 *   const result = await serginho.handleRequest({
 *     message: 'User question',
 *     messages: [], // conversation history
 *     context: {},  // additional context
 *     options: {}   // override options
 *   });
 */

import { randomUUID } from 'crypto';
import { analyzeComplexity, routeToProvider, getNextFallback, FALLBACK_CHAIN } from '../../src/utils/intelligentRouter.js';
import CircuitBreaker from './circuit-breaker.js';
import { getProviderConfig, getModelMetadata, PROVIDERS } from './providers-config.js';
import modelRegistry from './model-registry.js';

// Versão do orquestrador (para versionamento de schema)
const ORCHESTRATOR_VERSION = '2.1.0';
const METADATA_SCHEMA_VERSION = '1.0.0';

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

  size() {
    return this.cache.size;
  }
}

/**
 * Metrics Tracker
 */
class MetricsTracker {
  constructor() {
    this.reset();
  }

  recordRequest(provider, responseTime, success, fromCache) {
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
    this.modelRegistry = modelRegistry;
    this.initializeCircuitBreakers();
    this._registerModels();
  }

  /**
   * Register all models in ModelRegistry with tier and cost info
   * @private
   */
  _registerModels() {
    // Groq models (complex tier)
    this.modelRegistry.registerModel('llama-3.3-70b-versatile', 'complex', 0.00);
    this.modelRegistry.registerModel('llama-3.1-70b-versatile', 'complex', 0.00);
    this.modelRegistry.registerModel('llama-3.1-8b-instant', 'simple', 0.00);
    this.modelRegistry.registerModel('mixtral-8x7b-32768', 'simple', 0.00);
    
    // Gemini models
    this.modelRegistry.registerModel('gemini-2.0-flash-exp', 'complex', 0.0001);
    
    // OpenAI models
    this.modelRegistry.registerModel('gpt-4o-mini', 'simple', 0.0002);
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
   * Handle ANY AI request - Main entry point (UNIFIED INTERFACE)
   * Supports both string and object signatures for compatibility:
   * - handleRequest('message', options) → string signature
   * - handleRequest({ message, messages, context, options }) → object signature
   * 
   * @param {string|object} firstArg - User message (string) OR full params object
   * @param {object} secondArg - Options (when firstArg is string)
   * @returns {Promise<object>} { text, model, execution, routing, usage, _meta }
   */
  async handleRequest(firstArg, secondArg = {}) {
    // Unified interface: support both string and object signatures
    if (typeof firstArg === 'string') {
      return this._handleStructured({ message: firstArg, options: secondArg });
    }
    return this._handleStructured(firstArg);
  }

  /**
   * Internal structured handler (original handleRequest logic)
   * ✨ NOVO: Retorna metadata estruturada completa
   * 
   * @private
   * @param {object} params
   * @param {string} params.message - User message
   * @param {array} params.messages - Full conversation history (optional)
   * @param {object} params.context - Additional context (optional)
   * @param {object} params.options - Override options (optional)
   * @returns {Promise<object>} { text, model, execution, routing, usage, _meta }
   */
  async _handleStructured({ message, messages = [], context = {}, options = {} }) {
    const orchestrationStartTime = Date.now();
    const traceId = randomUUID();
    
    // 1. Analyze complexity
    const analysisStartTime = Date.now();
    const analysis = analyzeComplexity(message);
    const routing = routeToProvider(analysis);
    const analysisTime = Date.now() - analysisStartTime;

    console.log('[Serginho] Complexity:', analysis.scores.complexity, '→ Provider:', routing.provider);
    console.log('[Serginho] Trace ID:', traceId);

    // 2. Try primary provider (or forced provider)
    let attemptedModels = [];
    let warnings = [];
    let currentProvider = options.forceProvider || routing.provider;
    let fallbackLevel = 0;

    while (currentProvider) {
      try {
        // Check cache first
        const cacheCheckStartTime = Date.now();
        const cacheKey = this.getCacheKey(message, currentProvider);
        const cached = this.cache.get(cacheKey);
        const cacheCheckTime = Date.now() - cacheCheckStartTime;
        
        if (cached && !options.bypassCache) {
          console.log('[Serginho] Cache hit:', currentProvider);
          const totalOrchestrationTime = Date.now() - orchestrationStartTime;
          this.metrics.recordRequest(currentProvider, totalOrchestrationTime, true, true);
          
          // ✨ NOVO: Retornar metadata estruturada do cache
          return this._buildCachedResponse(
            cached,
            currentProvider,
            traceId,
            totalOrchestrationTime,
            analysis,
            routing,
            options
          );
        }

        // Execute with circuit breaker
        const modelExecutionStartTime = Date.now();
        const result = await this.executeWithProvider(currentProvider, {
          message,
          messages,
          context,
          analysis,
        });
        const modelExecutionTime = Date.now() - modelExecutionStartTime;

        // Record successful attempt
        const modelId = result.model || getProviderConfig(currentProvider).model;
        attemptedModels.push({
          modelId,
          status: 'success',
          executionTime: modelExecutionTime,
          fallbackLevel
        });
        
        // ✨ NOVO: Registrar execução no ModelRegistry
        this.modelRegistry.recordExecution(modelId, true, modelExecutionTime, false);

        // Cache successful response
        this.cache.set(cacheKey, result);

        const totalOrchestrationTime = Date.now() - orchestrationStartTime;
        this.metrics.recordRequest(currentProvider, totalOrchestrationTime, true, false);

        // ✨ NOVO: Retornar metadata estruturada completa
        return this._buildSuccessResponse(
          result,
          currentProvider,
          traceId,
          orchestrationStartTime,
          modelExecutionTime,
          totalOrchestrationTime,
          analysis,
          routing,
          attemptedModels,
          warnings,
          fallbackLevel,
          options
        );

      } catch (error) {
        console.error(`[Serginho] Provider ${currentProvider} failed:`, error.message);
        
        const modelExecutionTime = Date.now() - orchestrationStartTime;
        
        // Record failed attempt
        const modelId = getProviderConfig(currentProvider)?.model || currentProvider;
        const isTimeout = error.message?.includes('timeout') || error.message?.includes('timed out');
        
        attemptedModels.push({
          modelId,
          status: 'failed',
          executionTime: modelExecutionTime,
          fallbackLevel,
          error: error.message
        });
        
        // ✨ NOVO: Registrar falha no ModelRegistry
        this.modelRegistry.recordExecution(modelId, false, 0, isTimeout);
        
        this.metrics.recordRequest(currentProvider, modelExecutionTime, false, false);
        
        // Get next fallback
        const nextProvider = getNextFallback(currentProvider, attemptedModels.map(a => a.modelId));
        
        if (!nextProvider) {
          throw new Error(`All providers failed. Tried: ${attemptedModels.map(a => a.modelId).join(', ')}`);
        }

        // Add warning about fallback
        warnings.push({
          code: 'PROVIDER_FALLBACK',
          message: `${currentProvider} failed, falling back to ${nextProvider}`,
          severity: 'warning',
          timestamp: new Date().toISOString()
        });

        console.log('[Serginho] Falling back to:', nextProvider);
        currentProvider = nextProvider;
        fallbackLevel++;
      }
    }
  }

  /**
   * ✨ NOVO: Build structured success response with full metadata
   * @private
   */
  _buildSuccessResponse(
    result,
    providerName,
    traceId,
    orchestrationStartTime,
    modelExecutionTime,
    totalOrchestrationTime,
    analysis,
    routing,
    attemptedModels,
    warnings,
    fallbackLevel,
    options
  ) {
    const config = getProviderConfig(providerName);
    const metadata = getModelMetadata(providerName);
    const circuitBreakerStates = this._getCircuitBreakerStates();

    return {
      // ✨ NOVO: Schema metadata
      _meta: {
        schemaVersion: METADATA_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        traceId,
        orchestratorVersion: ORCHESTRATOR_VERSION
      },

      // ✅ OBRIGATÓRIO: Resposta do modelo
      text: result.text,

      // ✅ OBRIGATÓRIO: Identificação do modelo (separação conceitual clara)
      model: {
        infrastructure: metadata.infrastructure,
        modelId: config.model,
        logicalTier: metadata.logicalTier,
        displayName: metadata.displayName,
        description: metadata.description,
        icon: metadata.icon
      },

      // ✅ OBRIGATÓRIO: Métricas de execução
      execution: {
        status: fallbackLevel > 0 ? 'fallback' : 'success',
        fallbackLevel,
        modelExecutionTime,
        totalOrchestrationTime,
        attemptedModels,
        circuitBreakerStates,
        warnings
      },

      // ✅ OBRIGATÓRIO: Contexto de roteamento
      routing: {
        analyzedComplexity: analysis.scores.complexity,
        selectedTier: routing.tier,
        routingReason: options.forceProvider ? 'forced' : 'auto',
        decisionContext: {
          complexityScore: analysis.scores.complexity,
          technicalKeywords: analysis.keywords?.technical || [],
          messageLength: analysis.messageLength || 0,
          forcedProvider: options.forceProvider || null
        },
        cacheHit: false
      },

      // ✅ OBRIGATÓRIO: Informações de uso
      usage: result.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * ✨ NOVO: Build cached response with preserved metadata
   * @private
   */
  _buildCachedResponse(
    cached,
    providerName,
    traceId,
    totalOrchestrationTime,
    analysis,
    routing,
    options
  ) {
    const config = getProviderConfig(providerName);
    const metadata = getModelMetadata(providerName);
    const circuitBreakerStates = this._getCircuitBreakerStates();

    return {
      // ✨ NOVO: Schema metadata
      _meta: {
        schemaVersion: METADATA_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        traceId,
        orchestratorVersion: ORCHESTRATOR_VERSION
      },

      // ✅ OBRIGATÓRIO: Resposta do modelo (do cache)
      text: cached.text,

      // ✅ OBRIGATÓRIO: Identificação do modelo (preservada do cache)
      model: {
        infrastructure: metadata.infrastructure,
        modelId: config.model,
        logicalTier: metadata.logicalTier,
        displayName: metadata.displayName,
        description: metadata.description,
        icon: metadata.icon
      },

      // ✅ OBRIGATÓRIO: Métricas de execução (cache)
      execution: {
        status: 'cached',
        fallbackLevel: 0,
        modelExecutionTime: 0, // Cache não executa modelo
        totalOrchestrationTime,
        attemptedModels: [{
          modelId: config.model,
          status: 'cached',
          executionTime: 0,
          fallbackLevel: 0
        }],
        circuitBreakerStates,
        warnings: []
      },

      // ✅ OBRIGATÓRIO: Contexto de roteamento
      routing: {
        analyzedComplexity: analysis.scores.complexity,
        selectedTier: routing.tier,
        routingReason: options.forceProvider ? 'forced' : 'auto',
        decisionContext: {
          complexityScore: analysis.scores.complexity,
          technicalKeywords: analysis.keywords?.technical || [],
          messageLength: analysis.messageLength || 0,
          forcedProvider: options.forceProvider || null
        },
        cacheHit: true
      },

      // ✅ OBRIGATÓRIO: Informações de uso (preservadas do cache)
      usage: cached.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * ✨ NOVO: Get circuit breaker states for all providers
   * @private
   */
  _getCircuitBreakerStates() {
    const states = {};
    this.circuitBreakers.forEach((breaker, providerName) => {
      states[providerName] = breaker.getState(); // 'closed' | 'open' | 'half-open'
    });
    return states;
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
   * Generate cache key
   * @private
   */
  getCacheKey(message, provider) {
    // Simple hash - in production, use better hashing
    return `${provider}:${message.substring(0, 100)}`;
  }

  /**
   * Call Gemini API
   * @private
   */
  async callGemini(config, message, messages, context) {
    const formattedMessages = this.formatMessages(messages, message, 'gemini');
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
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
  formatMessages(messages, currentMessage, format) {
    const allMessages = [
      ...messages,
      { role: 'user', content: currentMessage }
    ];

    if (format === 'gemini') {
      return allMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }

    // OpenAI/Groq format
    return allMessages;
  }

  // =========================================================
  // MÓDULO: routeByIntent (migrado de SerginhoContextual v2.0)
  // Roteamento por intenção conversacional (casual/technical/deep)
  // Compatível com Multi-Orch v2.1.0 – sem estado global
  // =========================================================

  /**
   * Detecta intenção conversacional do prompt.
   * @param {string} prompt
   * @returns {'casual'|'technical'|'deep'}
   */
  detectIntentShift(prompt) {
    const casualPatterns = [
      /^(oi|olá|hey|hi|hello|e aí)/i,
      /^(tudo bem|como vai|how are you)/i,
      /^(obrigad|thanks|thank you)/i,
      /^(tchau|bye|até)/i,
    ];
    if (casualPatterns.some((p) => p.test(prompt))) return 'casual';

    const technicalKeywords = [
      'react', 'node', 'javascript', 'python', 'api', 'código',
      'function', 'class', 'component', 'debug', 'error',
      'implementar', 'criar', 'desenvolver',
    ];
    const lower = prompt.toLowerCase();
    if (technicalKeywords.some((k) => lower.includes(k))) return 'technical';

    return 'deep';
  }

  /**
   * Roteia a requisição com base na intenção conversacional.
   * Mapeia intenção → tier do ModelRegistry:
   *   casual    → 'simple'
   *   technical → 'complex'
   *   deep      → 'complex'
   *
   * @param {string} message
   * @param {object} [options={}]
   * @returns {Promise<object>} Resposta estruturada do handleRequest
   */
  async routeByIntent(message, options = {}) {
    const intent = this.detectIntentShift(message);
    const intentToTier = { casual: 'simple', technical: 'complex', deep: 'complex' };
    const tier = intentToTier[intent] || 'complex';

    console.log(`[Serginho] routeByIntent: ${intent} → tier:${tier}`);

    return this.handleRequest({
      message,
      messages: options.messages || [],
      context: { ...options.context, intentTier: tier, intent },
      options: { ...options, _intentRouting: intent },
    });
  }

  // =========================================================
  // MÓDULO: betinhoParallel (migrado de SerginhoContextual v2.0)
  // Execução paralela dos providers disponíveis (Promise.any)
  // Compatível com Multi-Orch v2.1.0 – sem estado global
  // =========================================================

  /**
   * Modo Betinho Hybrid: executa múltiplos providers em paralelo
   * e retorna o primeiro que responder com sucesso.
   *
   * @param {string} message
   * @param {object} [options={}]
   * @returns {Promise<object>} Resposta estruturada do provider mais rápido
   */
  async betinhoParallel(message, options = {}) {
    console.log('[Serginho] betinhoParallel: disparando providers em paralelo...');

    const providers = Object.keys(PROVIDERS);
    if (providers.length === 0) {
      throw new Error('betinhoParallel: nenhum provider configurado');
    }

    const promises = providers.map((provider) =>
      this.handleRequest({
        message,
        messages: options.messages || [],
        context: options.context || {},
        options: { ...options, forceProvider: provider },
      })
    );

    try {
      const result = await Promise.any(promises);
      return { ...result, _betinhoParallel: true, source: 'parallel' };
    } catch {
      throw new Error('betinhoParallel: todos os providers falharam');
    }
  }

  // =========================================================
  // MÓDULO: delegateSpecialists (migrado de Serginho.js v1)
  // Roteamento por capacidade para especialistas registrados
  // Compatível com Multi-Orch v2.1.0 – sem estado global
  // =========================================================

  /**
   * Mapa de palavras-chave → capacidade de especialista.
   * @private
   */
  _getSpecialistIntentMap() {
    return {
      'código|programação|javascript|python|java|typescript|react|node': 'code',
      'design|ui|ux|interface|visual|layout|css': 'design',
      'marketing|vendas|negócio|estratégia|campanha': 'marketing',
      'dados|análise|estatística|gráfico|dashboard|data': 'data-analysis',
      'segurança|vulnerabilidade|criptografia|pentest': 'security',
      'performance|otimização|velocidade|cache|latência': 'performance',
      'acessibilidade|wcag|a11y|aria': 'accessibility',
      'documentação|escrita|conteúdo|artigo|relatório': 'technical-writing',
    };
  }

  /**
   * Analisa o prompt e retorna a capacidade primária do especialista.
   * @param {string} prompt
   * @returns {{ primaryCapability: string, confidence: number }}
   */
  analyzeSpecialistIntent(prompt) {
    const intentMap = this._getSpecialistIntentMap();
    for (const [keywords, capability] of Object.entries(intentMap)) {
      if (new RegExp(keywords, 'i').test(prompt)) {
        return { primaryCapability: capability, confidence: 0.8 };
      }
    }
    return { primaryCapability: 'teaching', confidence: 0.5 };
  }

  /**
   * Delega a requisição para o especialista mais adequado.
   * Recebe um mapa de especialistas no formato:
   *   { [id]: { id, name, category, systemPrompt, capabilities: string[] } }
   *
   * @param {string} message
   * @param {object} specialistsMap - Mapa de especialistas disponíveis
   * @param {object} [options={}]
   * @returns {Promise<object>} Resposta estruturada com metadado do especialista
   */
  async delegateSpecialists(message, specialistsMap = {}, options = {}) {
    const { primaryCapability } = this.analyzeSpecialistIntent(message);

    // Encontrar especialistas com a capacidade necessária
    const candidates = Object.values(specialistsMap).filter(
      (s) => Array.isArray(s.capabilities) && s.capabilities.includes(primaryCapability)
    );

    // Fallback para o primeiro especialista disponível
    const selected = candidates[0] || Object.values(specialistsMap)[0];

    if (!selected) {
      // Sem especialistas → delegar ao orquestrador diretamente
      console.log('[Serginho] delegateSpecialists: sem especialistas, usando orquestrador direto');
      return this.handleRequest({ message, messages: options.messages || [], context: options.context || {}, options });
    }

    console.log(`[Serginho] delegateSpecialists: capability=${primaryCapability} → specialist=${selected.id}`);

    return this.handleRequest({
      message,
      messages: options.messages || [],
      context: { ...options.context, specialistId: selected.id },
      options: {
        ...options,
        systemPrompt: selected.systemPrompt || options.systemPrompt,
        sessionId: `specialist-${selected.id}-${options.sessionId || 'default'}`,
      },
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics.reset();
  }

  /**
   * Reset all circuit breakers (for testing)
   */
  resetCircuitBreakers() {
    this.circuitBreakers.forEach((breaker) => {
      breaker.reset();
    });
  }

  /**
   * ✨ NOVO: Get Model Registry snapshot (for debugging)
   * Returns complete performance stats for all models
   * 
   * @returns {object} Registry snapshot with all model stats
   */
  getModelRegistrySnapshot() {
    return this.modelRegistry.getSnapshot();
  }

  /**
   * ✨ NOVO: Get health scores for all models in a tier
   * Useful for debugging adaptive routing decisions
   * 
   * @param {string} tier - Tier name ('simple' | 'complex')
   * @returns {array} Models with health scores
   */
  getModelHealthScores(tier) {
    const models = this.modelRegistry.getModelsByTier(tier);
    return models.map(model => ({
      modelId: model.modelId,
      healthScore: model.healthScore,
      consistency: model.consistency,
      stability: model.stability,
      confidence: model.confidence,
      totalCalls: model.totalCalls,
      successRate: model.totalCalls > 0 ? (model.successCount / model.totalCalls) : 0,
      averageExecutionTime: model.averageExecutionTime,
      circuitBreakerState: this.modelRegistry.getCircuitBreakerState(model.modelId)
    })).sort((a, b) => b.healthScore - a.healthScore);
  }
}

// Export singleton instance
export default new SerginhoOrchestrator();
