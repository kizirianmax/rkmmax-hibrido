import { jest } from '@jest/globals';
import handler from '../transcribe.js';

const createMockRes = () => {
  const res = {};
  res.setHeader = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.end = jest.fn(() => res);
  return res;
};

describe('/api/transcribe controlled unavailability', () => {
  test('returns 200 for OPTIONS preflight', async () => {
    const req = { method: 'OPTIONS' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  test('returns 405 for non-POST methods', async () => {
    const req = { method: 'GET' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  test('returns deterministic 501 payload for POST', async () => {
    const req = { method: 'POST' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not implemented',
      code: 'TRANSCRIPTION_NOT_AVAILABLE',
      message: 'A transcrição de áudio está temporariamente indisponível até a implementação real do fluxo de voz.',
    });
  });
});
