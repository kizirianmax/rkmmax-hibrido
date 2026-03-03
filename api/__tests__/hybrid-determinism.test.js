/**
 * Phase A5.5 — Hybrid Smoke Test (Groq-only, default 120B)
 *
 * CI-enforceable smoke tests validating that /api/hybrid is 100% deterministic
 * with Groq-only env and default llama-120b selection.
 */
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Env var save/restore helpers ────────────────────────────────────────────
const GROQ_ONLY_KEYS = [
  'GROQ_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_API_KEY',
  'GERMINI_API_KEY',
  'HYBRID_PROVIDER_WEIGHTS',
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

// ─── Test A: Integration mocked ──────────────────────────────────────────────
describe('Test A — betinhoParallel single-provider mode (mocked)', () => {
  let savedEnv;

  beforeAll(() => {
    savedEnv = saveEnv(GROQ_ONLY_KEYS);
    setGroqOnlyEnv();
  });

  afterAll(() => {
    restoreEnv(savedEnv);
  });

  it('calls handleRequest exactly once with forceProvider llama-120b and returns source:single', async () => {
    const serginho = (await import('../lib/serginho-orchestrator.js')).default;

    const mockResponse = {
      text: 'mock-response',
      model: { logicalTier: 'complex', infrastructure: 'groq', modelId: 'llama-3.3-70b-versatile' },
      execution: { status: 'success' },
      routing: { cacheHit: false },
      usage: {},
      _meta: {},
    };

    const original = serginho.handleRequest.bind(serginho);
    serginho.handleRequest = jest.fn().mockResolvedValue(mockResponse);

    try {
      const result = await serginho.betinhoParallel('ping', { messages: [], context: {} });

      expect(serginho.handleRequest).toHaveBeenCalledTimes(1);
      const callArg = serginho.handleRequest.mock.calls[0][0];
      expect(callArg.options.forceProvider).toBe('llama-120b');
      expect(result.source).toBe('single');
      expect(result._betinhoParallel).toBe(true);
    } finally {
      serginho.handleRequest = original;
    }
  });
});

// ─── Test B: Unit — getWeightedProviders ─────────────────────────────────────
describe('Test B — getWeightedProviders() Groq-only returns [llama-120b]', () => {
  let savedEnv;

  beforeAll(() => {
    savedEnv = saveEnv(GROQ_ONLY_KEYS);
    setGroqOnlyEnv();
  });

  afterAll(() => {
    restoreEnv(savedEnv);
  });

  it('returns exactly [llama-120b] in Groq-only mode', async () => {
    const { getWeightedProviders, PROVIDERS } = await import('../lib/providers-config.js');
    const result = getWeightedProviders();
    expect(result).toEqual(['llama-120b']);
    result.forEach((name) => {
      expect(PROVIDERS[name].type).not.toBe('gemini');
    });
  });
});

// ─── Test C.1: Unit — getEnabledProviders ────────────────────────────────────
describe('Test C.1 — getEnabledProviders() Groq-only returns only groq providers', () => {
  let savedEnv;

  beforeAll(() => {
    savedEnv = saveEnv(GROQ_ONLY_KEYS);
    setGroqOnlyEnv();
  });

  afterAll(() => {
    restoreEnv(savedEnv);
  });

  it('returns only groq-type providers and none are gemini', async () => {
    const { getEnabledProviders, PROVIDERS } = await import('../lib/providers-config.js');
    const result = getEnabledProviders();
    expect(result.length).toBeGreaterThan(0);
    result.forEach((name) => {
      expect(PROVIDERS[name].type).toBe('groq');
      expect(PROVIDERS[name].type).not.toBe('gemini');
    });
  });
});

// ─── Test C.2: Static — no top-level mandatory Gemini key guards ──────────────
describe('Test C.2 — No top-level mandatory Gemini key guards in serginho-orchestrator.js', () => {
  it('has no lines before the class keyword that both reference a Gemini key AND contain throw/required', () => {
    const filePath = path.resolve(__dirname, '../lib/serginho-orchestrator.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Find the position of the first `class ` keyword
    const classIdx = content.indexOf('\nclass ');
    const topLevel = classIdx === -1 ? content : content.slice(0, classIdx);

    const geminiKeyPattern = /GOOGLE_API_KEY|GEMINI_API_KEY|GERMINI_API_KEY/;
    const guardPattern = /throw|required/i;

    const violations = topLevel
      .split('\n')
      .filter((line) => geminiKeyPattern.test(line) && guardPattern.test(line));

    expect(violations).toEqual([]);
  });
});

// ─── Test D: Static — betinhoParallel uses getWeightedProviders ──────────────
describe('Test D — betinhoParallel() uses getWeightedProviders(), not getEnabledProviders() directly', () => {
  it('betinhoParallel body references getWeightedProviders but not getEnabledProviders', () => {
    const filePath = path.resolve(__dirname, '../lib/serginho-orchestrator.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const methodStart = content.indexOf('async betinhoParallel(');
    expect(methodStart).toBeGreaterThan(-1);

    const methodBody = content.slice(methodStart, methodStart + 800);

    expect(methodBody).toContain('getWeightedProviders()');
    expect(methodBody).not.toContain('getEnabledProviders()');
  });
});

// ─── Test E: Phase A5.6 — Fallback uses providerName + skips disabled ─────────
describe('Test E — _handleStructured fallback uses providerName and skips disabled providers', () => {
  it('attemptedModels entries contain providerName field', () => {
    const filePath = path.resolve(__dirname, '../lib/serginho-orchestrator.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Both push calls inside _handleStructured must include providerName
    const successPushMatch = content.match(/attemptedModels\.push\(\{[^}]*providerName: currentProvider[^}]*status: 'success'/s);
    const failedPushMatch = content.match(/attemptedModels\.push\(\{[^}]*providerName: currentProvider[^}]*status: 'failed'/s);

    expect(successPushMatch).not.toBeNull();
    expect(failedPushMatch).not.toBeNull();
  });

  it('getNextFallback call uses providerName array, not modelId array', () => {
    const filePath = path.resolve(__dirname, '../lib/serginho-orchestrator.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Must reference providerName in the getNextFallback call (flexible whitespace)
    expect(/getNextFallback\s*\(\s*currentProvider\s*,\s*attemptedModels\.map\s*\(\s*a\s*=>\s*a\.providerName\s*\)\s*\)/.test(content)).toBe(true);
    // Must NOT use modelId in any getNextFallback call (not in a comment)
    const nonCommentLines = content.split('\n').filter(l => !l.trimStart().startsWith('//'));
    const hasModelIdInFallback = nonCommentLines.some(l => /getNextFallback/.test(l) && /a\.modelId/.test(l));
    expect(hasModelIdInFallback).toBe(false);
  });

  it('skips disabled providers in fallback loop (Groq-only: never attempts Gemini)', () => {
    const filePath = path.resolve(__dirname, '../lib/serginho-orchestrator.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // The while-loop that skips disabled providers must exist
    expect(content).toContain('while (nextProvider && !enabledProviders.includes(nextProvider))');
    expect(content).toContain('Skipping disabled provider:');
  });
});
