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
let buildArtifactProvenance;

beforeAll(async () => {
  handler = (await import('../artifact-provenance.js')).default;
  ({ buildArtifactProvenance } = await import('../_utils/artifactProvenance.js'));
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
    expect(res._json.provenance.eventCount).toBe(0);
  });

  test('retorna decision_pending quando há preview sem decisão', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          event_type: 'preview_generated',
          trace_id: null,
          artifact_checksum: 'sha256:abc',
          created_at: '2026-06-03T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.status).toBe('decision_pending');
    expect(res._json.provenance.generated).toBe(true);
  });

  test('retorna approved quando há decisão aprovada', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
        { ledger_id: '2', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.status).toBe('approved');
    expect(res._json.provenance.decision).toBe('approved');
  });

  test('retorna rejected quando há decisão rejeitada', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
        { ledger_id: '2', event_type: 'decision_applied', decision: 'rejected', created_at: '2026-06-03T00:10:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.status).toBe('rejected');
    expect(res._json.provenance.decision).toBe('rejected');
  });

  test('retorna incomplete_history quando há decisão sem preview anterior', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.status).toBe('incomplete_history');
  });


  test('retorna unknown para eventos com tipos desconhecidos', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'other_event', created_at: '2026-06-03T00:00:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.status).toBe('unknown');
  });

  test('inclui traceId quando existir', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'preview_generated', trace_id: 'trace-123', created_at: '2026-06-03T00:00:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.provenance.hasTraceId).toBe(true);
    expect(res._json.provenance.traceId).toBe('trace-123');
  });

  test('não retorna conteúdo bruto, arquivos, zipBase64, contentPreview ou user_email', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          event_type: 'preview_generated',
          trace_id: 'trace-abc',
          artifact_checksum: 'sha256:abc',
          created_at: '2026-06-03T00:00:00.000Z',
          zipBase64: 'UEsDBA==',
          files: [{ path: 'a.md', content: '# raw' }],
          content: 'raw',
          contentPreview: 'raw preview',
          user_email: 'user@example.com',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).not.toHaveProperty('events');
    expect(res._json.provenance).not.toHaveProperty('zipBase64');
    expect(res._json.provenance).not.toHaveProperty('files');
    expect(res._json.provenance).not.toHaveProperty('content');
    expect(res._json.provenance).not.toHaveProperty('contentPreview');
    expect(res._json.provenance).not.toHaveProperty('user_email');
  });

  test('falha de readLedgerEvents retorna erro controlado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: 'supabase_unavailable' });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(503);
    expect(res._json.code).toBe('supabase_unavailable');
  });

  test('mocks permanecem isolados entre testes', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(verifyAuthMock).toHaveBeenCalledTimes(1);
    expect(readLedgerEventsMock).toHaveBeenCalledTimes(1);
  });

  test('veredito é determinístico para a mesma lista de eventos', () => {
    const events = [
      { ledger_id: '2', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      { ledger_id: '1', event_type: 'preview_generated', artifact_checksum: 'sha256:abc', created_at: '2026-06-03T00:00:00.000Z' },
    ];

    const first = buildArtifactProvenance(events);
    const second = buildArtifactProvenance(events);

    expect(first).toEqual(second);
    expect(first.status).toBe('approved');
  });
});
