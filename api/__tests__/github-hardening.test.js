/**
 * api/__tests__/github-hardening.test.js
 * Testes de hardening para a integração GitHub backend.
 *
 * Cobre:
 *   - Feature flag off → todos endpoints retornam 501 (exceto status → 200)
 *   - Modo stub → repos/branches/file retornam mock, NUNCA chamam API real
 *   - OAuth sem token → 401 com formato de erro padronizado
 *   - OAuth com token → mock fetch, verifica chamada correta à API
 *   - Validação de input → 400 quando owner/repo/path ausentes
 *   - Formato de erro → todos os erros seguem { error: { code, message } }
 *   - Token jamais aparece no corpo da resposta (JSON.stringify check)
 *   - Método inválido (POST/PUT/DELETE) → 405
 *   - sanitizeMessage remove padrões de token GitHub
 *   - mapClientError mapeia corretamente statusCodes
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Helpers
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
// Testes: formatErrorResponse e sanitizeMessage (githubErrors.js)
// ---------------------------------------------------------------------------

describe('githubErrors — formatErrorResponse', () => {
  test('retorna { error: { code, message } } sem details quando details omitido', async () => {
    const { formatErrorResponse } = await import('../lib/github/githubErrors.js');
    const result = formatErrorResponse('TEST_CODE', 'Mensagem de teste');
    expect(result).toEqual({ error: { code: 'TEST_CODE', message: 'Mensagem de teste' } });
    expect(result.error.details).toBeUndefined();
  });

  test('inclui details quando fornecido', async () => {
    const { formatErrorResponse } = await import('../lib/github/githubErrors.js');
    const result = formatErrorResponse('TEST_CODE', 'Mensagem', 'Detalhes extras');
    expect(result.error.details).toBe('Detalhes extras');
  });

  test('não inclui details quando null', async () => {
    const { formatErrorResponse } = await import('../lib/github/githubErrors.js');
    const result = formatErrorResponse('TEST_CODE', 'Mensagem', null);
    expect(result.error.details).toBeUndefined();
  });
});

describe('githubErrors — sanitizeMessage', () => {
  test('remove padrão ghp_ de mensagem', async () => {
    const { sanitizeMessage } = await import('../lib/github/githubErrors.js');
    const result = sanitizeMessage('Erro com token ghp_abc123XYZ na mensagem');
    expect(result).not.toContain('ghp_abc123XYZ');
    expect(result).toContain('[REDACTED]');
  });

  test('remove padrão gho_ de mensagem', async () => {
    const { sanitizeMessage } = await import('../lib/github/githubErrors.js');
    const result = sanitizeMessage('token gho_secretToken presente');
    expect(result).not.toContain('gho_secretToken');
    expect(result).toContain('[REDACTED]');
  });

  test('retorna "Erro desconhecido" para input não-string', async () => {
    const { sanitizeMessage } = await import('../lib/github/githubErrors.js');
    expect(sanitizeMessage(null)).toBe('Erro desconhecido');
    expect(sanitizeMessage(undefined)).toBe('Erro desconhecido');
    expect(sanitizeMessage(42)).toBe('Erro desconhecido');
  });

  test('não altera mensagem sem token', async () => {
    const { sanitizeMessage } = await import('../lib/github/githubErrors.js');
    const msg = 'Erro genérico sem segredos';
    expect(sanitizeMessage(msg)).toBe(msg);
  });
});

describe('githubErrors — mapClientError', () => {
  test('mapeia 401 para GITHUB_UNAUTHORIZED', async () => {
    const { mapClientError } = await import('../lib/github/githubErrors.js');
    const { GitHubClientError } = await import('../lib/github/githubClient.js');
    const err = new GitHubClientError('Unauthorized', 401, 'Bad credentials');
    const { status, body } = mapClientError(err);
    expect(status).toBe(401);
    expect(body.error.code).toBe('GITHUB_UNAUTHORIZED');
  });

  test('mapeia 404 para GITHUB_NOT_FOUND', async () => {
    const { mapClientError } = await import('../lib/github/githubErrors.js');
    const { GitHubClientError } = await import('../lib/github/githubClient.js');
    const err = new GitHubClientError('Not found', 404, 'Not Found');
    const { status, body } = mapClientError(err);
    expect(status).toBe(404);
    expect(body.error.code).toBe('GITHUB_NOT_FOUND');
  });

  test('mapeia 504 para GITHUB_TIMEOUT', async () => {
    const { mapClientError } = await import('../lib/github/githubErrors.js');
    const { GitHubClientError } = await import('../lib/github/githubClient.js');
    const err = new GitHubClientError('Timeout', 504, 'Timeout');
    const { status, body } = mapClientError(err);
    expect(status).toBe(504);
    expect(body.error.code).toBe('GITHUB_TIMEOUT');
  });

  test('mapeia 500 para GITHUB_API_ERROR', async () => {
    const { mapClientError } = await import('../lib/github/githubErrors.js');
    const { GitHubClientError } = await import('../lib/github/githubClient.js');
    const err = new GitHubClientError('Server error', 500, 'Internal Server Error');
    const { status, body } = mapClientError(err);
    expect(status).toBe(500);
    expect(body.error.code).toBe('GITHUB_API_ERROR');
  });

  test('statusCode inválido (ex.: 0) → mapeado para 502', async () => {
    const { mapClientError } = await import('../lib/github/githubErrors.js');
    const { GitHubClientError } = await import('../lib/github/githubClient.js');
    const err = new GitHubClientError('Network error', 0, 'NetworkError');
    const { status } = mapClientError(err);
    expect(status).toBe(502);
  });
});

// ---------------------------------------------------------------------------
// Testes: feature flag OFF → todos endpoints retornam 501 (exceto status)
// ---------------------------------------------------------------------------

describe('Feature flag OFF — todos endpoints retornam 501 exceto status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GITHUB_INTEGRATION_ENABLED = 'false';
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('GET ?route=status → 200 sempre (flag off não bloqueia status)', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'status' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.enabled).toBe(false);
  });

  test('GET ?route=repos → 501 com código GITHUB_DISABLED', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
    expect(res._body.error.code).toBe('GITHUB_DISABLED');
  });

  test('GET ?route=branches → 501 com código GITHUB_DISABLED', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', owner: 'user', repo: 'repo' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
    expect(res._body.error.code).toBe('GITHUB_DISABLED');
  });

  test('GET ?route=file → 501 com código GITHUB_DISABLED', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', owner: 'user', repo: 'repo', path: 'README.md' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
    expect(res._body.error.code).toBe('GITHUB_DISABLED');
  });

  test('erros 501 seguem formato { error: { code, message } }', async () => {
    const handler = (await import('../github.js')).default;
    for (const route of ['repos', 'branches', 'file']) {
      const req = mockReq('GET', { route, owner: 'u', repo: 'r', path: 'f' });
      const res = mockRes();
      await handler(req, res);
      expect(res._body).toHaveProperty('error');
      expect(res._body.error).toHaveProperty('code');
      expect(res._body.error).toHaveProperty('message');
    }
  });
});

// ---------------------------------------------------------------------------
// Testes: modo STUB — retorna mock, NUNCA chama API real
// ---------------------------------------------------------------------------

describe('Modo STUB — retorna mock data, nunca chama API real', () => {
  const originalEnv = process.env;
  let fetchSpy;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN;
    // Espiona global.fetch para garantir que não é chamado no modo stub
    fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('fetch should not be called in stub mode'));
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchSpy.mockRestore();
  });

  test('?route=repos → 200 com lista mock e mode="stub"', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('stub');
    expect(Array.isArray(res._body.repos)).toBe(true);
    expect(res._body.repos.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('?route=branches&owner=u&repo=r → 200 com branches mock e mode="stub"', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', owner: 'usuario', repo: 'repo' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('stub');
    expect(Array.isArray(res._body.branches)).toBe(true);
    expect(res._body.branches.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('?route=file&owner=u&repo=r&path=f → 200 com file mock e mode="stub"', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', owner: 'usuario', repo: 'repo', path: 'README.md' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('stub');
    expect(res._body.file).toHaveProperty('name');
    expect(res._body.file).toHaveProperty('encoding');
    expect(res._body.file).toHaveProperty('content');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('stub repos não contém token/segredos', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    const bodyStr = JSON.stringify(res._body);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
  });

  test('stub branches não contém token/segredos', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', owner: 'u', repo: 'r' });
    const res = mockRes();
    await handler(req, res);
    const bodyStr = JSON.stringify(res._body);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
  });
});

// ---------------------------------------------------------------------------
// Testes: OAuth COM token + mock fetch → verifica chamadas corretas
// ---------------------------------------------------------------------------

describe('OAuth com token — mock fetch', () => {
  const originalEnv = process.env;
  let fetchMock;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    process.env.GITHUB_TOKEN = 'ghp_mock_token_123';
  });

  afterEach(() => {
    process.env = originalEnv;
    if (fetchMock) fetchMock.mockRestore();
  });

  test('?route=repos com token → chama /user/repos na API GitHub', async () => {
    const fakeRepos = [
      { id: 99, name: 'my-repo', full_name: 'user/my-repo', private: false,
        default_branch: 'main', description: null, html_url: 'https://github.com/user/my-repo',
        updated_at: '2026-01-01T00:00:00Z' },
    ];
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fakeRepos,
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('oauth');
    expect(res._body.repos).toHaveLength(1);
    expect(res._body.repos[0].name).toBe('my-repo');

    // Verifica que fetch foi chamado com URL e headers corretos
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOpts] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain('/user/repos');
    expect(calledOpts.headers['Authorization']).toBe('Bearer ghp_mock_token_123');
    expect(JSON.stringify(res._body)).not.toContain('ghp_mock_token_123');
  });

  test('?route=branches com token → chama /repos/:owner/:repo/branches', async () => {
    const fakeBranches = [
      { name: 'main', commit: { sha: 'abc123' }, protected: true },
    ];
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fakeBranches,
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', owner: 'myuser', repo: 'myrepo' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('oauth');
    expect(res._body.branches[0].name).toBe('main');

    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain('/repos/myuser/myrepo/branches');
  });

  test('?route=file com token → chama /repos/:owner/:repo/contents/:path', async () => {
    const fakeFile = {
      name: 'README.md', path: 'README.md', sha: 'sha123', size: 100,
      encoding: 'base64', content: Buffer.from('# Hello').toString('base64'),
      html_url: 'https://github.com/u/r/blob/main/README.md',
    };
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fakeFile,
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', owner: 'myuser', repo: 'myrepo', path: 'README.md' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.mode).toBe('oauth');
    expect(res._body.file.name).toBe('README.md');

    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain('/repos/myuser/myrepo/contents/README.md');
  });

  test('?route=file com ref → inclui ref na query string', async () => {
    const fakeFile = {
      name: 'index.js', path: 'src/index.js', sha: 'sha456', size: 50,
      encoding: 'base64', content: Buffer.from('// code').toString('base64'),
      html_url: 'https://github.com/u/r/blob/develop/src/index.js',
    };
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fakeFile,
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', owner: 'u', repo: 'r', path: 'src/index.js', ref: 'develop' });
    const res = mockRes();
    await handler(req, res);

    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain('ref=develop');
  });

  test('API retorna 401 → resposta 401 com GITHUB_UNAUTHORIZED, sem token', async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Bad credentials' }),
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._body.error.code).toBe('GITHUB_UNAUTHORIZED');
    expect(JSON.stringify(res._body)).not.toContain('ghp_mock_token_123');
  });

  test('API retorna 404 → resposta 404 com GITHUB_NOT_FOUND', async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not Found' }),
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', owner: 'u', repo: 'r' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(404);
    expect(res._body.error.code).toBe('GITHUB_NOT_FOUND');
  });

  test('token nunca aparece na resposta de erro', async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Forbidden' }),
    });

    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);

    const bodyStr = JSON.stringify(res._body);
    expect(bodyStr).not.toContain('ghp_mock_token_123');
    expect(bodyStr).not.toContain('Bearer');
  });
});

// ---------------------------------------------------------------------------
// Testes: Validação de input → 400 MISSING_PARAMS
// ---------------------------------------------------------------------------

describe('Validação de input → 400 com código MISSING_PARAMS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN; // stub mode para não precisar de fetch
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('?route=branches sem owner → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', repo: 'algum-repo' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
    expect(res._body.error.message).toBeTruthy();
  });

  test('?route=branches sem repo → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches', owner: 'algum-user' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
  });

  test('?route=branches sem owner nem repo → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'branches' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
  });

  test('?route=file sem owner → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', repo: 'r', path: 'README.md' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
  });

  test('?route=file sem repo → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', owner: 'u', path: 'README.md' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
  });

  test('?route=file sem path → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file', owner: 'u', repo: 'r' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
  });

  test('?route=file sem nenhum parâmetro → 400 MISSING_PARAMS', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'file' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe('MISSING_PARAMS');
  });

  test('erros 400 seguem formato { error: { code, message } }', async () => {
    const handler = (await import('../github.js')).default;
    const testCases = [
      { route: 'branches', owner: 'u' },
      { route: 'file', owner: 'u', repo: 'r' },
    ];
    for (const query of testCases) {
      const req = mockReq('GET', query);
      const res = mockRes();
      await handler(req, res);
      expect(res._status).toBe(400);
      expect(res._body).toHaveProperty('error');
      expect(res._body.error).toHaveProperty('code');
      expect(res._body.error).toHaveProperty('message');
    }
  });
});

// ---------------------------------------------------------------------------
// Testes: Formato de erro — todos os erros seguem { error: { code, message } }
// ---------------------------------------------------------------------------

describe('Formato de erro padronizado em todas as rotas', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GITHUB_INTEGRATION_ENABLED = 'false';
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('rota desconhecida → 404 com { error: { code, message } }', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'inexistente' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(404);
    expect(res._body).toHaveProperty('error');
    expect(res._body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res._body.error).toHaveProperty('message');
  });

  test('501 → segue formato { error: { code, message } }', async () => {
    const handler = (await import('../github.js')).default;
    const req = mockReq('GET', { route: 'repos' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
    expect(res._body.error.code).toBe('GITHUB_DISABLED');
    expect(typeof res._body.error.message).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Testes: Método HTTP inválido → 405
// ---------------------------------------------------------------------------

describe('Método HTTP inválido → 405 METHOD_NOT_ALLOWED', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('POST ?route=status → 405', async () => {
    const handler = (await import('../github.js')).default;
    const res = mockRes();
    await handler(mockReq('POST', { route: 'status' }), res);
    expect(res._status).toBe(405);
    expect(res._body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  test('PUT ?route=repos → 405', async () => {
    const handler = (await import('../github.js')).default;
    const res = mockRes();
    await handler(mockReq('PUT', { route: 'repos' }), res);
    expect(res._status).toBe(405);
    expect(res._body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  test('DELETE ?route=branches → 405', async () => {
    const handler = (await import('../github.js')).default;
    const res = mockRes();
    await handler(mockReq('DELETE', { route: 'branches' }), res);
    expect(res._status).toBe(405);
    expect(res._body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  test('POST ?route=file → 405', async () => {
    const handler = (await import('../github.js')).default;
    const res = mockRes();
    await handler(mockReq('POST', { route: 'file' }), res);
    expect(res._status).toBe(405);
    expect(res._body.error.code).toBe('METHOD_NOT_ALLOWED');
  });
});

// ---------------------------------------------------------------------------
// Testes: Token nunca aparece em resposta
// ---------------------------------------------------------------------------

describe('Segurança — token nunca aparece em respostas', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('?route=status não expõe token', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    process.env.GITHUB_TOKEN = 'ghp_super_secret_token_XYZ';
    const handler = (await import('../github.js')).default;
    const res = mockRes();
    await handler(mockReq('GET', { route: 'status' }), res);
    expect(JSON.stringify(res._body)).not.toContain('ghp_super_secret_token_XYZ');
  });

  test('?route=repos não expõe token (modo stub)', async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    delete process.env.GITHUB_TOKEN;
    const handler = (await import('../github.js')).default;
    const res = mockRes();
    await handler(mockReq('GET', { route: 'repos' }), res);
    expect(JSON.stringify(res._body)).not.toMatch(/gh[a-z]_/);
  });

  test('erro de API não expõe token via sanitizeMessage', async () => {
    const { sanitizeMessage } = await import('../lib/github/githubErrors.js');
    const secretToken = 'ghp_real_secret_12345';
    const sanitized = sanitizeMessage(`GitHub API error with ${secretToken} in message`);
    expect(sanitized).not.toContain(secretToken);
    expect(sanitized).toContain('[REDACTED]');
  });
});

// ---------------------------------------------------------------------------
// Testes: githubClient — retry behavior
// ---------------------------------------------------------------------------

describe('githubClient — retry apenas para 5xx, não para 401/403/404', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GITHUB_INTEGRATION_ENABLED = 'true';
    process.env.GITHUB_TOKEN = 'ghp_test_token';
    process.env.GITHUB_API_BASE_URL = 'https://api.github.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('erro 401 → NÃO faz retry (apenas 1 chamada fetch)', async () => {
    let callCount = 0;
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Bad credentials' }),
      };
    });

    const { githubRequest } = await import('../lib/github/githubClient.js');
    await expect(githubRequest('/user/repos', { retries: 2 })).rejects.toThrow();
    expect(callCount).toBe(1); // zero retry para 401

    fetchMock.mockRestore();
  });

  test('erro 403 → NÃO faz retry (apenas 1 chamada fetch)', async () => {
    let callCount = 0;
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Forbidden' }),
      };
    });

    const { githubRequest } = await import('../lib/github/githubClient.js');
    await expect(githubRequest('/user/repos', { retries: 2 })).rejects.toThrow();
    expect(callCount).toBe(1);

    fetchMock.mockRestore();
  });

  test('erro 404 → NÃO faz retry (apenas 1 chamada fetch)', async () => {
    let callCount = 0;
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      };
    });

    const { githubRequest } = await import('../lib/github/githubClient.js');
    await expect(githubRequest('/user/repos', { retries: 2 })).rejects.toThrow();
    expect(callCount).toBe(1);

    fetchMock.mockRestore();
  });

  test('erro 500 com retries=1 → faz 2 chamadas (1 original + 1 retry)', async () => {
    let callCount = 0;
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server Error' }),
      };
    });

    const { githubRequest } = await import('../lib/github/githubClient.js');
    await expect(githubRequest('/user/repos', { retries: 1 })).rejects.toThrow();
    expect(callCount).toBe(2); // 1 original + 1 retry

    fetchMock.mockRestore();
  });
});
