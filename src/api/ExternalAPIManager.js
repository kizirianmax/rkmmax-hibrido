/**
 * EXTERNAL API MANAGER
 *
 * Gerencia integrações com múltiplas APIs:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Groq (LLaMA, Mixtral, openai/gpt-oss-120b)
 * 
 * ⚠️ Gemini/Google removidos - sistema agora usa 100% Groq
 */

class ExternalAPIManager {
  constructor(config = {}) {
    this.config = {
      openaiKey: process.env.OPENAI_API_KEY,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      groqKey: process.env.GROQ_API_KEY,
      ...config,
    };

    this.providers = {
      openai: this.initOpenAI(),
      anthropic: this.initAnthropic(),
      groq: this.initGroq(),
    };

    this.cache = new Map();
    this.rateLimits = {
      openai: { calls: 0, resetTime: Date.now() + 60000 },
      anthropic: { calls: 0, resetTime: Date.now() + 60000 },
      groq: { calls: 0, resetTime: Date.now() + 60000 },
    };
  }

  /**
   * INICIALIZAR OPENAI
   */
  initOpenAI() {
    if (!this.config.openaiKey) return null;

    return {
      apiKey: this.config.openaiKey,
      baseURL: "https://api.openai.com/v1",
      models: {
        "gpt-4": { maxTokens: 8192, costPer1kTokens: 0.03 },
        "gpt-4-turbo": { maxTokens: 128000, costPer1kTokens: 0.01 },
        "gpt-3.5-turbo": { maxTokens: 4096, costPer1kTokens: 0.0005 },
      },
      defaultModel: "gpt-3.5-turbo",
    };
  }

  /**
   * INICIALIZAR ANTHROPIC
   */
  initAnthropic() {
    if (!this.config.anthropicKey) return null;

    return {
      apiKey: this.config.anthropicKey,
      baseURL: "https://api.anthropic.com/v1",
      models: {
        "claude-3-opus": { maxTokens: 200000, costPer1kTokens: 0.015 },
        "claude-3-sonnet": { maxTokens: 200000, costPer1kTokens: 0.003 },
        "claude-3-haiku": { maxTokens: 200000, costPer1kTokens: 0.00025 },
      },
      defaultModel: "claude-3-sonnet",
    };
  }

  /**
   * INICIALIZAR GROQ
   * Atualizado com modelos de 2024-2025
   */
  initGroq() {
    if (!this.config.groqKey) return null;

    return {
      apiKey: this.config.groqKey,
      baseURL: "https://api.groq.com/openai/v1",
      models: {
        "openai/gpt-oss-120b": { maxTokens: 8000, costPer1kTokens: 0.00027 },
        "llama-3.3-70b-versatile": { maxTokens: 8000, costPer1kTokens: 0.0001 },
        "mixtral-8x7b-32768": { maxTokens: 32768, costPer1kTokens: 0.00024 },
      },
      defaultModel: "openai/gpt-oss-120b",
    };
  }

  /**
   * CHAMAR API COM FALLBACK
   * Ordem: openai -> anthropic -> groq
   */
  async callWithFallback(prompt, options = {}) {
    const providers = ["openai", "anthropic", "groq"];
    const errors = [];

    for (const provider of providers) {
      try {
        if (!this.providers[provider]) continue;

        const result = await this.call(provider, prompt, options);
        return {
          success: true,
          provider,
          result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        errors.push({ provider, error: error.message });
      }
    }

    return {
      success: false,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * CHAMAR API ESPECÍFICA
   */
  async call(provider, prompt, options = {}) {
    // Verificar cache
    const cacheKey = `${provider}:${prompt}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Verificar rate limit
    if (!this.checkRateLimit(provider)) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    }

    let result;

    switch (provider) {
      case "openai":
        result = await this.callOpenAI(prompt, options);
        break;
      case "anthropic":
        result = await this.callAnthropic(prompt, options);
        break;
      case "groq":
        result = await this.callGroq(prompt, options);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    // Cachear resultado
    this.cache.set(cacheKey, result);
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return result;
  }

  /**
   * CHAMAR OPENAI
   */
  async callOpenAI(prompt, options = {}) {
    const model = options.model || this.providers.openai.defaultModel;
    const maxTokens = options.maxTokens || 1000;

    const response = await fetch(`${this.providers.openai.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.providers.openai.apiKey}`,
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
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      model,
      tokens: data.usage.total_tokens,
      cost: (data.usage.total_tokens / 1000) * this.providers.openai.models[model].costPer1kTokens,
    };
  }

  /**
   * CHAMAR ANTHROPIC
   */
  async callAnthropic(prompt, options = {}) {
    const model = options.model || this.providers.anthropic.defaultModel;
    const maxTokens = options.maxTokens || 1000;

    const response = await fetch(`${this.providers.anthropic.baseURL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.providers.anthropic.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.content[0].text,
      model,
      tokens: data.usage.input_tokens + data.usage.output_tokens,
      cost:
        ((data.usage.input_tokens + data.usage.output_tokens) / 1000) *
        this.providers.anthropic.models[model].costPer1kTokens,
    };
  }

  /**
   * CHAMAR GROQ
   */
  async callGroq(prompt, options = {}) {
    const model = options.model || this.providers.groq.defaultModel;
    const maxTokens = options.maxTokens || 1000;

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
    return {
      text: data.choices[0].message.content,
      model,
      tokens: data.usage.total_tokens,
      cost: (data.usage.total_tokens / 1000) * this.providers.groq.models[model].costPer1kTokens,
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
   * OBTER STATUS DOS PROVEDORES
   */
  getProvidersStatus() {
    return {
      openai: this.providers.openai ? "available" : "not-configured",
      anthropic: this.providers.anthropic ? "available" : "not-configured",
      groq: this.providers.groq ? "available" : "not-configured",
    };
  }

  /**
   * LISTAR MODELOS DISPONÍVEIS
   */
  getAvailableModels() {
    const models = {};

    if (this.providers.openai) {
      models.openai = Object.keys(this.providers.openai.models);
    }
    if (this.providers.anthropic) {
      models.anthropic = Object.keys(this.providers.anthropic.models);
    }
    if (this.providers.groq) {
      models.groq = Object.keys(this.providers.groq.models);
    }

    return models;
  }

  /**
   * COMPARAR CUSTOS
   */
  compareCosts(tokens = 1000) {
    const costs = {};

    if (this.providers.openai) {
      costs.openai = {};
      for (const [model, config] of Object.entries(this.providers.openai.models)) {
        costs.openai[model] = (tokens / 1000) * config.costPer1kTokens;
      }
    }

    if (this.providers.anthropic) {
      costs.anthropic = {};
      for (const [model, config] of Object.entries(this.providers.anthropic.models)) {
        costs.anthropic[model] = (tokens / 1000) * config.costPer1kTokens;
      }
    }

    if (this.providers.groq) {
      costs.groq = {};
      for (const [model, config] of Object.entries(this.providers.groq.models)) {
        costs.groq[model] = (tokens / 1000) * config.costPer1kTokens;
      }
    }

    return costs;
  }

  /**
   * LIMPAR CACHE
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * OBTER ESTATÍSTICAS
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      rateLimits: this.rateLimits,
      providers: this.getProvidersStatus(),
      models: this.getAvailableModels(),
    };
  }
}

export default ExternalAPIManager;
