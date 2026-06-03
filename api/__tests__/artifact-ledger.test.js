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
  handler = (await import('../artifact-ledger.js')).default;
});

beforeEach(() => {
  verifyAuthMock.mockReset();
  readLedgerEventsMock.mockReset();
});

describe('/api/artifact-ledger', () => {
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
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(readLedgerEventsMock).toHaveBeenCalledWith({ artifactId: 'a-1', userId: 'user-1' });
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
  });

  test('retorna lista de eventos ordenada', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    const ordered = [
      { ledger_id: '1', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
      { ledger_id: '2', artifact_id: 'a-1', event_type: 'decision_applied', created_at: '2026-06-03T00:10:00.000Z' },
    ];
    readLedgerEventsMock.mockResolvedValueOnce({ events: ordered, error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.events).toEqual([
      expect.objectContaining({ ledger_id: '1', created_at: '2026-06-03T00:00:00.000Z' }),
      expect.objectContaining({ ledger_id: '2', created_at: '2026-06-03T00:10:00.000Z' }),
    ]);
  });

  test('retorna lista vazia quando não há eventos', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.events).toEqual([]);
  });

  test('não retorna conteúdo bruto, zipBase64, arquivos ou contentPreview', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
          trace_id: 'trace-abc',
          artifact_checksum: 'sha256:abc',
          created_at: '2026-06-03T00:00:00.000Z',
          zipBase64: 'UEsDBA==',
          files: [{ path: 'a.md', content: '# raw' }],
          content: 'raw',
          contentPreview: 'raw preview',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    const event = res._json.events[0];
    expect(event).toEqual(
      expect.objectContaining({
        ledger_id: '1',
        artifact_id: 'a-1',
        event_type: 'preview_generated',
        trace_id: 'trace-abc',
      }),
    );
    expect(event).not.toHaveProperty('zipBase64');
    expect(event).not.toHaveProperty('files');
    expect(event).not.toHaveProperty('content');
    expect(event).not.toHaveProperty('contentPreview');
  });

  test('falha de Supabase retorna erro controlado', async () => {
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
});
