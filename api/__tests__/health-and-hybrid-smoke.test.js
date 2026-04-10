/**
 * Phase A5.5 — Health endpoint + Hybrid smoke test (incubadora-ready)
 *
 * Tests:
 * 1. Groq-only mode: fallback does not try Gemini providers
 * 2. getWeightedProviders defaults to llama-120b in Groq-only mode
 * 3. getNextFallback returns only providers from FALLBACK_CHAIN
 * 4. /api/health returns 200 with correct structure
 */
import { jest } from '@jest/globals';

// ─── Env var save/restore helpers ────────────────────────────────────────────
const ALL_KEYS = [
  'GROQ_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_API_KEY',
  'GERMINI_API_KEY',
  'HYBRID_PROVIDER_WEIGHTS',
  'VERCEL_GIT_COMMIT_SHA',
  'GIT_COMMIT_SHA',
  'NODE_ENV',
  'VERCEL_ENV',
];

function saveEnv(keys) {
  const saved = {};
  for (const k of keys) {
    saved[k] = process.env[k];
  }
  return saved;
}

function restoreEnv(saved) {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

function setGroqOnlyEnv() {
  process.env.GROQ_API_KEY = 'test-groq-key';
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GERMINI_API_KEY;
  delete process.env.HYBRID_PROVIDER_WEIGHTS;
}

// ─── Test 1: Groq-only mode: getEnabledProviders returns no Gemini providers ──
describe('Test 1 — Groq-only: fallback does not try Gemini providers', () => {
  let savedEnv;

  beforeAll(() => {
    savedEnv = saveEnv(ALL_KEYS);
    setGroqOnlyEnv();
  });

  afterAll(() => {
    restoreEnv(savedEnv);
  });

  it('getEnabledProviders returns no gemini-exp-1206 or gemini-2.0-flash', async () => {
    const { getEnabledProviders } = await import('../lib/providers-config.js');
    const enabled = getEnabledProviders();
    expect(enabled).not.toContain('gemini-exp-1206');
    expect(enabled).not.toContain('gemini-2.0-flash');
  });

  it('getWeightedProviders returns only Groq providers', async () => {
    const { getWeightedProviders, PROVIDERS } = await import('../lib/providers-config.js');
    const providers = getWeightedProviders();
    providers.forEach((name) => {
      expect(PROVIDERS[name].type).toBe('groq');
    });
  });
});

// ─── Test 2: getWeightedProviders defaults to llama-120b in Groq-only mode ───
describe('Test 2 — getWeightedProviders defaults to llama-120b in Groq-only mode', () => {
  let savedEnv;

  beforeAll(() => {
    savedEnv = saveEnv(ALL_KEYS);
    setGroqOnlyEnv();
  });

  afterAll(() => {
    restoreEnv(savedEnv);
  });

  it('getWeightedProviders returns exactly [llama-120b]', async () => {
    const { getWeightedProviders } = await import('../lib/providers-config.js');
    expect(getWeightedProviders()).toEqual(['llama-120b']);
  });
});

// ─── Test 3: getNextFallback returns only providers from FALLBACK_CHAIN ───────
describe('Test 3 — getNextFallback returns providers from FALLBACK_CHAIN', () => {
  // FALLBACK_CHAIN calibrado: llama-120b → gemini-pro → llama-70b → groq-fallback
  // O primeiro fallback do 120B agora é o gemini-pro (intercâmbio Groq ↔ Google).
  it('getNextFallback("llama-120b", []) returns "gemini-pro" (primeiro fallback do 120B)', async () => {
    const { getNextFallback } = await import('../../src/utils/intelligentRouter.js');
    expect(getNextFallback('llama-120b', [])).toBe('gemini-pro');
  });

  it('getNextFallback("llama-120b", ["gemini-pro"]) returns "llama-70b" (gemini já tentado)', async () => {
    const { getNextFallback } = await import('../../src/utils/intelligentRouter.js');
    expect(getNextFallback('llama-120b', ['gemini-pro'])).toBe('llama-70b');
  });

  it('getNextFallback("llama-120b", ["gemini-pro", "llama-70b"]) returns "groq-fallback"', async () => {
    const { getNextFallback } = await import('../../src/utils/intelligentRouter.js');
    expect(getNextFallback('llama-120b', ['gemini-pro', 'llama-70b'])).toBe('groq-fallback');
  });

  it('getNextFallback("groq-fallback", []) returns null (end of chain)', async () => {
    const { getNextFallback } = await import('../../src/utils/intelligentRouter.js');
    expect(getNextFallback('groq-fallback', [])).toBeNull();
  });

  // Testa o fallback do gemini-pro também
  it('getNextFallback("gemini-pro", []) returns "llama-120b" (primeiro fallback do Gemini)', async () => {
    const { getNextFallback } = await import('../../src/utils/intelligentRouter.js');
    expect(getNextFallback('gemini-pro', [])).toBe('llama-120b');
  });
});

// ─── Test 4: /api/health returns 200 with correct structure ──────────────────
describe('Test 4 — /api/health returns 200 with correct structure', () => {
  let savedEnv;

  beforeAll(() => {
    savedEnv = saveEnv(ALL_KEYS);
    setGroqOnlyEnv();
  });

  afterAll(() => {
    restoreEnv(savedEnv);
  });

  it('returns status 200 with all required fields', async () => {
    const { default: handler } = await import('../health.js');

    let responseStatus;
    let responseBody;

    const req = { method: 'GET' };
    const res = {
      setHeader: jest.fn(),
      status(code) {
        responseStatus = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    handler(req, res);

    expect(responseStatus).toBe(200);
    expect(responseBody).toHaveProperty('status', 'ok');
    expect(responseBody).toHaveProperty('service', 'rkmmax-hibrido');
    expect(responseBody).toHaveProperty('version', 'health-v1');
    expect(responseBody).toHaveProperty('environment');
    expect(responseBody).toHaveProperty('timestamp');
    expect(responseBody).toHaveProperty('commit');
    expect(responseBody).toHaveProperty('providers');
  });

  it('returns providers.groq true when GROQ_API_KEY is set', async () => {
    const { default: handler } = await import('../health.js');

    let responseBody;
    const req = { method: 'GET' };
    const res = {
      setHeader: jest.fn(),
      status() { return this; },
      json(body) { responseBody = body; return this; },
    };

    handler(req, res);

    expect(responseBody.providers.groq).toBe(true);
    expect(responseBody.providers.gemini).toBeUndefined();
    expect(responseBody.providers.groqOnly).toBeUndefined();
  });

  it('returns 405 for non-GET methods', async () => {
    const { default: handler } = await import('../health.js');

    let responseStatus;
    let responseBody;
    const req = { method: 'POST' };
    const res = {
      setHeader: jest.fn(),
      status(code) { responseStatus = code; return this; },
      json(body) { responseBody = body; return this; },
    };

    handler(req, res);

    expect(responseStatus).toBe(405);
    expect(responseBody).toHaveProperty('error');
  });
});
