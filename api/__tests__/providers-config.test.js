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
      expect(providerNames).toContain('llama-8b');
      expect(providerNames).toContain('groq-fallback');
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
      const groqProviders = ['llama-120b', 'llama-70b', 'llama-8b', 'groq-fallback'];
      
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
      expect(PROVIDERS['llama-8b'].tier).toBe('simple');
      expect(PROVIDERS['groq-fallback'].tier).toBe('fallback');
    });
  });

  describe('getProviderConfig', () => {
    test('returns provider config for valid provider', () => {
      const config = getProviderConfig('llama-8b');
      expect(config).toBeDefined();
      expect(config.type).toBe('groq');
      expect(config.model).toBe('llama-3.1-8b-instant');
    });

    test('throws error for unknown provider', () => {
      expect(() => getProviderConfig('unknown-provider')).toThrow('Unknown provider: unknown-provider');
    });

    test('returns cloned config to prevent mutations', () => {
      const config1 = getProviderConfig('llama-8b');
      const config2 = getProviderConfig('llama-8b');
      
      config1.customField = 'test';
      expect(config2.customField).toBeUndefined();
    });
  });

  describe('getProvidersByTier', () => {
    test('returns providers for complex tier', () => {
      const providers = getProvidersByTier('complex');
      expect(providers).toContain('llama-120b');
      expect(providers.length).toBeGreaterThan(0);
    });

    test('returns providers for medium tier', () => {
      const providers = getProvidersByTier('medium');
      expect(providers).toContain('llama-70b');
    });

    test('returns providers for simple tier', () => {
      const providers = getProvidersByTier('simple');
      expect(providers).toContain('llama-8b');
    });

    test('returns providers for fallback tier', () => {
      const providers = getProvidersByTier('fallback');
      expect(providers).toContain('groq-fallback');
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
      expect(names).toContain('llama-8b');
      expect(names).toContain('groq-fallback');
    });

    test('returns correct number of providers', () => {
      const names = getAllProviderNames();
      expect(names.length).toBe(4);
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
      expect(config.model).toBe('llama-3.3-70b-versatile');
    });

    test('Llama 70B uses correct model', () => {
      const config = getProviderConfig('llama-70b');
      expect(config.model).toBe('llama-3.3-70b-versatile');
    });

    test('Llama 8B uses correct model', () => {
      const config = getProviderConfig('llama-8b');
      expect(config.model).toBe('llama-3.1-8b-instant');
    });

    test('Groq fallback uses Mixtral', () => {
      const config = getProviderConfig('groq-fallback');
      expect(config.model).toBe('mixtral-8x7b-32768');
    });
  });

  describe('Default parameters', () => {
    test('each Groq provider has temperature', () => {
      ['llama-120b', 'llama-70b', 'llama-8b', 'groq-fallback'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.defaultParams.temperature).toBeDefined();
        expect(typeof config.defaultParams.temperature).toBe('number');
      });
    });

    test('each Groq provider has max_tokens', () => {
      ['llama-120b', 'llama-70b', 'llama-8b', 'groq-fallback'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.defaultParams.max_tokens).toBeDefined();
        expect(typeof config.defaultParams.max_tokens).toBe('number');
      });
    });

    test('complex tier has higher max_tokens than simple', () => {
      const complex = getProviderConfig('llama-120b');
      const simple = getProviderConfig('llama-8b');
      expect(complex.defaultParams.max_tokens).toBeGreaterThan(simple.defaultParams.max_tokens);
    });
  });

  describe('Endpoints', () => {
    test('Groq providers use correct endpoint', () => {
      ['llama-120b', 'llama-70b', 'llama-8b', 'groq-fallback'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.endpoint).toBe('https://api.groq.com/openai/v1/chat/completions');
      });
    });
  });
});

describe('getEnabledProviders', () => {
  const originalGroq = process.env.GROQ_API_KEY;

  afterEach(() => {
    if (originalGroq !== undefined) {
      process.env.GROQ_API_KEY = originalGroq;
    } else {
      delete process.env.GROQ_API_KEY;
    }
  });

  test('returns only groq providers when only GROQ_API_KEY is set', () => {
    process.env.GROQ_API_KEY = 'test-key';
    const enabled = getEnabledProviders();
    enabled.forEach(name => {
      expect(PROVIDERS[name].type).toBe('groq');
    });
    expect(enabled.length).toBeGreaterThan(0);
  });

  test('returns empty array when no API keys are set', () => {
    delete process.env.GROQ_API_KEY;
    const enabled = getEnabledProviders();
    expect(enabled).toEqual([]);
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
    process.env.HYBRID_PROVIDER_WEIGHTS = '{"llama-8b":90,"llama-120b":50,"llama-70b":70}';
    const result = getWeightedProviders();
    expect(result[0]).toBe('llama-8b');
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
