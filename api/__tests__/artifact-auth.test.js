/**
 * Fase 2 — Contenção P0
 *
 * Testes de autenticação dos endpoints do Construtor:
 *   - /api/artifact
 *   - /api/artifact-preview
 *
 * Cobertura:
 *  - Rejeitam requisição sem autenticação válida (401 / 503 conforme padrão de /api/ai).
 *  - Fluxo autenticado legítimo continua alcançando packaging/preview.
 *  - OPTIONS (preflight CORS) permanece funcional via applyCorsRestricted.
 *  - POST /api/artifact-preview autenticado NÃO invoca executeArtifact (execução
 *    automática desativada pela contenção P0).
 *  - PATCH /api/artifact-preview autenticado, com decision=approved e content,
 *    continua entregando zipBase64.
 */

import { jest } from '@jest/globals';

// ── Mocks das libs do Construtor — totalmente determinísticos ────────────────
jest.unstable_mockModule('../../src/lib/construtor/artifactPackager.js', () => ({
  packageArtifact: jest.fn().mockResolvedValue({
    id: 'test-uuid',
    manifest: {
      id: 'test-uuid',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      origin: { specialist: 'hybrid', model: 'test-model', promptId: 'hybrid-genius' },
      checksum: 'sha256:' + 'a'.repeat(64),
    },
    zipBuffer: Buffer.from('PK\x03\x04'),
    zipBase64: 'UEsDBA==',
  }),
}));

jest.unstable_mockModule('../../src/lib/construtor/artifactValidator.js', () => ({
  validateArtifact: jest.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
}));

jest.unstable_mockModule('../../src/lib/construtor/artifactRunner.js', () => ({
  executeArtifact: jest.fn().mockResolvedValue({
    executed: false,
    success: true,
    command: null,
    durationMs: 0,
    stdout: '',
    stderr: '',
    timedOut: false,
    exitCode: null,
    reason: 'not-executable',
  }),
}));

jest.unstable_mockModule('../../src/lib/construtor/artifactPreview.js', () => ({
  generatePreview: jest.fn().mockReturnValue({
    previewAvailable: true,
    summary: {
      id: 'test-uuid',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      origin: { specialist: 'hybrid', model: 'test-model', promptId: 'hybrid-genius' },
      validation: { valid: true, errorCount: 0, warningCount: 0 },
      execution: null,
      files: [],
      contentPreview: 'Conteúdo de teste',
    },
    decision: 'pending',
    feedback: null,
    decisionTimestamp: null,
  }),
  applyDecision: jest.fn().mockImplementation((preview, decision, feedback) => ({
    ...preview,
    decision,
    feedback: feedback || null,
    decisionTimestamp: new Date().toISOString(),
  })),
}));

// ── Mock controlável de verifyAuth ───────────────────────────────────────────
// Padrão: simular ambiente onde token é exigido e ausente → missing_token.
// Cada teste configura o comportamento desejado via verifyAuthMock.mockResolvedValueOnce.
const verifyAuthMock = jest.fn();
jest.unstable_mockModule('../lib/auth.js', () => ({
  verifyAuth: verifyAuthMock,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeReqRes(method, body, headers = {}) {
  const req = { method, body, headers };
  const res = {
    _status: null,
    _json: null,
    _headers: {},
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
    end() { return this; },
    setHeader(k, v) { this._headers[k] = v; return this; },
  };
  return { req, res };
}

let artifactHandler;
let previewHandler;
let executeArtifactMock;

beforeAll(async () => {
  artifactHandler = (await import('../artifact.js')).default;
  previewHandler = (await import('../artifact-preview.js')).default;
  executeArtifactMock = (await import('../../src/lib/construtor/artifactRunner.js')).executeArtifact;
});

beforeEach(() => {
  verifyAuthMock.mockReset();
  executeArtifactMock.mockClear();
});

// ── /api/artifact ─────────────────────────────────────────────────────────────
describe('/api/artifact — auth guard', () => {
  test('rejeita requisição sem token (missing_token → 401)', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'missing_token' });
    const { req, res } = makeReqRes('POST', { content: 'x' });
    await artifactHandler(req, res);
    expect(res._status).toBe(401);
    expect(res._json.code).toBe('missing_token');
  });

  test('rejeita requisição com token inválido (invalid_token → 401)', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'invalid_token' });
    const { req, res } = makeReqRes('POST', { content: 'x' }, { authorization: 'Bearer bad' });
    await artifactHandler(req, res);
    expect(res._status).toBe(401);
    expect(res._json.code).toBe('invalid_token');
  });

  test('retorna 503 quando auth está indisponível (auth_unavailable)', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'auth_unavailable' });
    const { req, res } = makeReqRes('POST', { content: 'x' });
    await artifactHandler(req, res);
    expect(res._status).toBe(503);
    expect(res._json.code).toBe('auth_unavailable');
  });

  test('OPTIONS (preflight) é tratado sem exigir auth', async () => {
    const { req, res } = makeReqRes('OPTIONS', null);
    await artifactHandler(req, res);
    expect(res._status).toBe(204);
    expect(verifyAuthMock).not.toHaveBeenCalled();
  });

  test('requisição autenticada legítima retorna 200 com artifact', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'u1' }, error: null });
    const { req, res } = makeReqRes(
      'POST',
      { content: '# Hello', metadata: {} },
      { authorization: 'Bearer good' },
    );
    await artifactHandler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.id).toBe('test-uuid');
    expect(res._json.zipBase64).toBe('UEsDBA==');
  });
});

// ── /api/artifact-preview ─────────────────────────────────────────────────────
describe('/api/artifact-preview — auth guard', () => {
  test('POST sem token → 401', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'missing_token' });
    const { req, res } = makeReqRes('POST', { content: '# x' });
    await previewHandler(req, res);
    expect(res._status).toBe(401);
    expect(res._json.code).toBe('missing_token');
  });

  test('PATCH sem token → 401', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'missing_token' });
    const { req, res } = makeReqRes('PATCH', {
      preview: { previewAvailable: true, summary: { id: 'x' }, decision: 'pending' },
      decision: 'approved',
    });
    await previewHandler(req, res);
    expect(res._status).toBe(401);
  });

  test('OPTIONS é tratado sem exigir auth', async () => {
    const { req, res } = makeReqRes('OPTIONS', null);
    await previewHandler(req, res);
    expect(res._status).toBe(204);
    expect(verifyAuthMock).not.toHaveBeenCalled();
  });

  test('POST autenticado NÃO invoca executeArtifact (contenção P0)', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'u1' }, error: null });
    const { req, res } = makeReqRes(
      'POST',
      {
        content:
          '--- FILE: evil.js ---\nrequire("child_process").execSync("id");\n--- FILE: b.js ---\nx\n',
        metadata: {},
      },
      { authorization: 'Bearer good' },
    );
    await previewHandler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(executeArtifactMock).not.toHaveBeenCalled();
  });

  test('PATCH autenticado approved+content continua entregando zipBase64', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'u1' }, error: null });
    const { req, res } = makeReqRes(
      'PATCH',
      {
        preview: {
          previewAvailable: true,
          summary: { id: 'x', origin: {} },
          decision: 'pending',
        },
        decision: 'approved',
        content: '# Aprovado',
      },
      { authorization: 'Bearer good' },
    );
    await previewHandler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.zipBase64).toBe('UEsDBA==');
  });
});

// ── Method-not-allowed ────────────────────────────────────────────────────────
describe('artifact endpoints — method not allowed', () => {
  test('/api/artifact rejeita GET com 405 (após preflight CORS)', async () => {
    const { req, res } = makeReqRes('GET', null);
    await artifactHandler(req, res);
    expect(res._status).toBe(405);
    expect(verifyAuthMock).not.toHaveBeenCalled();
  });

  test('/api/artifact-preview rejeita DELETE com 405', async () => {
    const { req, res } = makeReqRes('DELETE', null);
    await previewHandler(req, res);
    expect(res._status).toBe(405);
    expect(verifyAuthMock).not.toHaveBeenCalled();
  });
});
