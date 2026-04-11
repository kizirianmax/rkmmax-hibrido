/**
 * PROVIDERS CONFIG - Single Source of Truth
 * 
 * Centralizes ALL provider configurations for Serginho Orchestrator.
 * No more hardcoded endpoints or model names scattered across the codebase.
 */

/**
 * Provider configurations
 * Each provider has:
 * - type: Provider implementation type (groq | google)
 * - model: Specific model identifier
 * - endpoint: API endpoint URL
 * - tier: Intelligence tier (complex, medium, fallback)
 * - defaultParams: Default parameters for API calls
 * - inputTokenBudget: Max input tokens before history truncation (chars = budget * 4)
 *   Moved here from orchestrator hardcode to keep config as single source of truth.
 */
export const PROVIDERS = {
  // Tier 1: Complex tasks - GPT-OSS 120B (via Groq)
  'llama-120b': {
    type: 'groq',
    model: 'openai/gpt-oss-120b',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'complex',
    inputTokenBudget: 16000,
    defaultParams: {
      temperature: 0.35,
      top_p: 0.85,
      max_tokens: 8192,
    },
  },

  // Tier 2: Medium tasks - Llama 3.3 70B (via Groq)
  'llama-70b': {
    type: 'groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'medium',
    inputTokenBudget: 16000,
    defaultParams: {
      temperature: 0.55,
      top_p: 0.90,
      max_tokens: 8192,
    },
  },

  // Groq fallback - Llama 3.1 8B for high availability
  'groq-fallback': {
    type: 'groq',
    model: 'llama-3.1-8b-instant',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'fallback',
    inputTokenBudget: 16000,
    defaultParams: {
      temperature: 0.5,
      top_p: 0.90,
      max_tokens: 4096,
    },
  },

  // Google Gemini 3 Flash — velocidade máxima, modelo preview
  'gemini-3-flash': {
    type: 'google',
    model: 'gemini-3-flash-preview',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    tier: 'speed',
    defaultParams: {
      temperature: 0.50,
      top_p: 0.95,
      maxOutputTokens: 8192,
    },
  },

  // Google Gemini 3.1 Pro — raciocínio avançado, modelo preview
  'gemini-3.1-pro': {
    type: 'google',
    model: 'gemini-3.1-pro-preview',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent',
    tier: 'complex',
    defaultParams: {
      temperature: 0.50,
      top_p: 0.95,
      maxOutputTokens: 8192,
    },
  },

  // Google Gemini 2.5 Pro — provider principal para análise profunda e raciocínio abstrato
  // Projeto RKMMAX INFINITY no Google AI Studio
  // Janela de contexto massiva (1M tokens input, 8192 output) — sem truncamento agressivo como Groq.
  'gemini-pro': {
    type: 'google',
    model: 'gemini-2.5-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
    tier: 'complex',
    // Gemini não usa inputTokenBudget: janela nativa é suficientemente grande para não truncar.
    defaultParams: {
      temperature: 0.50,
      top_p: 0.95,
      maxOutputTokens: 8192,
    },
  },
};

/**
 * Get provider configuration by name
 * @param {string} providerName - Provider identifier
 * @returns {object} Provider configuration
 * @throws {Error} If provider not found
 */
export function getProviderConfig(providerName) {
  const config = PROVIDERS[providerName];
  if (!config) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  
  // Clone config to prevent mutations
  const clonedConfig = { ...config };
  
  return clonedConfig;
}

/**
 * Get all providers by tier
 * @param {string} tier - Tier name (complex, medium, fallback, etc.)
 * @returns {Array<string>} Array of provider names
 */
export function getProvidersByTier(tier) {
  return Object.entries(PROVIDERS)
    .filter(([_, config]) => config.tier === tier)
    .map(([name, _]) => name);
}

/**
 * Get all available provider names
 * @returns {Array<string>} Array of provider names
 */
export function getAllProviderNames() {
  return Object.keys(PROVIDERS);
}

/**
 * Get providers that have their required env vars configured.
 * Groq providers require GROQ_API_KEY.
 * Google providers require GEMINI_API_KEY.
 * @returns {Array<string>} Array of enabled provider names
 */
export function getEnabledProviders() {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  return Object.entries(PROVIDERS)
    .filter(([_, config]) => {
      if (config.type === 'groq') return !!groqKey;
      if (config.type === 'google') return !!geminiKey;
      return false;
    })
    .map(([name]) => name);
}

/**
 * Parse optional provider weights from env var.
 * Format: JSON string, e.g. '{"llama-120b":100}' or '{"llama-120b":70,"gemini-pro":30}'
 * Returns null if not configured or invalid.
 * Phase A5.3 scaffolding — not used in routing yet.
 * @returns {object|null}
 */
export function parseProviderWeights() {
  const raw = process.env.HYBRID_PROVIDER_WEIGHTS;
  if (!raw) return null;
  try {
    const weights = JSON.parse(raw);
    if (typeof weights !== 'object' || weights === null) return null;
    const total = Object.values(weights).reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (total <= 0) return null;
    return weights;
  } catch {
    console.warn('[providers-config] Invalid HYBRID_PROVIDER_WEIGHTS, ignoring:', raw);
    return null;
  }
}

/**
 * Get providers sorted by weight, deterministic and configurable.
 * - If HYBRID_PROVIDER_WEIGHTS is NOT set or invalid → returns ['llama-120b'] if enabled,
 *   otherwise falls back to getEnabledProviders() with groq-fallback sorted last.
 * - If weights are set and valid → considers only enabled providers, sorts by weight desc.
 *   Enabled providers not in the weights JSON are appended at weight 0.
 *   If all weighted providers are disabled, falls back to getEnabledProviders().
 * @returns {Array<string>} Ordered array of provider names
 */
export function getWeightedProviders() {
  const enabled = getEnabledProviders();

  const weights = parseProviderWeights();

  if (!weights) {
    // Default: prefer llama-120b single-mode
    if (enabled.includes('llama-120b')) {
      return ['llama-120b'];
    }
    // Fallback: enabled providers with groq-fallback sorted last
    return [...enabled].sort((a, b) => {
      if (a === 'groq-fallback') return 1;
      if (b === 'groq-fallback') return -1;
      return 0;
    });
  }

  // Filter to only enabled providers, assign weight (0 for unlisted)
  const withWeights = enabled.map((name) => ({
    name,
    weight: Number(weights[name]) || 0,
  }));

  // Sort by weight descending, then alphabetically for stability
  withWeights.sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));

  const result = withWeights.map((p) => p.name);

  if (result.length === 0) {
    // Safe fallback if somehow empty
    if (enabled.includes('llama-120b')) return ['llama-120b'];
    return enabled;
  }

  return result;
}

/**
 * Model metadata for UI and transparency
 * Provides human-readable information about each model
 * 
 * Structure:
 * - infrastructure: Provider infrastructure (groq | google)
 * - displayName: Human-readable model name
 * - description: Brief description of model capabilities
 * - icon: Visual icon for UI
 * - logicalTier: Logical tier (complex, medium, fallback, genius, optimized)
 */
export const MODEL_METADATA = {
  'llama-120b': {
    infrastructure: 'groq',
    displayName: 'GPT-OSS 120B (Complex)',
    description: 'Raciocínio profundo e análise complexa de alto nível',
    icon: '🧠',
    logicalTier: 'complex'
  },
  'llama-70b': {
    infrastructure: 'groq',
    displayName: 'Llama 3.3 70B',
    description: 'Tarefas técnicas e desenvolvimento',
    icon: '⚙️',
    logicalTier: 'medium'
  },
  'groq-fallback': {
    infrastructure: 'groq',
    displayName: 'Llama 3.1 8B (Fallback)',
    description: 'Fallback de alta disponibilidade',
    icon: '🔄',
    logicalTier: 'fallback'
  },
  'gemini-3-flash': {
    infrastructure: 'google',
    displayName: 'Gemini 3 Flash',
    description: 'Velocidade máxima com raciocínio leve (Google Preview)',
    icon: '⚡',
    logicalTier: 'speed'
  },
  'gemini-3.1-pro': {
    infrastructure: 'google',
    displayName: 'Gemini 3.1 Pro',
    description: 'Raciocínio avançado de última geração (Google Preview)',
    icon: '🔮',
    infrastructure: 'google',
    displayName: 'Gemini 2.5 Pro',
    description: 'Raciocínio avançado via Google Gemini (RKMMAX INFINITY)',
    icon: '♊',
    logicalTier: 'complex'
  },
};

/**
 * Get model metadata by provider name
 * @param {string} providerName - Provider identifier
 * @returns {object} Model metadata
 */
export function getModelMetadata(providerName) {
  return MODEL_METADATA[providerName] || {
    infrastructure: 'unknown',
    displayName: providerName,
    description: 'Modelo de IA',
    icon: '🤖',
    logicalTier: 'unknown'
  };
}

export default {
  PROVIDERS,
  MODEL_METADATA,
  getProviderConfig,
  getProvidersByTier,
  getAllProviderNames,
  getEnabledProviders,
  parseProviderWeights,
  getWeightedProviders,
  getModelMetadata,
};
