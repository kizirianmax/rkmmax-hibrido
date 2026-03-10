/**
 * api/__tests__/github.test.js
 * Testes unitários para a integração GitHub (flag + endpoints mínimos).
 */
import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Helpers de mock para req/res do Vercel serverless
// ---------------------------------------------------------------------------

function mockReq(method = 'GET', query = {}) {
  return { method, query };
}

function mockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    setHeader(key, val) {
      this._headers[key] = val;
      return this;
    },
  };
  return res;
}

// ---------------------------------------------------------------------------
// Testes: githubConfig.js
// ---------------------------------------------------------------------------

describe('githubConfig — getGitHubConfig()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('feature flag desabilitada por padrão (sem env)', async () => {
    delete process.env.GITHUB_INTEGRATION_ENABLED;
    const { getGitHubConfig } = await import('../lib/github/githubConfig.js');
    const config = getGitHubConfig();
    expect(config.enabled).toBe(false);
  });

  test('mode é "stub" quando flag true mas sem token', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN;
    const { getGitHubConfig } = await import('../lib/github/githubConfig.js');
    const config = getGitHubConfig();
    expect(config.enabled).toBe(true);
    expect(config.mode).toBe('stub');
    expect(config.hasToken).toBe(false);
  });

  test('mode é "oauth" quando flag true e token definido', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    process.env.GITHUB_TOKEN = 'ghp_fake_token_for_test';
    const { getGitHubConfig } = await import('../lib/github/githubConfig.js');
    const config = getGitHubConfig();
    expect(config.enabled).toBe(true);
    expect(config.mode).toBe('oauth');
    expect(config.hasToken).toBe(true);
  });

  test('nunca expõe o valor do token', async () => {
    process.env.GITHUB_TOKEN = 'ghp_super_secret';
    const { getGitHubConfig } = await import('../lib/github/githubConfig.js');
    const config = getGitHubConfig();
    const configStr = JSON.stringify(config);
    expect(configStr).not.toContain('ghp_super_secret');
  });
});

// ---------------------------------------------------------------------------
// Testes: GET /api/github/status
// ---------------------------------------------------------------------------

describe('GET /api/github/status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('sempre retorna 200 com { enabled, mode, message }', async () => {
    delete process.env.GITHUB_INTEGRATION_ENABLED;
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'status' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body).toHaveProperty('enabled');
    expect(res._body).toHaveProperty('mode');
    expect(res._body).toHaveProperty('message');
  });

  test('enabled=false quando flag desabilitada', async () => {
    delete process.env.GITHUB_INTEGRATION_ENABLED;
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'status' });
    const res = mockRes();
    await handler(req, res);
    expect(res._body.enabled).toBe(false);
  });

  test('rejeita método POST com 405', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('POST', { route: 'status' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });
});

// ---------------------------------------------------------------------------
// Testes: GET /api/github/repos
// ---------------------------------------------------------------------------

describe('GET /api/github/repos — flag false → 501', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('retorna 501 com mensagem clara quando flag false', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'false';
    delete process.env.GITHUB_TOKEN;
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
    expect(res._body).toHaveProperty('error');
    expect(res._body.error).toHaveProperty('code', 'GITHUB_DISABLED');
    expect(res._body.error).toHaveProperty('message');
    expect(res._body.error.details).toContain('GITHUB_INTEGRATION_ENABLED');
  });

  test('retorna 501 sem flag definida', async () => {
    delete process.env.GITHUB_INTEGRATION_ENABLED;
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
  });
});

describe('GET /api/github/repos — flag true, modo stub', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('modo stub retorna 200 com lista mock e { mode: "stub" }', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN;
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body).toHaveProperty('repos');
    expect(Array.isArray(res._body.repos)).toBe(true);
    expect(res._body.mode).toBe('stub');
  });

  test('modo stub: dados mock não contém token/segredos', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN;
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    const bodyStr = JSON.stringify(res._body);
    expect(bodyStr).not.toContain('ghp_');
    expect(bodyStr).not.toContain('token');
  });
});

describe('GET /api/github/repos — flag true, sem token (modo stub)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('cai para modo stub (200) quando flag=true mas GITHUB_TOKEN ausente', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN;
    // Sem token, mode='stub' → resposta 200 com dados mock
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('stub');
  });
});

// ---------------------------------------------------------------------------
// Testes: githubService stubs
// ---------------------------------------------------------------------------

describe('githubService — stubs putFile e createPR', () => {
  test('putFile lança erro NOT_IMPLEMENTED', async () => {
    const { putFile } = await import('../lib/github/githubService.js');
    await expect(putFile()).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' });
  });

  test('createPR lança erro NOT_IMPLEMENTED', async () => {
    const { createPR } = await import('../lib/github/githubService.js');
    await expect(createPR()).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' });
  });
});

// ---------------------------------------------------------------------------
// Testes: arquivo github.js pode ser importado (estrutura)
// ---------------------------------------------------------------------------

describe('api/github.js — estrutura', () => {
  test('é importável e exporta função handler', async () => {
    const module = await import('../github.js');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  test('rota 404 para route desconhecido', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'naoexiste' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(404);
  });
});
