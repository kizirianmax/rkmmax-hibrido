/**
 * Tests for src/config/modelPriority.js
 * Validates AUTO_PRIORITY_ORDER and MANUAL_MODEL_OPTIONS structure,
 * and verifies getAutoProviderChain filtering behaviour indirectly.
 */
import { AUTO_PRIORITY_ORDER, MANUAL_MODEL_OPTIONS } from '../../src/config/modelPriority.js';
import { PROVIDERS } from '../lib/providers-config.js';

describe('AUTO_PRIORITY_ORDER', () => {
  test('has 5 entries', () => {
    expect(AUTO_PRIORITY_ORDER.length).toBe(5);
  });

  test('first entry is gemini-3-flash', () => {
    expect(AUTO_PRIORITY_ORDER[0].id).toBe('gemini-3-flash');
    expect(AUTO_PRIORITY_ORDER[0].providerName).toBe('gemini-3-flash');
    expect(AUTO_PRIORITY_ORDER[0].label).toBe('Gemini 3 Flash');
  });

  test('second entry is gemini-3.1-pro', () => {
    expect(AUTO_PRIORITY_ORDER[1].id).toBe('gemini-3.1-pro');
    expect(AUTO_PRIORITY_ORDER[1].providerName).toBe('gemini-3.1-pro');
    expect(AUTO_PRIORITY_ORDER[1].label).toBe('Gemini 3.1 Pro');
  });

  test('third entry is gemini-pro (Gemini 2.5 Pro)', () => {
    expect(AUTO_PRIORITY_ORDER[2].id).toBe('gemini-pro');
    expect(AUTO_PRIORITY_ORDER[2].label).toBe('Gemini 2.5 Pro');
  });

  test('fourth entry is llama-70b (Groq 70B)', () => {
    expect(AUTO_PRIORITY_ORDER[3].id).toBe('llama-70b');
    expect(AUTO_PRIORITY_ORDER[3].label).toBe('Groq 70B');
  });

  test('fifth entry is llama-120b (Groq 120B)', () => {
    expect(AUTO_PRIORITY_ORDER[4].id).toBe('llama-120b');
    expect(AUTO_PRIORITY_ORDER[4].label).toBe('Groq 120B');
  });

  test('every entry has required fields: id, providerName, label, icon', () => {
    AUTO_PRIORITY_ORDER.forEach((entry) => {
      expect(entry.id).toBeDefined();
      expect(entry.providerName).toBeDefined();
      expect(entry.label).toBeDefined();
      expect(entry.icon).toBeDefined();
    });
  });

  test('every providerName exists in PROVIDERS config', () => {
    AUTO_PRIORITY_ORDER.forEach((entry) => {
      expect(PROVIDERS[entry.providerName]).toBeDefined();
    });
  });

  test('id and providerName match for each entry', () => {
    AUTO_PRIORITY_ORDER.forEach((entry) => {
      expect(entry.id).toBe(entry.providerName);
    });
  });
});

describe('MANUAL_MODEL_OPTIONS', () => {
  test('has 6 entries (auto + 5 models)', () => {
    expect(MANUAL_MODEL_OPTIONS.length).toBe(6);
  });

  test('first entry is auto mode', () => {
    expect(MANUAL_MODEL_OPTIONS[0].id).toBe('auto');
    expect(MANUAL_MODEL_OPTIONS[0].providerName).toBeNull();
    expect(MANUAL_MODEL_OPTIONS[0].label).toBe('Automático');
  });

  test('remaining entries match AUTO_PRIORITY_ORDER', () => {
    const manual = MANUAL_MODEL_OPTIONS.slice(1);
    expect(manual).toEqual(AUTO_PRIORITY_ORDER);
  });

  test('every entry has required fields: id, label, icon', () => {
    MANUAL_MODEL_OPTIONS.forEach((entry) => {
      expect(entry.id).toBeDefined();
      expect(entry.label).toBeDefined();
      expect(entry.icon).toBeDefined();
    });
  });
});

describe('getAutoProviderChain (via AUTO_PRIORITY_ORDER filter)', () => {
  // Simulates the getAutoProviderChain logic without needing to export it
  function getAutoProviderChain(enabledProviders) {
    return AUTO_PRIORITY_ORDER
      .map(m => m.providerName)
      .filter(p => enabledProviders.includes(p));
  }

  test('returns all providers when all are enabled', () => {
    const enabled = AUTO_PRIORITY_ORDER.map(m => m.providerName);
    const chain = getAutoProviderChain(enabled);
    expect(chain).toEqual(enabled);
  });

  test('filters out disabled providers while preserving order', () => {
    const enabled = ['gemini-pro', 'llama-70b', 'llama-120b'];
    const chain = getAutoProviderChain(enabled);
    expect(chain).toEqual(['gemini-pro', 'llama-70b', 'llama-120b']);
  });

  test('returns empty array when no providers are enabled', () => {
    const chain = getAutoProviderChain([]);
    expect(chain).toEqual([]);
  });

  test('returns gemini-3-flash first when available', () => {
    const enabled = ['gemini-3-flash', 'llama-70b'];
    const chain = getAutoProviderChain(enabled);
    expect(chain[0]).toBe('gemini-3-flash');
  });

  test('skips gemini-3-flash and uses gemini-3.1-pro when flash is disabled', () => {
    const enabled = ['gemini-3.1-pro', 'llama-70b'];
    const chain = getAutoProviderChain(enabled);
    expect(chain[0]).toBe('gemini-3.1-pro');
  });
});
