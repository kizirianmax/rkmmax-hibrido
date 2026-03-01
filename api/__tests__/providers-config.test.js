import { jest } from '@jest/globals';
import { 
  PROVIDERS, 
  getProviderConfig, 
  getProvidersByTier, 
  getAllProviderNames 
} from '../lib/providers-config.js';

// Mock environment variables
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.GROQ_API_KEY = 'test-groq-key';

describe('providers-config', () => {
  describe('PROVIDERS constant', () => {
    test('contains all expected providers', () => {
      const providerNames = Object.keys(PROVIDERS);
      expect(providerNames).toContain('llama-120b');
      expect(providerNames).toContain('llama-70b');
      expect(providerNames).toContain('llama-8b');
      expect(providerNames).toContain('gemini-exp-1206');
      expect(providerNames).toContain('gemini-2.0-flash');
      expect(providerNames).toContain('groq-fallback');
    });

    test('each provider has required fields', () => {
      Object.entries(PROVIDERS).forEach(([name, config]) => {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('model');
        expect(config).toHaveProperty('tier');
        
        // Either endpoint or it should be Gemini (dynamically set)
        // Fix: avoid conditional expect (jest/no-conditional-expect)
        // Gemini endpoints are null (set dynamically); all others must be truthy
        const endpointIsValid =
          config.type === 'gemini' ? config.endpoint === null : Boolean(config.endpoint);
        expect(endpointIsValid).toBe(true);
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

    test('Gemini providers have correct configuration', () => {
      const geminiProviders = ['gemini-exp-1206', 'gemini-2.0-flash'];
      
      geminiProviders.forEach(provider => {
        const config = PROVIDERS[provider];
        expect(config.type).toBe('gemini');
        expect(config.generationConfig).toBeDefined();
        expect(config.generationConfig).toHaveProperty('temperature');
        expect(config.generationConfig).toHaveProperty('maxOutputTokens');
      });
    });

    test('tiers are correctly assigned', () => {
      expect(PROVIDERS['llama-120b'].tier).toBe('complex');
      expect(PROVIDERS['llama-70b'].tier).toBe('medium');
      expect(PROVIDERS['llama-8b'].tier).toBe('simple');
      expect(PROVIDERS['gemini-exp-1206'].tier).toBe('genius');
      expect(PROVIDERS['gemini-2.0-flash'].tier).toBe('optimized');
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

    test('sets Gemini endpoint dynamically with API key', () => {
      const config = getProviderConfig('gemini-2.0-flash');
      expect(config.endpoint).toBeTruthy();
      expect(config.endpoint).toContain('generativelanguage.googleapis.com');
      expect(config.endpoint).toContain('gemini-2.0-flash');
      expect(config.endpoint).toContain(process.env.GOOGLE_API_KEY);
    });

    test('handles missing GOOGLE_API_KEY in test environment', () => {
      const originalKey = process.env.GOOGLE_API_KEY;
      const originalEnv = process.env.NODE_ENV;
      
      delete process.env.GOOGLE_API_KEY;
      process.env.NODE_ENV = 'test';
      
      // Should use 'test-key' in test environment
      const config = getProviderConfig('gemini-2.0-flash');
      expect(config.endpoint).toContain('test-key');
      
      // Restore
      process.env.GOOGLE_API_KEY = originalKey;
      process.env.NODE_ENV = originalEnv;
    });

    test('throws error for missing GOOGLE_API_KEY in production', () => {
      const originalKey = process.env.GOOGLE_API_KEY;
      const originalEnv = process.env.NODE_ENV;
      
      delete process.env.GOOGLE_API_KEY;
      process.env.NODE_ENV = 'production';
      
      expect(() => getProviderConfig('gemini-2.0-flash'))
        .toThrow('GOOGLE_API_KEY environment variable is required');
      
      // Restore
      process.env.GOOGLE_API_KEY = originalKey;
      process.env.NODE_ENV = originalEnv;
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

    test('returns providers for genius tier', () => {
      const providers = getProvidersByTier('genius');
      expect(providers).toContain('gemini-exp-1206');
    });

    test('returns providers for optimized tier', () => {
      const providers = getProvidersByTier('optimized');
      expect(providers).toContain('gemini-2.0-flash');
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
      expect(names).toContain('gemini-exp-1206');
      expect(names).toContain('gemini-2.0-flash');
      expect(names).toContain('groq-fallback');
    });

    test('returns correct number of providers', () => {
      const names = getAllProviderNames();
      expect(names.length).toBe(6);
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
      // Currently using 70B until 120B is available
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

    test('Gemini providers use correct models', () => {
      const exp = getProviderConfig('gemini-exp-1206');
      expect(exp.model).toBe('gemini-exp-1206');

      const flash = getProviderConfig('gemini-2.0-flash');
      expect(flash.model).toBe('gemini-2.0-flash');
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

    test('Gemini providers have generation config', () => {
      ['gemini-exp-1206', 'gemini-2.0-flash'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.generationConfig).toBeDefined();
        expect(config.generationConfig.temperature).toBeDefined();
        expect(config.generationConfig.maxOutputTokens).toBeDefined();
      });
    });
  });

  describe('Endpoints', () => {
    test('Groq providers use correct endpoint', () => {
      ['llama-120b', 'llama-70b', 'llama-8b', 'groq-fallback'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.endpoint).toBe('https://api.groq.com/openai/v1/chat/completions');
      });
    });

    test('Gemini providers have generativelanguage endpoint', () => {
      ['gemini-exp-1206', 'gemini-2.0-flash'].forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config.endpoint).toContain('generativelanguage.googleapis.com');
        expect(config.endpoint).toContain(':generateContent');
      });
    });
  });
});
