/**
 * PROVIDERS CONFIG - Single Source of Truth
 * 
 * Centralizes ALL provider configurations for Serginho Orchestrator.
 * No more hardcoded endpoints or model names scattered across the codebase.
 */

/**
 * Provider configurations
 * Each provider has:
 * - type: Provider implementation type (groq, gemini, openai)
 * - model: Specific model identifier
 * - endpoint: API endpoint URL
 * - tier: Intelligence tier (complex, medium, simple, fallback, genius, optimized)
 * - defaultParams: Default parameters for API calls
 * - generationConfig: Gemini-specific generation config
 */
export const PROVIDERS = {
  // Tier 1: Complex tasks - Llama 3.3 120B (via Groq)
  // Note: Currently using 70B as 120B is not yet available on Groq
  'llama-120b': {
    type: 'groq',
    model: 'llama-3.3-70b-versatile', // TODO: Update when 120B available
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'complex',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 8192,
    },
  },

  // Tier 2: Medium tasks - Llama 3.3 70B (via Groq)
  'llama-70b': {
    type: 'groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'medium',
    defaultParams: {
      temperature: 0.6,
      max_tokens: 4096,
    },
  },

  // Tier 3: Simple/fast tasks - Llama 3.1 8B (via Groq)
  'llama-8b': {
    type: 'groq',
    model: 'llama-3.1-8b-instant',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'simple',
    defaultParams: {
      temperature: 0.5,
      max_tokens: 2048,
    },
  },

  // Gemini 2.5 Pro (premium) - for high-complexity tasks
  'gemini-exp-1206': {
    type: 'gemini',
    model: 'gemini-exp-1206',
    endpoint: null, // Set dynamically with API key
    tier: 'genius',
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 8192,
      topP: 0.95,
    },
  },

  // Gemini Flash (fast) - for speed-optimized tasks
  'gemini-2.0-flash': {
    type: 'gemini',
    model: 'gemini-2.0-flash',
    endpoint: null, // Set dynamically with API key
    tier: 'optimized',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    },
  },

  // Groq fallback - Mixtral for high availability
  'groq-fallback': {
    type: 'groq',
    model: 'mixtral-8x7b-32768',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    tier: 'fallback',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 4096,
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
  
  // Set Gemini endpoint dynamically with API key
  if (config.type === 'gemini' && !config.endpoint) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey && process.env.NODE_ENV !== 'test') {
      throw new Error('GOOGLE_API_KEY environment variable is required for Gemini providers');
    }
    clonedConfig.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey || 'test-key'}`;
  }
  
  return clonedConfig;
}

/**
 * Get all providers by tier
 * @param {string} tier - Tier name (complex, medium, simple, etc.)
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

export default {
  PROVIDERS,
  getProviderConfig,
  getProvidersByTier,
  getAllProviderNames,
};
