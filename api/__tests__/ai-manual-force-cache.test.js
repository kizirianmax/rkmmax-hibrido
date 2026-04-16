import { jest } from '@jest/globals';
import { cacheResponse, responseCache } from '../../src/utils/costOptimization.js';

function makeMockRes() {
  const res = {};
  res.setHeader = jest.fn();
  res.status = function status(code) { this._status = code; return this; };
  res.json = function json(body) { this._body = body; return this; };
  res.end = jest.fn();
  return res;
}

describe('api/ai.js — soberania de motor manual no cache (genius)', () => {
  let handler;
  let serginho;
  let originalHandleRequest;

  const cachedMessages = [{ role: 'user', content: 'oi cache sovereignty test' }];

  beforeAll(async () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    serginho = (await import('../lib/serginho-orchestrator.js')).default;
    ({ default: handler } = await import('../ai.js'));
    originalHandleRequest = serginho.handleRequest.bind(serginho);
  });

  beforeEach(() => {
    responseCache.clear();
    serginho.handleRequest = jest.fn().mockResolvedValue({
      text: 'manual engine response',
      model: { logicalTier: 'simple', infrastructure: 'groq', modelId: 'llama-test' },
      provider: 'groq',
      tier: 'simple',
      complexity: 'low',
      routing: { cacheHit: false, routingReason: 'forced' },
      execution: { status: 'success', fallbackLevel: 0 },
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    });
  });

  afterEach(() => {
    serginho.handleRequest = originalHandleRequest;
    responseCache.clear();
  });

  test('modo automático mantém cache hit no fluxo genius', async () => {
    cacheResponse(cachedMessages, {
      response: 'cached auto response',
      provider: 'llama-70b',
      type: 'serginho',
      success: true,
    });

    const req = {
      method: 'POST',
      body: { type: 'genius', messages: cachedMessages },
    };
    const res = makeMockRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.cached).toBe(true);
    expect(res._body.response).toBe('cached auto response');
    expect(serginho.handleRequest).not.toHaveBeenCalled();
  });

  test('com forceProvider, ignora cache e executa no provider manual', async () => {
    cacheResponse(cachedMessages, {
      response: 'cached auto response',
      provider: 'llama-70b',
      type: 'serginho',
      success: true,
    });

    const req = {
      method: 'POST',
      body: {
        type: 'genius',
        messages: cachedMessages,
        forceProvider: 'gemini-pro',
      },
    };
    const res = makeMockRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.cached).toBe(false);
    expect(serginho.handleRequest).toHaveBeenCalledTimes(1);
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.options.forceProvider).toBe('gemini-pro');
    expect(callArg.options.noFallback).toBe(true);
  });
});
