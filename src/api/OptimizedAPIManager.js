/**
 * OPTIMIZED API MANAGER
 *
 * Arquitetura otimizada para Groq apenas:
 * 1. openai/gpt-oss-120b (Principal - raciocínio 120B)
 * 2. llama-3.3-70b-versatile (Fallback - velocidade 70B)
 * 3. mixtral-8x7b-32768 (Fallback secundário - contexto longo)
 *
 * Estratégia:
 * - Groq 120b para tarefas complexas/críticas
 * - Groq Llama 70B para fallback automático
 * - Groq Mixtral para contexto longo
 *
 * ⚠️ SEGURANÇA: Usa SecretManager para injetar credenciais
 */

import secretManager from "./SecretManager";

class OptimizedAPIManager {
  constructor(config = {}) {
    // 🔐 INICIALIZAR SECRET MANAGER
    if (!secretManager.initialized) {
      secretManager.initialize();
    }

    this.config = {
      // 🔐 USAR SECRET MANAGER EM VEZ DE PROCESS.ENV DIRETO
      groqKey: secretManager.getSecret("groq"),
      ...config,
    };

    this.providers = {
      groq: this.initGroq(),
    };

    this.cache = new Map();
    this.rateLimits = {
      groq: { calls: 0, resetTime: Date.now() + 60000 },
    };

    this.stats = {
      totalCalls: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fallbacks: 0,
    };
  }

  /**
   * INICIALIZAR GROQ
   * 🔐 SEGURO: Usa SecretManager para obter API key
   */
  initGroq() {
    // 🔐 OBTER CHAVE DO SECRET MANAGER
    const apiKey = this.config.groqKey || secretManager.getSecret("groq") || "";

    return {
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      isConfigured: !!apiKey,
      models: {
        'openai/gpt-oss-120b': {
          maxTokens: 8000,
          costPer1kTokens: 0.00027,
          description: "Modelo principal com raciocínio (120B params)",
          priority: 1,
          tier: "primary",
        },
        "llama-3.3-70b-versatile": {
          maxTokens: 8000,
          costPer1kTokens: 0.00015,
          description: "Fallback rápido e eficiente (70B params)",
          priority: 2,
          tier: "fallback",
        },
        "mixtral-8x7b-32768": {
          maxTokens: 32768,
          costPer1kTokens: 0.00024,
          description: "Fallback secundário para contexto longo",
          priority: 3,
          tier: "fallback",
        },
      },
      defaultModel: 'openai/gpt-oss-120b',  // Modelo principal
      fallbackModel: 'llama-3.3-70b-versatile',  // Fallback automático
    };
  }

  /**
   * SELECIONAR MODELO IDEAL
   * Sistema usa apenas Groq com fallback automático
   */
  selectModel(complexity = "simple", options = {}) {
    // Sempre usar Groq
    const provider = 'groq';
    
    // Selecionar modelo baseado na complexidade
    let model;
    if (complexity === 'complex' || complexity === 'high' || complexity === 'critical') {
      model = 'openai/gpt-oss-120b';  // Modelo principal
    } else {
      model = 'llama-3.3-70b-versatile';  // Modelo rápido
    }

    return {
      provider,
      model,
      tier: complexity === 'complex' || complexity === 'critical' ? 'primary' : 'fallback',
    };
  }

  /**
   * CHAMAR API COM FALLBACK AUTOMÁTICO
   */
  async callWithFallback(prompt, options = {}) {
    const complexity = options.complexity || "simple";
    const maxRetries = options.maxRetries || 2;

    // Tentar Groq com modelo principal
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const selection = this.selectModel(complexity, options);
        
        console.log(`🚀 [API] Tentativa ${attempt + 1}: ${selection.model}`);

        const result = await this.call(selection.provider, prompt, {
          ...options,
          model: selection.model,
        });

        return {
          success: true,
          provider: selection.provider,
          model: selection.model,
          result,
          attempt: attempt + 1,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.warn(`❌ [API] Tentativa ${attempt + 1} falhou:`, error.message);

        if (attempt === maxRetries - 1) {
          // Última tentativa falhou, tentar fallback explícito
          try {
            console.log("⚠️ [API] Usando fallback: llama-3.3-70b-versatile");
            
            const result = await this.call("groq", prompt, {
              ...options,
              model: 'llama-3.3-70b-versatile',
            });

            return {
              success: true,
              provider: "groq",
              model: 'llama-3.3-70b-versatile',
              result,
              fallback: true,
              timestamp: new Date().toISOString(),
            };
          } catch (fallbackError) {
            console.error("🔴 [API] Todos os modelos falharam");
            return {
              success: false,
              errors: [
                { model: 'openai/gpt-oss-120b', error: error.message },
                { model: 'llama-3.3-70b-versatile', error: fallbackError.message },
              ],
              timestamp: new Date().toISOString(),
            };
          }
        }
      }
    }
  }

  /**
   * CHAMAR API ESPECÍFICA
   */
  async call(provider, prompt, options = {}) {
    // Verificar cache
    const cacheKey = `${provider}:${options.model || "default"}:${prompt}`;
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    this.stats.cacheMisses++;

    // Verificar rate limit
    if (!this.checkRateLimit(provider)) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    }

    let result;

    // Apenas Groq é suportado
    if (provider === 'groq') {
      result = await this.callGroq(prompt, options);
    } else {
      throw new Error(`Unknown provider: ${provider}. Only 'groq' is supported.`);
    }

    // Cachear resultado
    this.cache.set(cacheKey, result);
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.stats.totalCalls++;
    this.stats.totalCost += result.cost;

    return result;
  }

  /**
   * CHAMAR GROQ
   * CORRIGIDO: Verificar se API key está configurada
   */
  async callGroq(prompt, options = {}) {
    // ✅ VERIFICAÇÃO: Groq requer API key
    if (!this.providers.groq.isConfigured) {
      throw new Error("❌ GROQ_API_KEY não configurada! Fallback não pode ser ativado.");
    }

    const model = options.model || this.providers.groq.defaultModel;
    const maxTokens = options.maxTokens || 2000;

    const response = await fetch(`${this.providers.groq.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.providers.groq.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();

    const text = data.choices[0].message.content;
    const totalTokens = data.usage.total_tokens;
    const inputTokens = data.usage.prompt_tokens;
    const outputTokens = data.usage.completion_tokens;

    const modelConfig = this.providers.groq.models[model];
    const cost = (totalTokens / 1000) * modelConfig.costPer1kTokens;

    return {
      text,
      model,
      provider: "groq",
      tokens: totalTokens,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * VERIFICAR RATE LIMIT
   */
  checkRateLimit(provider) {
    const limit = this.rateLimits[provider];
    const now = Date.now();

    if (now >= limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = now + 60000;
    }

    limit.calls++;
    return limit.calls <= 100; // 100 chamadas por minuto
  }

  /**
   * COMPARAR CUSTOS
   */
  compareCosts(tokens = 1000) {
    const costs = {
      groq: {},
    };

    // Groq
    for (const [model, config] of Object.entries(this.providers.groq.models)) {
      costs.groq[model] = (tokens / 1000) * config.costPer1kTokens;
    }

    return costs;
  }

  /**
   * OBTER STATUS
   */
  getStatus() {
    return {
      groq: this.providers.groq ? "available" : "not-configured",
    };
  }

  /**
   * OBTER MODELOS DISPONÍVEIS
   */
  getAvailableModels() {
    return {
      groq: Object.keys(this.providers.groq?.models || {}),
    };
  }

  /**
   * OBTER ESTATÍSTICAS
   */
  getStats() {
    const cacheHitRate =
      this.stats.totalCalls > 0
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100
        : 0;

    return {
      totalCalls: this.stats.totalCalls,
      totalCost: this.stats.totalCost.toFixed(4),
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: cacheHitRate.toFixed(2) + "%",
      fallbacks: this.stats.fallbacks,
      cacheSize: this.cache.size,
      rateLimits: this.rateLimits,
    };
  }

  /**
   * LIMPAR CACHE
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * RESETAR ESTATÍSTICAS
   */
  resetStats() {
    this.stats = {
      totalCalls: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fallbacks: 0,
    };
  }

  /**
   * RECOMENDAÇÃO DE MODELO
   */
  recommendModel(complexity = "simple") {
    const selection = this.selectModel(complexity);
    const model = this.providers[selection.provider].models[selection.model];

    return {
      provider: selection.provider,
      model: selection.model,
      description: model.description,
      costPer1kTokens: model.costPer1kTokens,
      maxTokens: model.maxTokens,
    };
  }
}

// EXPORTAR COMO ES6 DEFAULT
export default OptimizedAPIManager;
