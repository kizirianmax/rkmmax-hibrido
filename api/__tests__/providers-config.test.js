import { jest } from '@jest/globals';
import { 
  PROVIDERS, 
  getProviderConfig, 
  getProvidersByTier, 
  getAllProviderNames,
  getEnabledProviders,
  parseProviderWeights,
  getWeightedProviders,
} from '../lib/providers-config.js';

// Mock environment variables
process.env.GROQ_API_KEY = 'test-groq-key';

describe('providers-config', () => {
  describe('PROVIDERS constant', () => {
    test('contains all expected providers', () => {
      const providerNames = Object.keys(PROVIDERS);
      expect(providerNames).toContain('llama-120b');
      expect(providerNames).toContain('llama-70b');
      expect(providerNames).toContain('gemini-3-flash');
      expect(providerNames).toContain('gemini-pro');
      // groq-fallback removed — gemini-3-flash is the last-resort fallback provider
      expect(providerNames).not.toContain('groq-fallback');
      expect(providerNames).not.toContain('llama-8b');
    });

    test('each provider has required fields', () => {
      Object.entries(PROVIDERS).forEach(([name, config]) => {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('model');
        expect(config).toHaveProperty('tier');
        expect(config.endpoint).toBeTruthy();
      });
    });

    test('Groq providers have correct configuration', () => {
      const groqProviders = ['llama-120b', 'llama-70b'];
      
      groqProviders.forEach(provider => {
        const config = PROVIDERS[provider];
        expect(config.type).toBe('groq');
        expect(config.endpoint).toContain('api.groq.com');
        expect(config.defaultParams).toBeDefined();
        expect(config.defaultParams).toHaveProperty('temperature');
        expect(config.defaultParams).toHaveProperty('max_tokens');
      });
    });

    test('tiers are correctly assigned', () => {
      expect(PROVIDERS['llama-120b'].tier).toBe('complex');
      expect(PROVIDERS['llama-70b'].tier).toBe('medium');
      expect(PROVIDERS['gemini-3-flash'].tier).toBe('fallback');
      expect(PROVIDERS['gemini-pro'].tier).toBe('complex');
    });
  });

  describe('getProviderConfig', () => {
    test('returns provider config for valid provider', () => {
      const config = getProviderConfig('llama-70b');
      expect(config).toBeDefined();
      expect(config.type).toBe('groq');
      expect(config.model).toBe('llama-3.3-70b-versatile');
    });

    test('throws error for unknown provider', () => {
      expect(() => getProviderConfig('unknown-provider')).toThrow('Unknown provider: unknown-provider');
    });

    test('throws error for removed llama-8b provider', () => {
      expect(() => getProviderConfig('llama-8b')).toThrow('Unknown provider: llama-8b');
    });

    test('returns cloned config to prevent mutations', () => {
      const config1 = getProviderConfig('llama-70b');
      const config2 = getProviderConfig('llama-70b');
      
      config1.customField = 'test';
      expect(config2.customField).toBeUndefined();
    });
  });

  describe('getProvidersByTier', () => {
    test('returns providers for complex tier', () => {
      const providers = getProvidersByTier('complex');
      expect(providers).toContain('llama-120b');
      expect(providers).toContain('gemini-pro');
      expect(providers.length).toBeGreaterThan(0);
    });

    test('returns providers for medium tier', () => {
      const providers = getProvidersByTier('medium');
      expect(providers).toContain('llama-70b');
    });

    test('returns no providers for simple tier (llama-8b removed)', () => {
      const providers = getProvidersByTier('simple');
      expect(providers).toEqual([]);
    });

    test('returns providers for fallback tier', () => {
      const providers = getProvidersByTier('fallback');
      expect(providers).toContain('gemini-3-flash');
    });

    test('returns empty array for non-existent tier', () => {
      const providers = getProvidersByTier('non-existent');
      expect(providers).toEqual([]);
    });

    test('returns only provider names, not configs', () => {
      const providers = getProvidersByTier('complex');
      providers.forEach(provider => {
        expect(typeof provider).toBe('string');
      });
    });
  });

  describe('getAllProviderNames', () => {
    test('returns all provider names', () => {
      const names = getAllProviderNames();
      expect(names).toContain('llama-120b');
      expect(names).toContain('llama-70b');
      expect(names).not.toContain('groq-fallback');
      expect(names).toContain('gemini-pro');
      expect(names).toContain('gemini-3-flash');
      expect(names).toContain('gemini-3.1-pro');
      expect(names).not.toContain('llama-8b');
    });

    test('returns correct number of providers', () => {
      const names = getAllProviderNames();
      expect(names.length).toBe(5);
    });

    test('returns only strings', () => {
      const names = getAllProviderNames();
      names.forEach(name => {
        expect(typeof name).toBe('string');
      });
    });
  });

  describe('Provider models', () => {
    test('Llama 120B uses correct model', () => {
      const config = getProviderConfig('llama-120b');
      expect(config.model).toBe('openai/gpt-oss-120b');
    });

    test('Llama 70B uses correct model', () => {
      const config = getProviderConfig('llama-70b');
      expect(config.model).toBe('llama-3.3-70b-versatile');
    });

    test('gemini-3-flash uses correct model', () => {
      const config = getProviderConfig('gemini-3-flash');
      expect(config.model).toBe('gemini-3-flash-preview');
    });
  });

  describe('Default parameters', () => {
    test('each Groq provider has temperature', () => {
      ['llama-120b', 'llama-70b'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.defaultParams.temperature).toBeDefined();
        expect(typeof config.defaultParams.temperature).toBe('number');
      });
    });

    test('each Groq provider has max_tokens', () => {
      ['llama-120b', 'llama-70b'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.defaultParams.max_tokens).toBeDefined();
        expect(typeof config.defaultParams.max_tokens).toBe('number');
      });
    });

    test('max_tokens are set for maximum potential', () => {
      expect(getProviderConfig('llama-120b').defaultParams.max_tokens).toBe(8192);
      expect(getProviderConfig('llama-70b').defaultParams.max_tokens).toBe(8192);
    });
  });

  describe('Endpoints', () => {
    test('Groq providers use correct endpoint', () => {
      ['llama-120b', 'llama-70b'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.endpoint).toBe('https://api.groq.com/openai/v1/chat/completions');
      });
    });

    test('Gemini provider uses Google endpoint', () => {
      const config = getProviderConfig('gemini-pro');
      expect(config.endpoint).toContain('generativelanguage.googleapis.com');
    });
  });

  describe('Gemini provider', () => {
    test('gemini-pro has correct type', () => {
      expect(PROVIDERS['gemini-pro'].type).toBe('google');
    });

    test('gemini-pro has correct model', () => {
      expect(PROVIDERS['gemini-pro'].model).toBe('gemini-2.5-pro');
    });

    test('gemini-pro has complex tier', () => {
      expect(PROVIDERS['gemini-pro'].tier).toBe('complex');
    });

    test('gemini-pro has temperature and maxOutputTokens', () => {
      const config = PROVIDERS['gemini-pro'];
      expect(config.defaultParams.temperature).toBeDefined();
      expect(config.defaultParams.maxOutputTokens).toBeDefined();
    });

    test('gemini-pro maxOutputTokens is 8192', () => {
      expect(PROVIDERS['gemini-pro'].defaultParams.maxOutputTokens).toBe(8192);
    });
  });

  describe('Gemini 3 Flash provider', () => {
    test('gemini-3-flash has correct type', () => {
      expect(PROVIDERS['gemini-3-flash'].type).toBe('google');
    });

    test('gemini-3-flash has correct model ID', () => {
      expect(PROVIDERS['gemini-3-flash'].model).toBe('gemini-3-flash-preview');
    });

    test('gemini-3-flash has fallback tier', () => {
      expect(PROVIDERS['gemini-3-flash'].tier).toBe('fallback');
    });

    test('gemini-3-flash endpoint contains correct model path', () => {
      expect(PROVIDERS['gemini-3-flash'].endpoint).toContain('gemini-3-flash-preview');
    });

    test('gemini-3-flash maxOutputTokens is 8192', () => {
      expect(PROVIDERS['gemini-3-flash'].defaultParams.maxOutputTokens).toBe(8192);
    });
  });

  describe('Gemini 3.1 Pro provider', () => {
    test('gemini-3.1-pro has correct type', () => {
      expect(PROVIDERS['gemini-3.1-pro'].type).toBe('google');
    });

    test('gemini-3.1-pro has correct model ID', () => {
      expect(PROVIDERS['gemini-3.1-pro'].model).toBe('gemini-3.1-pro-preview');
    });

    test('gemini-3.1-pro has complex tier', () => {
      expect(PROVIDERS['gemini-3.1-pro'].tier).toBe('complex');
    });

    test('gemini-3.1-pro endpoint contains correct model path', () => {
      expect(PROVIDERS['gemini-3.1-pro'].endpoint).toContain('gemini-3.1-pro-preview');
    });

    test('gemini-3.1-pro maxOutputTokens is 8192', () => {
      expect(PROVIDERS['gemini-3.1-pro'].defaultParams.maxOutputTokens).toBe(8192);
    });
  });
});

describe('getEnabledProviders', () => {
  const originalGroq = process.env.GROQ_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalGroq !== undefined) {
      process.env.GROQ_API_KEY = originalGroq;
    } else {
      delete process.env.GROQ_API_KEY;
    }
    if (originalGemini !== undefined) {
      process.env.GEMINI_API_KEY = originalGemini;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  test('returns only groq providers when only GROQ_API_KEY is set', () => {
    process.env.GROQ_API_KEY = 'test-key';
    delete process.env.GEMINI_API_KEY;
    const enabled = getEnabledProviders();
    enabled.forEach(name => {
      expect(PROVIDERS[name].type).toBe('groq');
    });
    expect(enabled.length).toBeGreaterThan(0);
  });

  test('returns 3 groq providers when only GROQ_API_KEY is set', () => {
    process.env.GROQ_API_KEY = 'test-key';
    delete process.env.GEMINI_API_KEY;
    const enabled = getEnabledProviders();
    expect(enabled.length).toBe(2); // llama-120b, llama-70b (groq-fallback removed)
    expect(enabled).toContain('llama-120b');
    expect(enabled).toContain('llama-70b');
    expect(enabled).not.toContain('groq-fallback');
  });

  test('returns empty array when no API keys are set', () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const enabled = getEnabledProviders();
    expect(enabled).toEqual([]);
  });

  test('includes gemini-pro when GEMINI_API_KEY is set', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const enabled = getEnabledProviders();
    expect(enabled).toContain('gemini-pro');
    expect(enabled).toContain('gemini-3-flash');
    expect(enabled).toContain('gemini-3.1-pro');
  });

  test('excludes gemini-pro when GEMINI_API_KEY is absent', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    delete process.env.GEMINI_API_KEY;
    const enabled = getEnabledProviders();
    expect(enabled).not.toContain('gemini-pro');
    expect(enabled).not.toContain('gemini-3-flash');
    expect(enabled).not.toContain('gemini-3.1-pro');
  });

  test('returns only gemini providers when only GEMINI_API_KEY is set', () => {
    delete process.env.GROQ_API_KEY;
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const enabled = getEnabledProviders();
    expect(enabled).toContain('gemini-pro');
    expect(enabled).toContain('gemini-3-flash');
    expect(enabled).toContain('gemini-3.1-pro');
    enabled.forEach(name => {
      expect(PROVIDERS[name].type).toBe('google');
    });
  });
});

describe('parseProviderWeights', () => {
  const originalWeights = process.env.HYBRID_PROVIDER_WEIGHTS;

  afterEach(() => {
    if (originalWeights !== undefined) {
      process.env.HYBRID_PROVIDER_WEIGHTS = originalWeights;
    } else {
      delete process.env.HYBRID_PROVIDER_WEIGHTS;
    }
  });

  test('returns null when env var is not set', () => {
    delete process.env.HYBRID_PROVIDER_WEIGHTS;
    const result = parseProviderWeights();
    expect(result).toBeNull();
  });

  test('parses valid JSON weights', () => {
    process.env.HYBRID_PROVIDER_WEIGHTS = '{"groq":100}';
    const result = parseProviderWeights();
    expect(result).toEqual({ groq: 100 });
  });

  test('returns null for invalid JSON', () => {
    process.env.HYBRID_PROVIDER_WEIGHTS = 'not-json';
    const result = parseProviderWeights();
    expect(result).toBeNull();
  });
});

describe('getWeightedProviders (Phase A5.4)', () => {
  const originalGroq = process.env.GROQ_API_KEY;
  const originalWeights = process.env.HYBRID_PROVIDER_WEIGHTS;

  afterEach(() => {
    if (originalGroq !== undefined) process.env.GROQ_API_KEY = originalGroq;
    else delete process.env.GROQ_API_KEY;
    if (originalWeights !== undefined) process.env.HYBRID_PROVIDER_WEIGHTS = originalWeights;
    else delete process.env.HYBRID_PROVIDER_WEIGHTS;
  });

  test('Groq-only + no weights → returns [llama-120b]', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    delete process.env.HYBRID_PROVIDER_WEIGHTS;
    const result = getWeightedProviders();
    expect(result).toEqual(['llama-120b']);
  });

  test('valid weights sort correctly by weight descending', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.HYBRID_PROVIDER_WEIGHTS = '{"gemini-3-flash":90,"llama-120b":50,"llama-70b":70}';
    const result = getWeightedProviders();
    expect(result[0]).toBe('gemini-3-flash');
    expect(result[1]).toBe('llama-70b');
    expect(result[2]).toBe('llama-120b');
  });

  test('invalid weights JSON → safe fallback to [llama-120b]', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.HYBRID_PROVIDER_WEIGHTS = 'not-valid-json';
    const result = getWeightedProviders();
    expect(result).toEqual(['llama-120b']);
  });

  test('no providers enabled → returns []', () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.HYBRID_PROVIDER_WEIGHTS;
    const result = getWeightedProviders();
    expect(result).toEqual([]);
  });

  test('Groq-only never includes non-Groq providers', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    delete process.env.HYBRID_PROVIDER_WEIGHTS;
    const result = getWeightedProviders();
    result.forEach((name) => {
      expect(PROVIDERS[name].type).toBe('groq');
    });
  });
});
