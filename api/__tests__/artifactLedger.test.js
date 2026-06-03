import { jest } from '@jest/globals';

const createClientMock = jest.fn();

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

const { recordLedgerEvent, readLedgerEvents } = await import('../_utils/artifactLedger.js');

describe('recordLedgerEvent', () => {
  const originalEnv = process.env;
  let consoleErrorSpy;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    createClientMock.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('readLedgerEvents', () => {
    const originalEnv = process.env;
    let consoleErrorSpy;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      createClientMock.mockReset();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      process.env = originalEnv;
      consoleErrorSpy.mockRestore();
    });

    test('não quebra quando env do Supabase está ausente', async () => {
      await expect(
        readLedgerEvents({
          artifactId: '123e4567-e89b-42d3-a456-426614174123',
          userId: 'user-1',
        }),
      ).resolves.toEqual({
        events: [],
        error: 'supabase_unavailable',
      });
      expect(createClientMock).not.toHaveBeenCalled();
    });

    test('consulta com artifactId + userId e ordena por created_at asc', async () => {
      const rows = [
        { ledger_id: '1', artifact_id: 'a1', event_type: 'preview_generated', created_at: '2026-06-03T00:00:00.000Z' },
        { ledger_id: '2', artifact_id: 'a1', event_type: 'decision_applied', created_at: '2026-06-03T00:10:00.000Z' },
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: rows, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqArtifactMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqArtifactMock });
      const fromMock = jest.fn().mockReturnValue({ select: selectMock });
      createClientMock.mockReturnValue({ from: fromMock });

      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

      const result = await readLedgerEvents({
        artifactId: 'a1',
        userId: 'user-1',
      });

      expect(fromMock).toHaveBeenCalledWith('artifact_ledger');
      expect(selectMock).toHaveBeenCalledWith(
        'ledger_id,artifact_id,event_type,artifact_checksum,origin_model,origin_prompt_id,artifact_timestamp,preview_validation,preview_status,preview_files_summary,decision,feedback,decision_timestamp,created_at',
      );
      expect(eqArtifactMock).toHaveBeenCalledWith('artifact_id', 'a1');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual({ events: rows, error: null });
    });

    test('retorna lista vazia quando não há eventos', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqArtifactMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqArtifactMock });
      const fromMock = jest.fn().mockReturnValue({ select: selectMock });
      createClientMock.mockReturnValue({ from: fromMock });

      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

      await expect(readLedgerEvents({ artifactId: 'a1', userId: 'user-1' })).resolves.toEqual({
        events: [],
        error: null,
      });
    });

    test('falha de leitura retorna erro controlado', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'read failed' } });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqArtifactMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqArtifactMock });
      const fromMock = jest.fn().mockReturnValue({ select: selectMock });
      createClientMock.mockReturnValue({ from: fromMock });

      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

      await expect(readLedgerEvents({ artifactId: 'a1', userId: 'user-1' })).resolves.toEqual({
        events: [],
        error: 'read_failed',
      });
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  test('não quebra quando env do Supabase está ausente', async () => {
    await expect(
      recordLedgerEvent({
        eventType: 'preview_generated',
        artifactId: '11111111-1111-4111-8111-111111111111',
      }),
    ).resolves.toBe(false);

    expect(createClientMock).not.toHaveBeenCalled();
  });

  test('insere shape mínimo correto para preview_generated', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const fromMock = jest.fn().mockReturnValue({ insert: insertMock });
    createClientMock.mockReturnValue({ from: fromMock });

    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    await expect(
      recordLedgerEvent({
        eventType: 'preview_generated',
        manifest: {
          id: '123e4567-e89b-42d3-a456-426614174000',
          checksum: 'sha256:abc',
          timestamp: '2026-06-03T00:00:00.000Z',
          origin: { model: 'gpt-test', promptId: 'hybrid-genius' },
        },
        preview: {
          summary: {
            validation: { valid: true, errorCount: 0, warningCount: 0 },
            status: { level: 'ok', label: 'ok' },
            filesSummary: { totalFiles: 2, fileNames: ['a.md', 'b.md'] },
          },
          decision: 'pending',
          feedback: null,
          decisionTimestamp: null,
        },
        user: { id: 'user-1', email: 'user@example.com' },
      }),
    ).resolves.toBe(true);

    expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'service-role');
    expect(fromMock).toHaveBeenCalledWith('artifact_ledger');
    expect(insertMock).toHaveBeenCalledTimes(1);

    const row = insertMock.mock.calls[0][0];
    expect(row).toEqual(
      expect.objectContaining({
        artifact_id: '123e4567-e89b-42d3-a456-426614174000',
        event_type: 'preview_generated',
        artifact_checksum: 'sha256:abc',
        origin_model: 'gpt-test',
        origin_prompt_id: 'hybrid-genius',
        artifact_timestamp: '2026-06-03T00:00:00.000Z',
        preview_validation: { valid: true, errorCount: 0, warningCount: 0 },
        preview_status: { level: 'ok', label: 'ok' },
        preview_files_summary: { totalFiles: 2, fileNames: ['a.md', 'b.md'] },
        decision: 'pending',
        decision_timestamp: null,
        user_id: 'user-1',
        user_email: 'user@example.com',
      }),
    );
    expect(row).not.toHaveProperty('zipBase64');
    expect(row).not.toHaveProperty('files');
    expect(row).not.toHaveProperty('content');
  });

  test('falha de insert não propaga erro', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: { message: 'insert failed' } });
    const fromMock = jest.fn().mockReturnValue({ insert: insertMock });
    createClientMock.mockReturnValue({ from: fromMock });

    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    await expect(
      recordLedgerEvent({
        eventType: 'preview_generated',
        artifactId: '22222222-2222-4222-8222-222222222222',
      }),
    ).resolves.toBe(false);
  });

  test('decision_applied inclui campos esperados e trunca feedback', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const fromMock = jest.fn().mockReturnValue({ insert: insertMock });
    createClientMock.mockReturnValue({ from: fromMock });

    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    await expect(
      recordLedgerEvent({
        eventType: 'decision_applied',
        preview: {
          summary: {
            id: '123e4567-e89b-42d3-a456-426614174999',
            timestamp: '2026-06-03T00:00:00.000Z',
            origin: { model: 'llama-test', promptId: 'prompt-1' },
            validation: { valid: false, errorCount: 1, warningCount: 0 },
            status: { level: 'incomplete' },
            filesSummary: { totalFiles: 1 },
          },
          decision: 'rejected',
          feedback: 'x'.repeat(2000),
          decisionTimestamp: '2026-06-03T00:10:00.000Z',
        },
        user: { id: 'user-2', email: 'user2@example.com' },
      }),
    ).resolves.toBe(true);

    const row = insertMock.mock.calls[0][0];
    expect(row).toEqual(
      expect.objectContaining({
        artifact_id: '123e4567-e89b-42d3-a456-426614174999',
        event_type: 'decision_applied',
        origin_model: 'llama-test',
        origin_prompt_id: 'prompt-1',
        decision: 'rejected',
        decision_timestamp: '2026-06-03T00:10:00.000Z',
        user_id: 'user-2',
        user_email: 'user2@example.com',
      }),
    );
    expect(row.feedback).toHaveLength(1000);
  });
});
