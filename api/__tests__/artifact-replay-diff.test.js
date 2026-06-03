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
let buildArtifactReplayDiff;

beforeAll(async () => {
  handler = (await import('../artifact-replay-diff.js')).default;
  ({ buildArtifactReplayDiff } = await import('../_utils/artifactReplayDiff.js'));
});

beforeEach(() => {
  verifyAuthMock.mockReset();
  readLedgerEventsMock.mockReset();
});

describe('/api/artifact-replay-diff', () => {
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

  test('no_events', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({ events: [], error: null });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.diff.status).toBe('no_events');
    expect(res._json.diff.transitionCount).toBe(0);
  });

  test('single_event', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.diff.status).toBe('single_event');
    expect(res._json.diff.transitionCount).toBe(0);
  });

  test('transição preview → decisão', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        {
          ledger_id: '1',
          event_type: 'preview_generated',
          created_at: '2026-06-03T00:00:00.000Z',
          trace_id: 'trace-1',
          artifact_checksum: 'sha256:a',
          preview_validation: { valid: true },
          preview_files_summary: { total: 2 },
        },
        {
          ledger_id: '2',
          event_type: 'decision_applied',
          decision: 'approved',
          created_at: '2026-06-03T00:10:00.000Z',
          trace_id: 'trace-1',
          artifact_checksum: 'sha256:a',
          feedback: 'ok',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.diff.transitionCount).toBe(1);
    expect(res._json.diff.transitions[0]).toMatchObject({
      step: 1,
      fromStep: 1,
      toStep: 2,
      fromEventType: 'preview_generated',
      toEventType: 'decision_applied',
      fromDecision: null,
      toDecision: 'approved',
      secondsBetween: 600,
      traceIdChanged: false,
      checksumChanged: false,
      validationChanged: false,
      filesSummaryChanged: false,
      hasFeedbackOnToEvent: true,
    });
  });

  test('approved', async () => {
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
    expect(res._json.diff.status).toBe('approved');
  });

  test('rejected', async () => {
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
    expect(res._json.diff.status).toBe('rejected');
  });

  test('decision_pending', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
        { ledger_id: '2', event_type: 'preview_generated', created_at: '2026-06-03T00:05:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.diff.status).toBe('decision_pending');
  });

  test('incomplete_history', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [
        { ledger_id: '1', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
        { ledger_id: '2', event_type: 'decision_applied', decision: 'rejected', created_at: '2026-06-03T00:15:00.000Z' },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.diff.status).toBe('incomplete_history');
  });

  test('ordenação determinística por created_at e ledger_id', () => {
    const events = [
      { ledger_id: '2', event_type: 'decision_applied', decision: 'approved', created_at: '2026-06-03T00:10:00.000Z' },
      { ledger_id: 'b', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
      { ledger_id: 'a', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
    ];

    const first = buildArtifactReplayDiff(events);
    const second = buildArtifactReplayDiff(events);

    expect(first).toEqual(second);
    expect(first.transitions[0].fromEventType).toBe('preview_generated');
    expect(first.transitions[0].toEventType).toBe('preview_generated');
    expect(first.transitions[1].toEventType).toBe('decision_applied');
  });

  test('não retorna eventos brutos', async () => {
    verifyAuthMock.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null });
    readLedgerEventsMock.mockResolvedValueOnce({
      events: [{ ledger_id: '1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' }],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).not.toHaveProperty('events');
    expect(res._json.diff).not.toHaveProperty('rawEvents');
  });

  test('não retorna zipBase64/files/content/contentPreview/user_email/feedback bruto', async () => {
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
        {
          ledger_id: '2',
          event_type: 'decision_applied',
          decision: 'rejected',
          created_at: '2026-06-03T00:10:00.000Z',
          feedback: 'texto interno',
        },
      ],
      error: null,
    });
    const { req, res } = makeReqRes('GET', { artifactId: 'a-1' });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.diff).not.toHaveProperty('zipBase64');
    expect(res._json.diff).not.toHaveProperty('files');
    expect(res._json.diff).not.toHaveProperty('content');
    expect(res._json.diff).not.toHaveProperty('contentPreview');
    expect(res._json.diff).not.toHaveProperty('user_email');
    expect(res._json.diff).not.toHaveProperty('feedback');
    expect(res._json.diff.transitions[0]).toHaveProperty('hasFeedbackOnToEvent', true);
    expect(res._json.diff.transitions[0]).not.toHaveProperty('feedback');
  });

  test('erro de readLedgerEvents retorna erro controlado', async () => {
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
});
