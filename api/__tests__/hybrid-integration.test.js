/**
 * Hybrid Integration Test — Fluxo real do Construtor/Híbrido via api/ai.js
 *
 * Protege contra regressões históricas:
 * - 503 (servidor indisponível / todos os providers falhando)
 * - Resposta vazia ou malformada
 * - Modelo errado sendo usado (8B ou outro não autorizado)
 * - Fallback indevido fora da cadeia 120B → 70B
 * - Prompt do Híbrido sem marcadores estruturais obrigatórios
 *
 * Abordagem: mock de serginho.handleRequest (camada externa), exercita o
 * handler real de api/ai.js com req/res simulados.
 */
import { jest } from '@jest/globals';

// Resposta simulada bem-sucedida do LLM (estrutura real retornada pelo orchestrator)
const MOCK_LLM_RESULT = {
  text: '## ENTENDIMENTO\nCriar componente React.\n\n## ARTEFATO\n```jsx\nfunction App() { return <div>Hello</div>; }\n```\n\n## RESUMO\nComponente criado com sucesso.',
  model: { logicalTier: 'complex', infrastructure: 'groq', modelId: 'llama-3.1-70b-versatile' },
  provider: 'llama-120b',
  tier: 'complex',
  complexity: 'high',
  routing: { cacheHit: false },
  execution: { status: 'success', fallbackLevel: 0 },
  usage: { promptTokens: 100, completionTokens: 200 },
};

function makeMockRes() {
  const res = {};
  res.setHeader = jest.fn();
  res.status = function (code) { res._status = code; return res; };
  res.json = function (body) { res._body = body; return res; };
  res.end = jest.fn();
  return res;
}

// Mensagens únicas por teste para não colidir com o cache em memória
function makeHybridReq(id) {
  return {
    method: 'POST',
    body: {
      type: 'hybrid',
      messages: [{ role: 'user', content: `hybrid-integration-test-${id}: crie um componente React` }],
    },
  };
}

describe('Hybrid Integration — api/ai.js fluxo real do Construtor', () => {
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
    serginho.handleRequest = jest.fn().mockResolvedValue(MOCK_LLM_RESULT);
  });

  afterEach(() => {
    serginho.handleRequest = originalHandleRequest;
  });

  it('retorna 200 e não 503 para requisição hybrid válida', async () => {
    const res = makeMockRes();
    await handler(makeHybridReq('A'), res);
    expect(res._status).toBe(200);
  });

  it('resposta contém conteúdo não vazio', async () => {
    const res = makeMockRes();
    await handler(makeHybridReq('B'), res);
    expect(res._body.response).toBeTruthy();
    expect(typeof res._body.response).toBe('string');
    expect(res._body.response.length).toBeGreaterThan(0);
  });

  it('resposta tem estrutura esperada pelo frontend (response, type, success, metadata)', async () => {
    const res = makeMockRes();
    await handler(makeHybridReq('C'), res);
    expect(res._body).toHaveProperty('response');
    expect(res._body).toHaveProperty('type', 'hybrid');
    expect(res._body).toHaveProperty('success', true);
    expect(res._body).toHaveProperty('metadata');
  });

  it('preserva metadados do modelo retornado pelo orchestrator', async () => {
    const res = makeMockRes();
    await handler(makeHybridReq('D'), res);
    expect(res._body).toHaveProperty('model');
    expect(res._body).toHaveProperty('provider');
    expect(res._body.metadata).toHaveProperty('provider');
  });

  it('buildGeniusPrompt("hybrid") contém marcadores CONSTRUTOR e IDENTIDADE do v3.2', async () => {
    const { default: geniusPrompts } = await import('../../src/prompts/geniusPrompts.js');
    const prompt = geniusPrompts.buildGeniusPrompt('hybrid');
    expect(prompt).toContain('CONSTRUTOR');
    expect(prompt).toContain('IDENTIDADE:');
    expect(prompt).toContain('CLASSIFICAÇÃO DE INTENÇÃO');
    expect(prompt).toContain('COMPORTAMENTO:');
    expect(prompt).toContain('LIMITES:');
  });

  it('handler chama orchestrator com forceProvider llama-120b (não outro modelo)', async () => {
    const res = makeMockRes();
    await handler(makeHybridReq('E'), res);
    const callArg = serginho.handleRequest.mock.calls[0][0];
    expect(callArg.options.forceProvider).toBe('llama-120b');
  });

  it('fallback 120B → 70B: quando 120B falha, retorna 200 via 70B sem 503', async () => {
    serginho.handleRequest = jest.fn().mockImplementation((params) => {
      if (params.options?.forceProvider === 'llama-120b') {
        throw new Error('llama-120b unavailable');
      }
      return Promise.resolve({ ...MOCK_LLM_RESULT, provider: 'llama-70b' });
    });
    const res = makeMockRes();
    await handler(makeHybridReq('F'), res);
    expect(res._status).toBe(200);
    expect(res._body.response).toBeTruthy();
  });

  it('falha total (120B e 70B indisponíveis) retorna 503 com corpo de erro informativo', async () => {
    serginho.handleRequest = jest.fn().mockRejectedValue(new Error('provider unavailable'));
    const res = makeMockRes();
    await handler(makeHybridReq('G'), res);
    expect(res._status).toBe(503);
    expect(res._body).toHaveProperty('error');
    expect(res._body.error).toBeTruthy();
  });
});
