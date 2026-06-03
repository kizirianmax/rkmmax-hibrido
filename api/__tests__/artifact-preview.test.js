/**
 * Testes mínimos — /api/artifact-preview (handler Fase 2D)
 *
 * Valida:
 * - POST sem content retorna 400
 * - POST com content retorna 200 com preview
 * - PATCH sem preview retorna 400
 * - PATCH com decision inválida retorna 400
 * - PATCH com decision válida retorna 200 com preview atualizado
 * - Method não suportado retorna 405
 */

import { jest } from '@jest/globals';

// ── Mock das dependências de lib ──────────────────────────────────────────────
// Nota: este projeto é um monorepo onde /api (serverless) e /src/lib (lib) coexistem
// na raiz. Os caminhos ../../src/lib/... são corretos a partir de api/__tests__/.

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

// Fase 2 — Contenção P0: mock de auth para evitar dependência Supabase nos testes.
// `verifyAuth` retorna usuário válido (simula token aceito).
jest.unstable_mockModule('../lib/auth.js', () => ({
  verifyAuth: jest.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com' },
    error: null,
  }),
}));

jest.unstable_mockModule('../_utils/artifactLedger.js', () => ({
  recordLedgerEvent: jest.fn().mockResolvedValue(true),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReqRes(method, body) {
  const req = { method, body };
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
    end() { return this; },
    setHeader() { return this; },
  };
  return { req, res };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

let handler;
let executeArtifactMock;
let recordLedgerEventMock;

beforeAll(async () => {
  const mod = await import('../artifact-preview.js');
  handler = mod.default;
  const runnerMod = await import('../../src/lib/construtor/artifactRunner.js');
  executeArtifactMock = runnerMod.executeArtifact;
  const ledgerMod = await import('../_utils/artifactLedger.js');
  recordLedgerEventMock = ledgerMod.recordLedgerEvent;
});

beforeEach(() => {
  recordLedgerEventMock.mockClear();
});

describe('POST /api/artifact-preview', () => {
  test('deve retornar 400 quando content está ausente', async () => {
    const { req, res } = makeReqRes('POST', {});
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toBe('Bad request');
  });

  test('deve retornar 400 quando content é string vazia', async () => {
    const { req, res } = makeReqRes('POST', { content: '   ' });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  test('deve retornar 200 com preview para content válido', async () => {
    const { req, res } = makeReqRes('POST', {
      content: '# Artefato\n\nConteúdo gerado.',
      metadata: { model: 'llama-3.3-70b', tier: 'free' },
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.preview).toHaveProperty('previewAvailable', true);
    expect(res._json.preview).toHaveProperty('decision', 'pending');
    expect(recordLedgerEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'preview_generated',
        user: { id: 'test-user', email: 'test@example.com' },
      }),
    );
  });

  // Fase 2 — Contenção P0: execução automática foi desativada.
  test('NÃO deve invocar executeArtifact() ao gerar preview (contenção P0)', async () => {
    executeArtifactMock.mockClear();
    const { req, res } = makeReqRes('POST', {
      content: '--- FILE: a.js ---\nconsole.log(1);\n--- FILE: b.js ---\nconsole.log(2);\n',
      metadata: {},
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(executeArtifactMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/artifact-preview', () => {
  const validPreview = {
    previewAvailable: true,
    summary: { id: 'test-uuid' },
    decision: 'pending',
    feedback: null,
    decisionTimestamp: null,
  };

  test('deve retornar 400 quando preview está ausente', async () => {
    const { req, res } = makeReqRes('PATCH', { decision: 'approved' });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toBe('Bad request');
  });

  test('deve retornar 400 para decision inválida', async () => {
    const { req, res } = makeReqRes('PATCH', { preview: validPreview, decision: 'unknown' });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  test('deve retornar 200 com preview aprovado', async () => {
    const { req, res } = makeReqRes('PATCH', { preview: validPreview, decision: 'approved' });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.preview.decision).toBe('approved');
    expect(recordLedgerEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'decision_applied',
        decision: 'approved',
        user: { id: 'test-user', email: 'test@example.com' },
      }),
    );
  });

  test('deve retornar 200 com preview rejeitado e feedback', async () => {
    const { req, res } = makeReqRes('PATCH', {
      preview: validPreview,
      decision: 'rejected',
      feedback: 'Conteúdo incompleto',
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.preview.decision).toBe('rejected');
    expect(res._json.preview.feedback).toBe('Conteúdo incompleto');
  });

  test('deve retornar zipBase64 quando decision=approved e content fornecido', async () => {
    const { req, res } = makeReqRes('PATCH', {
      preview: validPreview,
      decision: 'approved',
      content: '# Artefato aprovado\n\nConteúdo gerado.',
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(res._json.preview.decision).toBe('approved');
    expect(res._json.zipBase64).toBe('UEsDBA==');
  });

  test('NÃO deve retornar zipBase64 quando decision=approved sem content', async () => {
    const { req, res } = makeReqRes('PATCH', {
      preview: validPreview,
      decision: 'approved',
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.preview.decision).toBe('approved');
    expect(res._json.zipBase64).toBeUndefined();
  });

  test('NÃO deve retornar zipBase64 quando decision=rejected mesmo com content', async () => {
    const { req, res } = makeReqRes('PATCH', {
      preview: validPreview,
      decision: 'rejected',
      content: '# Artefato rejeitado\n\nConteúdo.',
      feedback: 'Não aprovado',
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.preview.decision).toBe('rejected');
    expect(res._json.zipBase64).toBeUndefined();
  });
});

describe('Method not allowed', () => {
  test('deve retornar 405 para DELETE', async () => {
    const { req, res } = makeReqRes('DELETE', {});
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._json.error).toBe('Method not allowed');
  });
});
