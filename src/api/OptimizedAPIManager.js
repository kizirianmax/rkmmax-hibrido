/**
 * OPTIMIZED API MANAGER
 *
 * Sistema 100% Groq com 3 modelos em cascata:
 * 1. openai/gpt-oss-120b (Primary - raciocínio principal)
 * 2. llama-3.3-70b-versatile (Fallback - velocidade)
 * 3. mixtral-8x7b-32768 (Fallback - contextos longos)
 *
 * Estratégia:
 * - Primary para tarefas normais
 * - Fallback automático em caso de falha
 * - Mixtral para contextos longos (32K tokens)
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

    // ✅ Apenas Groq - sem Gemini
    this.providers = {
      groq: this.initGroq(),
    };

    this.cache = new Map();
    
    // ✅ Rate limit apenas para Groq
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
   * 
   * Sistema com 3 modelos em cascata:
   * 1. openai/gpt-oss-120b - Primary (raciocínio principal)
   * 2. llama-3.3-70b-versatile - Fallback 1 (velocidade)
   * 3. mixtral-8x7b-32768 - Fallback 2 (contextos longos)
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
          description: "Modelo principal de raciocínio",
          priority: 1,
          tier: "primary",
        },
        'llama-3.3-70b-versatile': {
          maxTokens: 8000,
          costPer1kTokens: 0.0001,
          description: "Fallback automático rápido",
          priority: 2,
          tier: "fallback",
        },
        'mixtral-8x7b-32768': {
          maxTokens: 32768,
          costPer1kTokens: 0.00024,
          description: "Fallback para contextos longos",
          priority: 3,
          tier: "fallback",
        },
      },
      defaultModel: 'openai/gpt-oss-120b',
    };
  }

  /**
   * SELECIONAR MODELO IDEAL
   * 
   * Sistema 100% Groq com 3 modelos:
   * - Tarefas simples/normais: openai/gpt-oss-120b (primary)
   * - Fallback rápido: llama-3.3-70b-versatile
   * - Contextos longos: mixtral-8x7b-32768
   */
  selectModel(complexity = "simple", options = {}) {
    // Verificar se Groq está inicializado
    if (!this.providers.groq) {
      console.warn("⚠️ Groq provider não inicializado!");
      return {
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
      };
    }

    // Forçar modelo específico se solicitado (com validação)
    if (options.model) {
      // Validar se o modelo existe
      if (!this.providers.groq.models[options.model]) {
        console.warn(`⚠️ Modelo ${options.model} não encontrado. Usando modelo padrão.`);
        return {
          provider: "groq",
          model: this.providers.groq.defaultModel,
          tier: "primary",
        };
      }
      
      return {
        provider: "groq",
        model: options.model,
        tier: this.providers.groq.models[options.model]?.tier || "custom",
      };
    }

    // Seleção automática baseada em complexidade
    switch (complexity) {
      case "simple":
      case "medium":
      case "normal":
        return {
          provider: "groq",
          model: "openai/gpt-oss-120b", // Primary
          tier: "primary",
        };

      case "complex":
      case "critical":
        return {
          provider: "groq",
          model: "openai/gpt-oss-120b", // Primary para tudo
          tier: "primary",
        };

      case "long":
        return {
          provider: "groq",
          model: "mixtral-8x7b-32768", // Para contextos longos
          tier: "long-context",
        };

      default:
        return {
          provider: "groq",
          model: this.providers.groq.defaultModel,
          tier: "primary",
        };
    }
  }

  /**
   * CHAMAR API COM FALLBACK AUTOMÁTICO
   * Sistema 100% Groq com 3 modelos em cascata
   */
  async callWithFallback(prompt, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const models = [
      'openai/gpt-oss-120b',      // Primary - Tenta primeiro
      'llama-3.3-70b-versatile',  // Fallback 1 - Rápido
      'mixtral-8x7b-32768'        // Fallback 2 - Contextos longos
    ];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = models[attempt] || models[0];
        console.log(`🤖 Tentativa ${attempt + 1}: Usando modelo ${model}`);

        const result = await this.callGroq(prompt, {
          ...options,
          model
        });

        console.log(`✅ Sucesso com ${model}`);
        return {
          success: true,
          provider: "groq",
          model,
          result,
          attempt: attempt + 1,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.warn(`❌ Tentativa ${attempt + 1} falhou com ${models[attempt]}:`, error.message);

        if (attempt === maxRetries - 1) {
          console.error("🔴 TODOS OS MODELOS FALHARAM");
          return {
            success: false,
            error: `Todos os modelos falharam após ${maxRetries} tentativas: ${error.message}`,
            attempts: maxRetries,
            timestamp: new Date().toISOString(),
          };
        }
      }
    }
  }

  /**
   * CHAMAR API ESPECÍFICA (apenas Groq)
   */
  async call(provider, prompt, options = {}) {
    // ✅ Verificar se é Groq (único provider suportado)
    if (provider !== "groq") {
      throw new Error(`Provider not supported: ${provider}. Use 'groq'.`);
    }

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

    const result = await this.callGroq(prompt, options);

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
   * COMPARAR CUSTOS (apenas Groq)
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
