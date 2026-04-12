/**
 * Tests for api/lib/cors.js
 */

import { applyCorsRestricted } from '../lib/cors.js';

function mockReq(method, origin) {
  return {
    method,
    headers: { origin: origin || '' },
  };
}

function mockRes() {
  const headers = {};
  const res = {
    _status: null,
    _ended: false,
    headers,
    setHeader(key, value) {
      headers[key] = value;
    },
    status(code) {
      res._status = code;
      return res;
    },
    end() {
      res._ended = true;
    },
  };
  return res;
}

describe('applyCorsRestricted', () => {
  test('origin permitida → header definido com a origin correta', () => {
    const req = mockReq('POST', 'https://kizirianmax.site');
    const res = mockRes();
    const handled = applyCorsRestricted(req, res);

    expect(handled).toBe(false);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://kizirianmax.site');
  });

  test('www subdomain permitido', () => {
    const req = mockReq('POST', 'https://www.kizirianmax.site');
    const res = mockRes();
    applyCorsRestricted(req, res);

    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://www.kizirianmax.site');
  });

  test('origin não permitida → header NÃO definido', () => {
    const req = mockReq('POST', 'https://evil.com');
    const res = mockRes();
    applyCorsRestricted(req, res);

    expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  test('origin ausente → header NÃO definido', () => {
    const req = mockReq('POST', '');
    const res = mockRes();
    applyCorsRestricted(req, res);

    expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  test('OPTIONS → responde 204 e retorna true', () => {
    const req = mockReq('OPTIONS', 'https://kizirianmax.site');
    const res = mockRes();
    const handled = applyCorsRestricted(req, res);

    expect(handled).toBe(true);
    expect(res._status).toBe(204);
    expect(res._ended).toBe(true);
  });

  test('Authorization presente em Access-Control-Allow-Headers', () => {
    const req = mockReq('POST', 'https://kizirianmax.site');
    const res = mockRes();
    applyCorsRestricted(req, res);

    const allowHeaders = res.headers['Access-Control-Allow-Headers'];
    expect(allowHeaders).toContain('Authorization');
  });

  test('Vary: Origin está sempre presente', () => {
    const req = mockReq('POST', 'https://evil.com');
    const res = mockRes();
    applyCorsRestricted(req, res);

    expect(res.headers['Vary']).toBe('Origin');
  });

  test('POST não-OPTIONS retorna false (continua execução)', () => {
    const req = mockReq('POST', 'https://rkmmax-app.vercel.app');
    const res = mockRes();
    const handled = applyCorsRestricted(req, res);

    expect(handled).toBe(false);
    expect(res._ended).toBe(false);
  });
});
