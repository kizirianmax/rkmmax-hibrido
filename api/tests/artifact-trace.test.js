import { jest } from '@jest/globals';

const verifyAuthMock = jest.fn();
const readLedgerEventsByTraceIdMock = jest.fn();
const readLedgerEventsMock = jest.fn();

jest.unstable_mockModule('../lib/auth.js', () => ({
  verifyAuth: verifyAuthMock,
}));

jest.unstable_mockModule('../_utils/artifactLedger.js', () => ({
  readLedgerEventsByTraceId: readLedgerEventsByTraceIdMock,
  readLedgerEvents: readLedgerEventsMock,
}));

function makeReqRes(method = 'GET', query = {}, headers = {}) {
  const req = { method, query, headers };
  const res = {
    _status: null,
    _json: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._json = data;
      return this;
    },
  };
  return { req, res };
}

let handler;
let buildArtifactTrace;

beforeAll(async () => {
  handler = (await import('../artifact-trace.js')).default;
  ({ buildArtifactTrace } = await import('../_utils/artifactTrace.js'));
});

beforeEach(() => {
  verifyAuthMock.mockReset();
  readLedgerEventsByTraceIdMock.mockReset();
  readLedgerEventsMock.mockReset();
});

describe('/api/artifact-trace', () => {
  test('rejeita sem autenticação', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: null, error: 'missing_token' });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json.code).toBe('missing_token');
    expect(readLedgerEventsByTraceIdMock).not.toHaveBeenCalled();
  });

  test('rejeita sem traceId', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    const { req, res } = makeReqRes('GET', {});

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.code).toBe('missing_trace_id');
    expect(readLedgerEventsByTraceIdMock).not.toHaveBeenCalled();
  });

  test('consulta com traceId e user.id autenticado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { traceId: '  trace-1  ' });

    await handler(req, res);

    expect(readLedgerEventsByTraceIdMock).toHaveBeenCalledWith({ traceId: 'trace-1', userId: 'user-1' });
    expect(res._status).toBe(200);
    expect(res._json.success).toBe(true);
    expect(readLedgerEventsMock).not.toHaveBeenCalled();
  });

  test('usa filtro obrigatório traceId + userId', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-77' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-77' });

    await handler(req, res);

    expect(readLedgerEventsByTraceIdMock).toHaveBeenCalledWith({ traceId: 'trace-77', userId: 'user-77' });
    expect(readLedgerEventsByTraceIdMock).toHaveBeenCalledTimes(1);
  });

  test('no_events com timeline vazia', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.trace.status).toBe('no_events');
    expect(res._json.trace.timeline).toEqual([]);
  });

  test('single_artifact', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '2', artifact_id: 'a-1', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
        { ledger_id: '1', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.trace.status).toBe('single_artifact');
    expect(res._json.trace.artifactCount).toBe(1);
    expect(res._json.trace.artifactIds).toEqual(['a-1']);
  });

  test('multi_artifact', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
        { ledger_id: '2', artifact_id: 'a-2', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.trace.status).toBe('multi_artifact');
    expect(res._json.trace.artifactCount).toBe(2);
  });

  test('ordenação determinística por created_at e ledger_id', () => {
    const events = [
      { ledger_id: '2', artifact_id: 'a-1', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      { ledger_id: '1', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
      { ledger_id: '0', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
    ];

    const first = buildArtifactTrace(events);
    const second = buildArtifactTrace(events);

    expect(first).toEqual(second);
    expect(first.timeline.map((item) => item.step)).toEqual([1, 2, 3]);
    expect(first.timeline[0].createdAt).toBe('2026-06-03T00:00:00.000Z');
    expect(first.timeline[0].artifactId).toBe('a-1');
  });

  test('não retorna eventos brutos', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', artifact_id: 'a-1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).not.toHaveProperty('events');
    expect(res._json).toHaveProperty('trace.timeline');
  });

  test('não retorna zipBase64, files, content, contentPreview ou user_email', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'preview_generated',
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
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    const timelineRow = res._json.trace.timeline[0];
    expect(timelineRow).not.toHaveProperty('zipBase64');
    expect(timelineRow).not.toHaveProperty('files');
    expect(timelineRow).not.toHaveProperty('content');
    expect(timelineRow).not.toHaveProperty('contentPreview');
    expect(timelineRow).not.toHaveProperty('user_email');
  });

  test('não retorna feedback bruto, apenas hasFeedback', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          artifact_id: 'a-1',
          event_type: 'decision_applied',
          decision: 'rejected',
          feedback: 'texto interno',
          created_at: '2026-06-03T00:10:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    const timelineRow = res._json.trace.timeline[0];
    expect(timelineRow.hasFeedback).toBe(true);
    expect(timelineRow).not.toHaveProperty('feedback');
  });

  test('erro controlado de readLedgerEventsByTraceId', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({ events: [], error: 'supabase_unavailable' });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(503);
    expect(res._json.code).toBe('supabase_unavailable');
  });

  test('mocks não vazam entre testes', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(verifyAuthMock).toHaveBeenCalledTimes(1);
    expect(readLedgerEventsByTraceIdMock).toHaveBeenCalledTimes(1);
    expect(readLedgerEventsMock).not.toHaveBeenCalled();
  });

  test('não altera helpers/endpoints existentes de replay/provenance', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsByTraceIdMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { traceId: 'trace-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(readLedgerEventsByTraceIdMock).toHaveBeenCalledTimes(1);
    expect(readLedgerEventsMock).not.toHaveBeenCalled();
  });
});
