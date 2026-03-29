/**
 * Tests for api/abnt-extract-url.js
 *
 * Strategy: test the pure/synchronous logic (validateUrl, generateABNTReference)
 * and the HTTP handler in isolation via mocks, without real network calls.
 *
 * Functions under test:
 *   - validateUrl (SSRF guard — pure, synchronous)
 *   - generateABNTReference (ABNT formatter — pure, synchronous)
 *   - handler (HTTP entry point — async, mocked DNS + fetch)
 */

import { jest } from '@jest/globals';

// ─── Mock dns module before importing the module under test ───────────────────
const mockLookup = jest.fn();
jest.unstable_mockModule('node:dns', () => ({
  default: { promises: { lookup: mockLookup } },
  promises: { lookup: mockLookup },
}));

// ─── Mock fetch for handler tests ─────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Import module under test (after mocks are set up) ────────────────────────
const { default: handler } = await import('../abnt-extract-url.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function makeReq(method = 'POST', body = {}) {
  return { method, body };
}

function makeHtmlResponse(html, opts = {}) {
  const chunks = [new TextEncoder().encode(html)];
  let idx = 0;
  return {
    ok: true,
    status: 200,
    type: 'default',
    headers: { get: () => null },
    body: {
      getReader: () => ({
        read: jest.fn(async () => {
          if (idx < chunks.length) return { done: false, value: chunks[idx++] };
          return { done: true };
        }),
        cancel: jest.fn(),
      }),
    },
    ...opts,
  };
}

// ─── validateUrl — SSRF guard ─────────────────────────────────────────────────
describe('validateUrl (SSRF guard)', () => {
  // We exercise validateUrl indirectly through the handler; for direct access
  // we test via handler with mocked DNS that resolves cleanly.

  test('rejects non-http/https protocols via handler', async () => {
    const req = makeReq('POST', { url: 'ftp://example.com/file' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('rejects localhost via handler', async () => {
    const req = makeReq('POST', { url: 'http://localhost/admin' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('rejects RFC1918 address 10.x via handler', async () => {
    const req = makeReq('POST', { url: 'http://10.0.0.1/secret' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects RFC1918 address 192.168.x via handler', async () => {
    const req = makeReq('POST', { url: 'http://192.168.1.1/' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects malformed URL via handler', async () => {
    const req = makeReq('POST', { url: 'not-a-url' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── handler — HTTP method guard ──────────────────────────────────────────────
describe('handler — HTTP method guard', () => {
  test('returns 405 for GET requests', async () => {
    const req = makeReq('GET', {});
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Method not allowed' })
    );
  });

  test('returns 400 when url is missing', async () => {
    const req = makeReq('POST', {});
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'URL é obrigatória.' })
    );
  });
});

// ─── handler — DNS rebinding guard ────────────────────────────────────────────
describe('handler — DNS rebinding guard', () => {
  test('blocks URL whose hostname resolves to a private IP', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }]);
    const req = makeReq('POST', { url: 'http://evil.example.com/' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('blocks URL when DNS resolution fails', async () => {
    mockLookup.mockRejectedValueOnce(new Error('ENOTFOUND'));
    const req = makeReq('POST', { url: 'http://nonexistent.invalid/' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── handler — successful extraction ─────────────────────────────────────────
describe('handler — successful metadata extraction', () => {
  beforeEach(() => {
    // DNS resolves to a public IP
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  test('returns 200 with abntReference for a page with og:title and author', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Artigo de Teste" />
          <meta name="author" content="João Silva" />
          <meta property="article:published_time" content="2023-06-15T00:00:00Z" />
          <meta property="og:site_name" content="Portal Teste" />
        </head>
        <body></body>
      </html>
    `;
    mockFetch.mockResolvedValueOnce(makeHtmlResponse(html));

    const req = makeReq('POST', { url: 'https://example.com/artigo' });
    const res = makeRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.abntReference).toContain('Artigo de Teste');
    expect(jsonArg.abntReference).toContain('SILVA, João');
    expect(jsonArg.abntReference).toContain('Portal Teste');
    expect(jsonArg.abntReference).toContain('Disponível em:');
    expect(jsonArg.abntReference).toContain('Acesso em:');
  });

  test('returns 200 with abntReference even when author is absent', async () => {
    const html = `
      <html>
        <head>
          <title>Página Sem Autor</title>
          <meta property="og:site_name" content="Site X" />
        </head>
        <body></body>
      </html>
    `;
    mockFetch.mockResolvedValueOnce(makeHtmlResponse(html));

    const req = makeReq('POST', { url: 'https://sitex.com/pagina' });
    const res = makeRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    // Reference must NOT start with ". " when author is absent
    expect(jsonArg.abntReference).not.toMatch(/^\.\s/);
    expect(jsonArg.abntReference).toContain('Página Sem Autor');
  });

  test('returns 500 when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const req = makeReq('POST', { url: 'https://example.com/fail' });
    const res = makeRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});

// ─── generateABNTReference — pure logic ──────────────────────────────────────
// Tested indirectly above; this group validates edge cases via handler output.
describe('ABNT reference formatting edge cases', () => {
  beforeEach(() => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  test('single-word author is uppercased without inversion', async () => {
    const html = `
      <html><head>
        <title>Obra</title>
        <meta name="author" content="Platão" />
        <meta property="og:site_name" content="Filosofia" />
      </head></html>
    `;
    mockFetch.mockResolvedValueOnce(makeHtmlResponse(html));

    const req = makeReq('POST', { url: 'https://filosofia.com/obra' });
    const res = makeRes();
    await handler(req, res);

    const ref = res.json.mock.calls[0][0].abntReference;
    // Single-word author: uppercased as-is, no inversion (no "LAST, First" format)
    expect(ref).toContain('PLATÃO');
    // The comma in the reference comes from siteName separator, not from author inversion
    // Verify the author portion is NOT in "LAST, First" format
    expect(ref).not.toMatch(/PLATÃO,\s+\w/);
  });

  test('multi-word author uses LAST, First format', async () => {
    const html = `
      <html><head>
        <title>Livro</title>
        <meta name="author" content="Maria Aparecida Santos" />
        <meta property="og:site_name" content="Biblioteca" />
      </head></html>
    `;
    mockFetch.mockResolvedValueOnce(makeHtmlResponse(html));

    const req = makeReq('POST', { url: 'https://biblioteca.com/livro' });
    const res = makeRes();
    await handler(req, res);

    const ref = res.json.mock.calls[0][0].abntReference;
    expect(ref).toContain('SANTOS, Maria Aparecida');
  });
});
