/**
 * F7-UX-08 — Paridade do seletor de motor de IA: Especialistas
 *
 * Verifica que:
 * - O endpoint specialist aceita `forceProvider` e passa pelo orquestrador (sem bypass).
 * - Quando `forceProvider` está ausente (auto), o fluxo padrão do orquestrador é usado.
 * - O cache é ignorado quando `forceProvider` está definido.
 * - MANUAL_MODEL_OPTIONS é a fonte compartilhada (Serginho IA, Híbrido e Especialistas).
 * - Nenhum provider é chamado diretamente — toda execução passa pelo Serginho/orquestrador.
 */
import { jest } from '@jest/globals';
import { cacheResponse, responseCache } from '../../src/utils/costOptimization.js';
import { MANUAL_MODEL_OPTIONS } from '../../src/config/modelPriority.js';

const MOCK_LLM_RESULT = {
  text: 'Resposta do especialista.',
  model: { logicalTier: 'simple', infrastructure: 'groq', modelId: 'llama-3.1-70b-versatile' },
  provider: 'llama-70b',
  tier: 'simple',
  complexity: 'low',
  routing: { cacheHit: false },
  execution: { status: 'success', fallbackLevel: 0 },
  usage: { prompt_tokens: 10, completion_tokens: 20 },
};

function makeMockRes() {
  const res = {};
  res.setHeader = jest.fn();
  res.status = function (code) { res._status = code; return res; };
  res.json = function (body) { res._body = body; return res; };
  res.end = jest.fn();
  return res;
}

function makeSpecialistReq(id, extra = {}) {
  return {
    method: 'POST',
    body: {
      type: 'specialist',
      specialistId: 'data',
      messages: [{ role: 'user', content: `specialist-model-selector-test-${id}: analise estes dados` }],
      ...extra,
    },
  };
}

describe('F7-UX-08 — MANUAL_MODEL_OPTIONS: fonte compartilhada entre Serginho, Híbrido e Especialistas', () => {
  test('primeiro item é Automático com providerName null', () => {
    expect(MANUAL_MODEL_OPTIONS[0].id).toBe('auto');
    expect(MANUAL_MODEL_OPTIONS[0].label).toBe('Automático');
    expect(MANUAL_MODEL_OPTIONS[0].providerName).toBeNull();
  });

  test('todos os itens têm id, label e icon', () => {
    MANUAL_MODEL_OPTIONS.forEach((opt) => {
      expect(opt.id).toBeDefined();
      expect(opt.label).toBeDefined();
      expect(opt.icon).toBeDefined();
    });
  });

  test('opções manuais (não-auto) têm providerName definido', () => {
    const manual = MANUAL_MODEL_OPTIONS.filter((o) => o.id !== 'auto');
    manual.forEach((opt) => {
      expect(opt.providerName).toBeTruthy();
    });
  });
});

describe('F7-UX-08 — Specialist: forceProvider encaminhado pelo orquestrador (sem bypass)', () => {
  let handler;
  let serginho;
  let originalHandleRequest;

  beforeAll(async () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    serginho = (await import('../lib/serginho-orchestrator.js')).default;
    ({ default: handler } = await import('../ai.js'));
    originalHandleRequest = serginho.handleRequest.bind(serginho);
  });

  beforeEach(() => {
    responseCache.clear();
    serginho.handleRequest = jest.fn().mockResolvedValue(MOCK_LLM_RESULT);
  });

  afterEach(() => {
    serginho.handleRequest = originalHandleRequest;
    responseCache.clear();
  });

  test('sem forceProvider: retorna 200 usando roteamento automático do orquestrador', async () => {
    const res = makeMockRes();
    await handler(makeSpecialistReq('A'), res);
    expect(res._status).toBe(200);
    expect(res._body.response).toBeTruthy();
    expect(serginho.handleRequest).toHaveBeenCalledTimes(1);
    // sem forceProvider: options não deve ter forceProvider
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.options?.forceProvider).toBeUndefined();
  });

  test('com forceProvider=gemini-pro: orquestrador recebe forceProvider (sem bypass direto)', async () => {
    const res = makeMockRes();
    await handler(makeSpecialistReq('B', { forceProvider: 'gemini-pro' }), res);
    expect(res._status).toBe(200);
    expect(serginho.handleRequest).toHaveBeenCalledTimes(1);
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.options.forceProvider).toBe('gemini-pro');
  });

  test('com forceProvider=llama-70b: orquestrador recebe forceProvider correto', async () => {
    const res = makeMockRes();
    await handler(makeSpecialistReq('C', { forceProvider: 'llama-70b' }), res);
    expect(res._status).toBe(200);
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.options.forceProvider).toBe('llama-70b');
  });

  test('com forceProvider=auto: tratado como ausente, sem forceProvider no orquestrador', async () => {
    const res = makeMockRes();
    await handler(makeSpecialistReq('D', { forceProvider: 'auto' }), res);
    expect(res._status).toBe(200);
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.options?.forceProvider).toBeUndefined();
  });

  test('cache é ignorado quando forceProvider está definido', async () => {
    const msgs = [{ role: 'user', content: 'specialist-cache-bypass-test-E: analise dados' }];
    cacheResponse(msgs, {
      response: 'cached specialist response',
      provider: 'llama-70b',
      success: true,
    });

    const res = makeMockRes();
    await handler(
      {
        method: 'POST',
        body: {
          type: 'specialist',
          specialistId: 'data',
          messages: msgs,
          forceProvider: 'gemini-pro',
        },
      },
      res
    );

    expect(res._status).toBe(200);
    // orquestrador deve ter sido chamado (cache ignorado)
    expect(serginho.handleRequest).toHaveBeenCalledTimes(1);
    expect(res._body.cached).toBeFalsy();
  });

  test('cache é usado quando forceProvider está ausente (modo auto)', async () => {
    const msgs = [{ role: 'user', content: 'specialist-cache-auto-test-F: analise dados' }];
    cacheResponse(msgs, {
      response: 'cached specialist auto response',
      provider: 'llama-70b',
      success: true,
    });

    const res = makeMockRes();
    await handler(
      {
        method: 'POST',
        body: {
          type: 'specialist',
          specialistId: 'data',
          messages: msgs,
        },
      },
      res
    );

    expect(res._status).toBe(200);
    expect(res._body.cached).toBe(true);
    expect(serginho.handleRequest).not.toHaveBeenCalled();
  });

  test('Serginho/orquestrador é sempre o gateway: handleRequest chamado, nunca provider direto', async () => {
    const res = makeMockRes();
    await handler(makeSpecialistReq('G', { forceProvider: 'gemini-3-flash' }), res);
    // Verificar que o caminho passou pelo orquestrador
    expect(serginho.handleRequest).toHaveBeenCalledTimes(1);
    // Verificar que a chamada tem contexto de source correto
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.context?.source).toBe('specialist-api');
  });
});
