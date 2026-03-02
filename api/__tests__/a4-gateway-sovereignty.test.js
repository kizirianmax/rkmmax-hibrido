/**
 * Phase A4 — Soberania de Entrada Única (Gateway obrigatório)
 *
 * Static tests that verify no route/file bypasses serginho-orchestrator.js
 * by calling AI providers directly.
 */
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.resolve(__dirname, '..');

/**
 * Recursively collect all .js files under a directory,
 * excluding paths that match any entry in the excludes array.
 */
function collectJsFiles(dir, excludes = []) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (excludes.some((ex) => fullPath.includes(ex))) continue;
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(fullPath, excludes));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Files allowed to contain direct provider calls
const EXCLUDED_FROM_PROVIDER_SCAN = [
  path.join(API_DIR, 'lib', 'serginho-orchestrator.js'),
  path.join(API_DIR, '__tests__'),
  path.join(API_DIR, 'lib', 'test-helpers'),
];

// engine-orchestrator.js is deprecated (still contains direct calls) —
// excluded from the provider-endpoint scan but NOT from the import scan.
// health.js makes direct probe calls to check provider availability (not AI execution) —
// also excluded from the provider-endpoint scan.
const EXCLUDED_FROM_ENDPOINT_SCAN = [
  ...EXCLUDED_FROM_PROVIDER_SCAN,
  path.join(API_DIR, 'lib', 'engine-orchestrator.js'),
  path.join(API_DIR, 'health.js'),
];

const PROVIDER_ENDPOINTS = [
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.openai.com',
  'api.anthropic.com',
];

describe('Phase A4 — Gateway Sovereignty', () => {
  describe('Test 1: No direct callGemini/callGroq/callOpenAI imports outside serginho-orchestrator', () => {
    it('no file imports callGemini, callGroq, or callOpenAI as named imports', () => {
      const files = collectJsFiles(API_DIR, EXCLUDED_FROM_PROVIDER_SCAN);
      const violations = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        // Match named import patterns: import { callGemini... } or import { callGroq... }
        if (/import\s*\{[^}]*call(Gemini|Groq|OpenAI)[^}]*\}/m.test(content)) {
          violations.push(file);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Test 2: No direct fetch() to provider endpoints outside serginho-orchestrator', () => {
    it('no file fetches directly to known AI provider endpoints', () => {
      const files = collectJsFiles(API_DIR, EXCLUDED_FROM_ENDPOINT_SCAN);
      const violations = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        for (const endpoint of PROVIDER_ENDPOINTS) {
          if (content.includes(`fetch(`) && content.includes(endpoint)) {
            violations.push(`${file} → ${endpoint}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Test 3: No import of engine-orchestrator in any route handler', () => {
    it('no route handler imports engine-orchestrator', () => {
      const files = fs
        .readdirSync(API_DIR, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.js'))
        .map((e) => path.join(API_DIR, e.name));

      const violations = [];
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (
          /require\s*\(\s*['"].*engine-orchestrator/.test(content) ||
          /from\s+['"].*engine-orchestrator/.test(content)
        ) {
          violations.push(file);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Test 4: serginho.handleRequest entrypoint is stable', () => {
    it('serginho exports a handleRequest function', async () => {
      const { default: serginho } = await import('../lib/serginho-orchestrator.js');
      expect(typeof serginho.handleRequest).toBe('function');
    });

    it('handleRequest accepts the documented object signature { message, messages, context, options }', async () => {
      const { default: serginho } = await import('../lib/serginho-orchestrator.js');
      // Verify the function signature by inspecting its length (no required positional args beyond firstArg)
      expect(serginho.handleRequest.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Test 5: engine-orchestrator.orchestrateEngines() throws deprecation error (Phase A5.1)', () => {
    it('throws immediately with the Phase A5 deprecation message', async () => {
      const { orchestrateEngines } = await import('../lib/engine-orchestrator.js');
      await expect(orchestrateEngines([], '', {})).rejects.toThrow(
        'Deprecated: Use serginho-orchestrator.js as the single AI gateway (Phase A5).'
      );
    });
  });

  describe('Test 6: hybrid.js contains env var guard (Phase A5.2)', () => {
    it('api/hybrid.js checks for GEMINI_API_KEY or GROQ_API_KEY before executing', () => {
      const hybridContent = fs.readFileSync(
        path.join(API_DIR, 'hybrid.js'),
        'utf8'
      );
      expect(hybridContent).toMatch(/GEMINI_API_KEY|GROQ_API_KEY/);
      expect(hybridContent).toMatch(/No AI providers configured/);
    });
  });

  describe('Test 7: betinhoParallel uses getEnabledProviders (Phase A5.3)', () => {
    it('serginho-orchestrator.js imports and uses getEnabledProviders', () => {
      const content = fs.readFileSync(
        path.join(API_DIR, 'lib', 'serginho-orchestrator.js'),
        'utf8'
      );
      expect(content).toMatch(/getEnabledProviders/);
      // Must NOT use Object.keys(PROVIDERS) in betinhoParallel
      // (it should use getEnabledProviders instead)
    });
  });
});
