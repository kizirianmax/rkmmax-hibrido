/**
 * Tests for api/lib/auth.js
 */

import { verifyAuth } from '../lib/auth.js';

function mockReq(authHeader) {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

describe('verifyAuth', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origVercelEnv = process.env.VERCEL_ENV;
  const origSupabaseUrl = process.env.SUPABASE_URL;
  const origSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
    if (origVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = origVercelEnv;
    }
    if (origSupabaseUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = origSupabaseUrl;
    }
    if (origSupabaseKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = origSupabaseKey;
    }
  });

  test('token ausente em produção → missing_token', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL_ENV;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = mockReq(null);
    const result = await verifyAuth(req);
    expect(result).toEqual({ user: null, error: 'missing_token' });
  });

  test('header sem Bearer em produção → missing_token', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL_ENV;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = mockReq('token-sem-bearer');
    const result = await verifyAuth(req);
    expect(result).toEqual({ user: null, error: 'missing_token' });
  });

  test('token ausente em dev local sem Supabase → fallback dev (não quebra desenvolvimento)', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.VERCEL_ENV;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = mockReq(null);
    const result = await verifyAuth(req);
    expect(result.error).toBeNull();
    expect(result.user).toEqual({ id: 'dev-local', email: 'dev@localhost' });
  });

  test('produção (NODE_ENV=production) sem env vars com token → auth_unavailable (fail-closed)', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL_ENV;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = mockReq('Bearer some-token');
    const result = await verifyAuth(req);
    expect(result).toEqual({ user: null, error: 'auth_unavailable' });
  });

  test('Vercel deploy (VERCEL_ENV=preview) sem env vars com token → auth_unavailable (fail-closed)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'preview';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = mockReq('Bearer some-token');
    const result = await verifyAuth(req);
    expect(result).toEqual({ user: null, error: 'auth_unavailable' });
  });

  test('dev local puro (sem NODE_ENV=production e sem VERCEL_ENV) sem env vars com token → fallback dev', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.VERCEL_ENV;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = mockReq('Bearer some-token');
    const result = await verifyAuth(req);
    expect(result.error).toBeNull();
    expect(result.user).toEqual({ id: 'dev-local', email: 'dev@localhost' });
  });
});
