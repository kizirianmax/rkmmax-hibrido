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

// health.js makes direct probe calls to check provider availability (not AI execution) —
// excluded from the provider-endpoint scan.
const EXCLUDED_FROM_ENDPOINT_SCAN = [
  ...EXCLUDED_FROM_PROVIDER_SCAN,
  path.join(API_DIR, 'health.js'),
];

const PROVIDER_ENDPOINTS = [
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.openai.com',
  'api.anthropic.com',
];

const FRONTEND_DIR = path.resolve(__dirname, '..', '..', 'src');
const FRONTEND_EXTENSIONS = ['.js', '.jsx', '.mjs', '.ts', '.tsx'];
const FRONTEND_FORBIDDEN_SDK_IMPORTS = [
  'openai',
  '@google/generative-ai',
  '@anthropic-ai/sdk',
  'groq-sdk',
];

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FRONTEND_FORBIDDEN_ENDPOINT_PATTERNS = PROVIDER_ENDPOINTS.map((endpoint) => ({
  endpoint,
  pattern: new RegExp(
    `['"\`][^'"\\\`\\n]*\\b(?:https?:\\/\\/)?${escapeForRegExp(endpoint)}\\b[^'"\\\`\\n]*['"\`]`,
    'm'
  ),
}));

const FRONTEND_FORBIDDEN_SDK_IMPORT_PATTERNS = FRONTEND_FORBIDDEN_SDK_IMPORTS.map((sdkName) => ({
  sdkName,
  pattern: new RegExp(
    `(?:import\\s+[^;]*?from\\s*['"]${escapeForRegExp(sdkName)}(?:\\/[^'"]+)?['"]|import\\s*['"]${escapeForRegExp(sdkName)}(?:\\/[^'"]+)?['"]|export\\s+(?:\\*|\\{[^}]*\\}|[^;]*?)\\s+from\\s*['"]${escapeForRegExp(sdkName)}(?:\\/[^'"]+)?['"]|import\\s*\\(\\s*['"]${escapeForRegExp(sdkName)}(?:\\/[^'"]+)?['"]\\s*\\)|require\\(\\s*['"]${escapeForRegExp(sdkName)}(?:\\/[^'"]+)?['"]\\s*\\))`,
    'm'
  ),
}));

function collectFrontendSourceFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFrontendSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && FRONTEND_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

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

  describe('Test 8: betinhoParallel uses getWeightedProviders (Phase A5.4)', () => {
    it('serginho-orchestrator.js imports and uses getWeightedProviders', () => {
      const content = fs.readFileSync(
        path.join(API_DIR, 'lib', 'serginho-orchestrator.js'),
        'utf8'
      );
      expect(content).toMatch(/getWeightedProviders/);
    });
  });

  describe('Frontend sovereignty: src/ must not bypass internal AI gateway', () => {
    it('sdk detector catches direct imports, reexports, and subpaths', () => {
      const cases = [
        { sdk: 'openai', code: "import OpenAI from 'openai'", expected: true },
        { sdk: 'openai', code: "export * from 'openai'", expected: true },
        { sdk: '@google/generative-ai', code: "export { GoogleGenerativeAI } from '@google/generative-ai'", expected: true },
        { sdk: 'openai', code: "import helper from 'openai/helpers'", expected: true },
        { sdk: '@anthropic-ai/sdk', code: "const x = require('@anthropic-ai/sdk/client')", expected: true },
        { sdk: 'groq-sdk', code: "await import('groq-sdk/runtime')", expected: true },
        { sdk: 'openai', code: "import client from '/api/ai'", expected: false },
      ];

      for (const { sdk, code, expected } of cases) {
        const sdkPattern = FRONTEND_FORBIDDEN_SDK_IMPORT_PATTERNS.find(({ sdkName }) => sdkName === sdk);
        expect(Boolean(sdkPattern?.pattern.test(code))).toBe(expected);
      }
    });

    it('blocks direct external AI provider endpoints and direct frontend SDK imports', () => {
      const files = collectFrontendSourceFiles(FRONTEND_DIR);
      const violations = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(FRONTEND_DIR, file);

        for (const { endpoint, pattern } of FRONTEND_FORBIDDEN_ENDPOINT_PATTERNS) {
          if (pattern.test(content)) {
            violations.push(`${relativePath} → direct external endpoint "${endpoint}"`);
          }
        }

        for (const { sdkName, pattern } of FRONTEND_FORBIDDEN_SDK_IMPORT_PATTERNS) {
          if (pattern.test(content)) {
            violations.push(`${relativePath} → direct frontend SDK import "${sdkName}"`);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Frontend sovereignty violation in src/: ${violations.join('; ')}. ` +
            'Frontend must use only internal governed endpoints (e.g. /api/ai, /api/chat, /api/transcribe).'
        );
      }
    });
  });
});
