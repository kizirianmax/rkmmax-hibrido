import { jest } from '@jest/globals';

const verifyAuthMock = jest.fn();
const readLedgerEventsMock = jest.fn();

jest.unstable_mockModule('../lib/auth.js', () => ({
  verifyAuth: verifyAuthMock,
}));

jest.unstable_mockModule('../_utils/artifactLedger.js', () => ({
  readLedgerEvents: readLedgerEventsMock,
}));

function makeReqRes(method = 'GET', query = {}, headers = {}) {
  const req = { method, query, headers };
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
  };
  return { req, res };
}

let handler;

beforeAll(async () => {
  handler = (await import('../artifact-provenance.js')).default;
});

beforeEach(() => {
  verifyAuthMock.mockReset();
  readLedgerEventsMock.mockReset();
});

describe('/api/artifact-provenance', () => {
  test('rejeita sem autenticação', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'missing_token' });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json.code).toBe('missing_token');
    expect(readLedgerEventsMock).not.toHaveBeenCalled();
  });

  test('rejeita sem artifactId', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    const { req, res } = makeReqRes('GET', {});

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.code).toBe('missing_artifact_id');
    expect(readLedgerEventsMock).not.toHaveBeenCalled();
  });

  test('consulta com artifactId e user.id autenticado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(readLedgerEventsMock).toHaveBeenCalledWith({ artifactId: 'a-1', userId: 'user-1' });
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
  });

  test('retorna no_events quando não há eventos', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.status).toBe('no_events');
    expect(res._json.provenance.confidence).toBe('low');
  });

  test('retorna decision_pending quando há preview_generated sem decisão', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
          created_at: '2026-06-03T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._json.provenance.status).toBe('decision_pending');
    expect(res._json.provenance.generated).toBe(true);
    expect(res._json.provenance.decision).toBeNull();
  });

  test('retorna approved quando há decision_applied aprovado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
          created_at: '2026-06-03T00:00:00.000Z',
        },
        {
          ledger_id: '2',
          artifact_id: 'a-1',
          event_type: 'decision_applied',
          decision: 'approved',
          created_at: '2026-06-03T00:10:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._json.provenance.status).toBe('approved');
    expect(res._json.provenance.decision).toBe('approved');
  });

  test('retorna rejected quando há decision_applied rejeitado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
          created_at: '2026-06-03T00:00:00.000Z',
        },
        {
          ledger_id: '2',
          artifact_id: 'a-1',
          event_type: 'decision_applied',
          decision: 'rejected',
          created_at: '2026-06-03T00:10:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._json.provenance.status).toBe('rejected');
    expect(res._json.provenance.decision).toBe('rejected');
  });

  test('retorna incomplete_history quando há decisão sem preview anterior', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '2',
          artifact_id: 'a-1',
          event_type: 'decision_applied',
          decision: 'approved',
          created_at: '2026-06-03T00:10:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._json.provenance.status).toBe('incomplete_history');
    expect(res._json.provenance.warnings).toContain('decision_without_previous_preview');
  });

  test('inclui traceId quando existir', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
          trace_id: 'trace-abc',
          created_at: '2026-06-03T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._json.provenance.hasTraceId).toBe(true);
    expect(res._json.provenance.traceId).toBe('trace-abc');
  });

  test('não retorna zipBase64, content, files, raw files, contentPreview ou user_email', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
          trace_id: 'trace-abc',
          zipBase64: 'UEsDBA==',
          files: [{ path: 'a.md', content: 'raw' }],
          rawFiles: [{ path: 'a.md', content: 'raw' }],
          content: 'raw',
          contentPreview: 'raw preview',
          user_email: 'user@example.com',
          created_at: '2026-06-03T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual(
      expect.objectContaining({
        success: true,
        artifactId: 'a-1',
        provenance: expect.any(Object),
      }),
    );
    const payload = JSON.stringify(res._json);
    expect(payload).not.toContain('zipBase64');
    expect(payload).not.toContain('files');
    expect(payload).not.toContain('rawFiles');
    expect(payload).not.toContain('contentPreview');
    expect(payload).not.toContain('user_email');
  });

  test('falha de readLedgerEvents retorna erro controlado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: 'supabase_unavailable' });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(503);
    expect(res._json.code).toBe('supabase_unavailable');
  });

  test('mocks não vazam entre testes', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(verifyAuthMock).toHaveBeenCalledTimes(1);
    expect(readLedgerEventsMock).toHaveBeenCalledTimes(1);
  });

  test('veredito é determinístico para a mesma lista de eventos', async () => {
    const events = [
      {
        ledger_id: '1',
        artifact_id: 'a-1',
        event_type: 'preview_generated',
        artifact_checksum: 'sha256:abc',
        origin_model: 'gpt-test',
        origin_prompt_id: 'hybrid-genius',
        preview_validation: { valid: true },
        created_at: '2026-06-03T00:00:00.000Z',
      },
      {
        ledger_id: '2',
        artifact_id: 'a-1',
        event_type: 'decision_applied',
        decision: 'approved',
        created_at: '2026-06-03T00:10:00.000Z',
      },
    ];

    verifyAuthMock.mockResolvedValue({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValue({ events, error: null });

    const first = makeReqRes('GET', { artifactId: 'a-1' });
    const second = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(first.req, first.res);
    await handler(second.req, second.res);

    expect(first.res._status).toBe(200);
    expect(second.res._status).toBe(200);
    expect(second.res._json.provenance).toEqual(first.res._json.provenance);
  });
});
