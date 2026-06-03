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
let buildArtifactReplay;

beforeAll(async () => {
  handler = (await import('../artifact-replay.js')).default;
  ({ buildArtifactReplay } = await import('../_utils/artifactReplay.js'));
});

beforeEach(() => {
  verifyAuthMock.mockReset();
  readLedgerEventsMock.mockReset();
});

describe('/api/artifact-replay', () => {
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

  test('no_events com timeline vazia', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.replay.status).toBe('no_events');
    expect(res._json.replay.timeline).toEqual([]);
  });

  test('preview sem decisão => decision_pending', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.replay.status).toBe('decision_pending');
  });

  test('aprovado => approved', async () => {
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
    expect(res._json.replay.status).toBe('approved');
  });

  test('rejeitado => rejected', async () => {
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
    expect(res._json.replay.status).toBe('rejected');
  });

  test('decisão sem preview anterior => incomplete_history', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.replay.status).toBe('incomplete_history');
  });

  test('inclui traceId/checksum quando existirem', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          event_type: 'preview_generated',
          trace_id: 'trace-123',
          artifact_checksum: 'sha256:abc',
          created_at: '2026-06-03T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.replay.hasTraceId).toBe(true);
    expect(res._json.replay.traceIds).toEqual(['trace-123']);
    expect(res._json.replay.hasChecksum).toBe(true);
    expect(res._json.replay.checksum).toBe('sha256:abc');
  });

  test('não retorna events brutos', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).not.toHaveProperty('events');
    expect(res._json).toHaveProperty('replay.timeline');
  });

  test('não retorna zipBase64, files, content, contentPreview ou user_email', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
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
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    const timelineRow = res._json.replay.timeline[0];
    expect(timelineRow).not.toHaveProperty('zipBase64');
    expect(timelineRow).not.toHaveProperty('files');
    expect(timelineRow).not.toHaveProperty('content');
    expect(timelineRow).not.toHaveProperty('contentPreview');
    expect(timelineRow).not.toHaveProperty('user_email');
  });

  test('não retorna feedback bruto', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          event_type: 'decision_applied',
          decision: 'rejected',
          feedback: 'texto interno',
          created_at: '2026-06-03T00:10:00.000Z',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    const timelineRow = res._json.replay.timeline[0];
    expect(timelineRow.hasFeedback).toBe(true);
    expect(timelineRow).not.toHaveProperty('feedback');
  });

  test('erro de readLedgerEvents retorna erro controlado', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: 'supabase_unavailable' });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(503);
    expect(res._json.code).toBe('supabase_unavailable');
  });

  test('timeline é determinística', () => {
    const events = [
      { ledger_id: '2', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      { ledger_id: '1', event_type: 'preview_generated', artifact_checksum: 'sha256:abc', created_at: '2026-06-03T00:00:00.000Z' },
      { ledger_id: '0', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
    ];

    const first = buildArtifactReplay(events);
    const second = buildArtifactReplay(events);

    expect(first).toEqual(second);
    expect(first.timeline[0].step).toBe(1);
    expect(first.timeline[0].eventType).toBe('preview_generated');
  });

  test('mocks não vazam', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(verifyAuthMock).toHaveBeenCalledTimes(1);
    expect(readLedgerEventsMock).toHaveBeenCalledTimes(1);
  });
});
