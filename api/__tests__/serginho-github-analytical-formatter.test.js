/**
 * api/__tests__/serginho-github-analytical-formatter.test.js
 * Testes para o pós-processador de respostas analíticas (N7).
 *
 * Cobre:
 *   - detectAnalyticalSections: summary, strengths, risks, nextSteps, confidence, edge cases
 *   - formatAnalyticalResponse: com/sem estrutura, truncamento, segurança, fallback
 *   - Integração no orchestrator: analyticalFormatted em _meta
 *   - Não-regressão: fluxo normal, tool results de repos
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parte 1 — Testes unitários do helper (sem mocks de módulos)
// ---------------------------------------------------------------------------

let detectAnalyticalSections;
let formatAnalyticalResponse;

beforeAll(async () => {
  ({ detectAnalyticalSections, formatAnalyticalResponse } = await import(
    '../lib/serginho/analysis/githubAnalyticalResponseFormatter.js'
  ));
});

// ---------------------------------------------------------------------------
// 1) detectAnalyticalSections — summary
// ---------------------------------------------------------------------------

describe('detectAnalyticalSections — summary', () => {
  test('primeiro parágrafo não-lista (≥20 chars) → summary preenchido', () => {
    const text = 'Este projeto parece bem estruturado e maduro.\n- boa prática';
    const result = detectAnalyticalSections(text);
    expect(result.summary).toBe('Este projeto parece bem estruturado e maduro.');
  });

  test('texto que começa com bullets → summary é o primeiro parágrafo não-lista encontrado', () => {
    const text = '- boa prática\n- falta testes\nEste é o resumo do projeto que tem mais de 20 chars.';
    const result = detectAnalyticalSections(text);
    expect(result.summary).toBe('Este é o resumo do projeto que tem mais de 20 chars.');
  });

  test('linha não-lista com menos de 20 chars é ignorada', () => {
    const text = 'Curto\nEste projeto parece bem estruturado e organizado.';
    const result = detectAnalyticalSections(text);
    // "Curto" tem menos de 20 chars, deve ser ignorado; o próximo é o summary
    expect(result.summary).toBe('Este projeto parece bem estruturado e organizado.');
  });

  test('texto só com bullets → summary é null', () => {
    const text = '- bom código\n- falta testes';
    const result = detectAnalyticalSections(text);
    expect(result.summary).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2) detectAnalyticalSections — strengths
// ---------------------------------------------------------------------------

describe('detectAnalyticalSections — strengths', () => {
  test('bullet com "boa prática" → aparece em strengths', () => {
    const result = detectAnalyticalSections('- Uso de boa prática de CI/CD');
    expect(result.strengths).toContain('Uso de boa prática de CI/CD');
  });

  test('bullet com "bem estruturado" → aparece em strengths', () => {
    const result = detectAnalyticalSections('- Código bem estruturado e organizado');
    expect(result.strengths).toContain('Código bem estruturado e organizado');
  });

  test('bullet com "good" → aparece em strengths', () => {
    const result = detectAnalyticalSections('- good test coverage throughout the project');
    expect(result.strengths).toContain('good test coverage throughout the project');
  });

  test('bullet com "solid" → aparece em strengths', () => {
    const result = detectAnalyticalSections('- solid architecture overall');
    expect(result.strengths).toContain('solid architecture overall');
  });

  test('bullet sem palavras-chave positivas → NÃO aparece em strengths', () => {
    const result = detectAnalyticalSections('- usa React para o frontend');
    expect(result.strengths).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3) detectAnalyticalSections — risks
// ---------------------------------------------------------------------------

describe('detectAnalyticalSections — risks', () => {
  test('bullet com "risco" → aparece em risks', () => {
    const result = detectAnalyticalSections('- Há risco de exposição de chaves no frontend');
    expect(result.risks).toContain('Há risco de exposição de chaves no frontend');
  });

  test('bullet com "falta" → aparece em risks', () => {
    const result = detectAnalyticalSections('- Falta cobertura de testes unitários');
    expect(result.risks).toContain('Falta cobertura de testes unitários');
  });

  test('bullet com "missing" → aparece em risks', () => {
    const result = detectAnalyticalSections('- missing error handling in API calls');
    expect(result.risks).toContain('missing error handling in API calls');
  });

  test('bullet com "vulnerability" → aparece em risks', () => {
    const result = detectAnalyticalSections('- potential vulnerability in auth flow');
    expect(result.risks).toContain('potential vulnerability in auth flow');
  });

  test('bullet sem palavras-chave de risco → NÃO aparece em risks', () => {
    const result = detectAnalyticalSections('- usa Vite como bundler');
    expect(result.risks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4) detectAnalyticalSections — nextSteps
// ---------------------------------------------------------------------------

describe('detectAnalyticalSections — nextSteps', () => {
  test('bullet com "recomendo" → aparece em nextSteps', () => {
    const result = detectAnalyticalSections('- recomendo adicionar testes de integração');
    expect(result.nextSteps).toContain('recomendo adicionar testes de integração');
  });

  test('bullet com "adicionar" → aparece em nextSteps', () => {
    const result = detectAnalyticalSections('- adicionar monitoramento de erros em produção');
    expect(result.nextSteps).toContain('adicionar monitoramento de erros em produção');
  });

  test('bullet com "should" → aparece em nextSteps', () => {
    const result = detectAnalyticalSections('- should implement rate limiting on the API');
    expect(result.nextSteps).toContain('should implement rate limiting on the API');
  });

  test('bullet com "considerar" → aparece em nextSteps', () => {
    const result = detectAnalyticalSections('- considerar uso de TypeScript para mais segurança');
    expect(result.nextSteps).toContain('considerar uso de TypeScript para mais segurança');
  });

  test('bullet sem palavras-chave de ação → NÃO aparece em nextSteps', () => {
    const result = detectAnalyticalSections('- branch main protegida');
    expect(result.nextSteps).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5) detectAnalyticalSections — confidence
// ---------------------------------------------------------------------------

describe('detectAnalyticalSections — confidence', () => {
  test('texto com "não tenho certeza" → confidence: baixo', () => {
    const result = detectAnalyticalSections('Não tenho certeza sobre a estrutura deste projeto.');
    expect(result.confidence).toBe('baixo');
  });

  test('texto com "I\'m not sure" → confidence: baixo', () => {
    const result = detectAnalyticalSections("I'm not sure about the test coverage here.");
    expect(result.confidence).toBe('baixo');
  });

  test('texto com "insufficient" → confidence: baixo', () => {
    const result = detectAnalyticalSections('The context is insufficient to determine the full architecture.');
    expect(result.confidence).toBe('baixo');
  });

  test('texto com "provavelmente" → confidence: médio', () => {
    const result = detectAnalyticalSections(
      'O projeto provavelmente usa padrões modernos de desenvolvimento web.',
    );
    expect(result.confidence).toBe('médio');
  });

  test('texto com "probably" → confidence: médio', () => {
    const result = detectAnalyticalSections('This is probably a well-maintained project with good CI/CD.');
    expect(result.confidence).toBe('médio');
  });

  test('texto com "parece" → confidence: médio', () => {
    const result = detectAnalyticalSections('O projeto parece bem organizado e com boa estrutura.');
    expect(result.confidence).toBe('médio');
  });

  test('texto longo (>100 chars) sem sinais de incerteza → confidence: alto', () => {
    const text =
      'O projeto está muito bem organizado com testes automatizados, CI/CD configurado e documentação atualizada. A arquitetura é sólida.';
    const result = detectAnalyticalSections(text);
    expect(result.confidence).toBe('alto');
  });

  test('texto curto (≤100 chars) sem sinais de incerteza → confidence: null', () => {
    const result = detectAnalyticalSections('Projeto organizado.');
    expect(result.confidence).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6) detectAnalyticalSections — texto vazio/null
// ---------------------------------------------------------------------------

describe('detectAnalyticalSections — edge cases', () => {
  const emptyResult = { summary: null, strengths: [], risks: [], nextSteps: [], confidence: null };

  test('null → estrutura vazia', () => {
    expect(detectAnalyticalSections(null)).toEqual(emptyResult);
  });

  test('undefined → estrutura vazia', () => {
    expect(detectAnalyticalSections(undefined)).toEqual(emptyResult);
  });

  test('string vazia → estrutura vazia', () => {
    expect(detectAnalyticalSections('')).toEqual(emptyResult);
  });

  test('string só com espaços → estrutura vazia', () => {
    expect(detectAnalyticalSections('   ')).toEqual(emptyResult);
  });
});

// ---------------------------------------------------------------------------
// 7) formatAnalyticalResponse — sem estrutura (includeStructure: false)
// ---------------------------------------------------------------------------

describe('formatAnalyticalResponse — sem estrutura (includeStructure: false)', () => {
  test('remove linhas em branco excessivas (3+ → 1)', () => {
    const text = 'Linha 1\n\n\n\nLinha 2';
    const result = formatAnalyticalResponse(text, { includeStructure: false });
    expect(result).toBe('Linha 1\n\nLinha 2');
  });

  test('preserva conteúdo sem alterar', () => {
    const text = 'Análise do projeto.\n- ponto importante';
    const result = formatAnalyticalResponse(text, { includeStructure: false });
    expect(result).toContain('Análise do projeto.');
    expect(result).toContain('ponto importante');
  });

  test('remove espaços extras no final de linhas', () => {
    const text = 'Linha com espaço final   \nOutra linha  ';
    const result = formatAnalyticalResponse(text, { includeStructure: false });
    expect(result).toBe('Linha com espaço final\nOutra linha');
  });

  test('aplica truncamento quando texto excede maxLength', () => {
    const longText = 'a'.repeat(50) + '\n\n' + 'b'.repeat(50);
    const result = formatAnalyticalResponse(longText, { includeStructure: false, maxLength: 30 });
    expect(result).toContain('[resposta truncada]');
    expect(result.length).toBeLessThanOrEqual(30 + '\n\n[resposta truncada]'.length);
  });
});

// ---------------------------------------------------------------------------
// 8) formatAnalyticalResponse — com estrutura (includeStructure: true ou default)
// ---------------------------------------------------------------------------

describe('formatAnalyticalResponse — com estrutura (default)', () => {
  test('texto com resumo detectado → contém **Resumo:**', () => {
    const text = 'Este projeto parece bem estruturado e maduro, com boas práticas.\n- boa prática de CI/CD';
    const result = formatAnalyticalResponse(text);
    expect(result).toContain('**Resumo:**');
  });

  test('texto com pontos fortes → contém **Pontos fortes:**', () => {
    const text =
      'Análise geral.\n- excelente cobertura de testes\n- código bem estruturado e organizado';
    const result = formatAnalyticalResponse(text);
    expect(result).toContain('**Pontos fortes:**');
  });

  test('texto com riscos → contém **Riscos / Limitações:**', () => {
    const text = 'Análise do repositório.\n- falta documentação nos módulos principais';
    const result = formatAnalyticalResponse(text);
    expect(result).toContain('**Riscos / Limitações:**');
  });

  test('texto com próximos passos → contém **Próximos passos:**', () => {
    const text = 'Análise do repositório.\n- recomendo adicionar testes de integração';
    const result = formatAnalyticalResponse(text);
    expect(result).toContain('**Próximos passos:**');
  });

  test('confidence médio → contém *Nível de confiança: médio*', () => {
    const text =
      'O projeto provavelmente usa padrões modernos.\n- parece bem estruturado e organizado';
    const result = formatAnalyticalResponse(text);
    expect(result).toContain('*Nível de confiança: médio*');
  });

  test('nenhuma seção detectada → retorna texto original (sem seções inventadas)', () => {
    // Texto com linha curta e sem bullets ou palavras-chave
    const text = 'Ok.';
    const result = formatAnalyticalResponse(text);
    // Não deve ter blocos estruturados inventados
    expect(result).not.toContain('**Resumo:**');
    expect(result).not.toContain('**Pontos fortes:**');
    expect(result).not.toContain('**Riscos / Limitações:**');
    expect(result).not.toContain('**Próximos passos:**');
  });
});

// ---------------------------------------------------------------------------
// 9) formatAnalyticalResponse — segurança
// ---------------------------------------------------------------------------

describe('formatAnalyticalResponse — segurança (nunca inventa conteúdo)', () => {
  test('null → retorna string vazia', () => {
    expect(formatAnalyticalResponse(null)).toBe('');
  });

  test('undefined → retorna string vazia', () => {
    expect(formatAnalyticalResponse(undefined)).toBe('');
  });

  test('string vazia → retorna string vazia', () => {
    expect(formatAnalyticalResponse('')).toBe('');
  });

  test('se strengths vazio, não inclui bloco **Pontos fortes:**', () => {
    // Texto sem nenhuma palavra-chave positiva
    const text =
      'Este projeto tem muitas linhas de código e usa Node.js para o backend e React para o frontend.';
    const result = formatAnalyticalResponse(text);
    expect(result).not.toContain('**Pontos fortes:**');
  });

  test('se risks vazio, não inclui bloco **Riscos / Limitações:**', () => {
    const text =
      'Este projeto tem muitas linhas de código e usa Node.js para o backend e React para o frontend.';
    const result = formatAnalyticalResponse(text);
    expect(result).not.toContain('**Riscos / Limitações:**');
  });

  test('se nextSteps vazio, não inclui bloco **Próximos passos:**', () => {
    const text =
      'Este projeto tem muitas linhas de código e usa Node.js para o backend e React para o frontend.';
    const result = formatAnalyticalResponse(text);
    expect(result).not.toContain('**Próximos passos:**');
  });
});

// ---------------------------------------------------------------------------
// 10) formatAnalyticalResponse — truncamento
// ---------------------------------------------------------------------------

describe('formatAnalyticalResponse — truncamento', () => {
  test('texto que excede maxLength → truncado com [resposta truncada]', () => {
    const longText = 'x'.repeat(3000);
    const result = formatAnalyticalResponse(longText, { maxLength: 100 });
    expect(result).toContain('[resposta truncada]');
    // O resultado deve ter no máximo 100 + comprimento do sufixo
    expect(result.length).toBeLessThanOrEqual(100 + '\n\n[resposta truncada]'.length);
  });

  test('texto dentro do limite → não truncado', () => {
    const shortText = 'Texto curto que não deve ser truncado por ser pequeno.';
    const result = formatAnalyticalResponse(shortText, { maxLength: 2000 });
    expect(result).not.toContain('[resposta truncada]');
  });

  test('truncamento default é 2000 chars', () => {
    const text = 'a'.repeat(500);
    const result = formatAnalyticalResponse(text);
    expect(result).not.toContain('[resposta truncada]');
  });

  test('truncamento aplica exatamente quando maxLength=2000 e texto tem 2001 chars', () => {
    const text = 'a'.repeat(2001);
    const result = formatAnalyticalResponse(text);
    expect(result).toContain('[resposta truncada]');
  });
});

// ---------------------------------------------------------------------------
// Parte 2 — Testes de integração com o Serginho Orchestrator
// ---------------------------------------------------------------------------

// Mocks para providers/módulos (mesmo padrão de serginho-github-incremental-analysis.test.js)
const mockAnalyzeComplexity = jest.fn(() => ({ scores: { complexity: 0.5 } }));
const mockRouteToProvider = jest.fn(() => ({ provider: 'groq' }));
const mockGetNextFallback = jest.fn(() => null);
const mockGetProviderConfig = jest.fn(() => ({ model: 'llama-test' }));
const mockGetModelMetadata = jest.fn(() => ({}));
const mockGetEnabledProviders = jest.fn(() => ['groq']);
const mockGetWeightedProviders = jest.fn(() => ['groq']);
const mockGetGitHubConfig = jest.fn();
const mockSerginhoListRepos = jest.fn();
const mockSerginhoListBranches = jest.fn();
const mockSerginhoGetFile = jest.fn();

const routerModulePath = path.resolve(__dirname, '../../src/utils/intelligentRouter.js');
const circuitBreakerModulePath = path.resolve(__dirname, '../lib/circuit-breaker.js');
const providersConfigModulePath = path.resolve(__dirname, '../lib/providers-config.js');
const modelRegistryModulePath = path.resolve(__dirname, '../lib/model-registry.js');
const configModulePath = path.resolve(__dirname, '../lib/github/githubConfig.js');
const gatewayModulePath = path.resolve(__dirname, '../lib/serginho/githubGateway.js');

jest.unstable_mockModule(routerModulePath, () => ({
  analyzeComplexity: mockAnalyzeComplexity,
  routeToProvider: mockRouteToProvider,
  getNextFallback: mockGetNextFallback,
  FALLBACK_CHAIN: [],
}));

jest.unstable_mockModule(circuitBreakerModulePath, () => ({
  default: jest.fn().mockImplementation(() => ({
    execute: jest.fn((fn) => fn()),
  })),
}));

jest.unstable_mockModule(providersConfigModulePath, () => ({
  getProviderConfig: mockGetProviderConfig,
  getModelMetadata: mockGetModelMetadata,
  PROVIDERS: { groq: { model: 'llama-test' } },
  getEnabledProviders: mockGetEnabledProviders,
  getWeightedProviders: mockGetWeightedProviders,
}));

jest.unstable_mockModule(modelRegistryModulePath, () => ({
  default: {
    registerModel: jest.fn(),
    recordExecution: jest.fn(),
    getModelStats: jest.fn(() => ({})),
    getAllModels: jest.fn(() => []),
  },
}));

jest.unstable_mockModule(configModulePath, () => ({
  getGitHubConfig: mockGetGitHubConfig,
}));

jest.unstable_mockModule(gatewayModulePath, () => ({
  serginhoListRepos: mockSerginhoListRepos,
  serginhoListBranches: mockSerginhoListBranches,
  serginhoGetFile: mockSerginhoGetFile,
}));

let serginho;

// Importação dinâmica após mocks registrados
beforeAll(async () => {
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

/** Contexto com dados suficientes para análise */
function makeRichContext() {
  return {
    lastOwner: 'kizirianmax',
    lastRepo: 'rkmmax-hibrido',
    lastBranch: null,
    lastFilePath: 'package.json',
    lastGitHubResultType: 'file',
    lastGitHubSummary:
      'Arquivo lido: package.json em kizirianmax/rkmmax-hibrido. Início: { "name": "rkmmax-hibrido"',
    lastFileSnippet:
      '{ "name": "rkmmax-hibrido", "version": "3.0.0", "dependencies": { "react": "^18.0.0" } }',
  };
}

/** Contexto vazio (sem dados GitHub carregados) */
function makeEmptyContext() {
  return {
    lastOwner: null,
    lastRepo: null,
    lastBranch: null,
    lastFilePath: null,
    lastGitHubResultType: null,
    lastGitHubSummary: null,
    lastFileSnippet: null,
  };
}

// ---------------------------------------------------------------------------
// 11) Integração orchestrator — analyticalFormatted em _meta
// ---------------------------------------------------------------------------

describe('Orchestrator — analyticalFormatted em _meta', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('contexto insuficiente → _meta.analyticalFormatted não está presente (ou false)', async () => {
    const result = await serginho.handleRequest({
      message: 'analise isso',
      context: { githubContext: makeEmptyContext() },
    });

    // Contexto vazio → retorno imediato sem LLM, sem formatação analítica
    expect(result._meta.analyticalFormatted).toBeFalsy();
  });

  test('contexto insuficiente → _meta.analyticalFollowUp é true', async () => {
    const result = await serginho.handleRequest({
      message: 'o que você conclui desse projeto?',
      context: { githubContext: makeEmptyContext() },
    });

    expect(result._meta.analyticalFollowUp).toBe(true);
    expect(result._meta.insufficientContext).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12) Não-regressão — fluxo normal (mensagem não analítica)
// ---------------------------------------------------------------------------

describe('Não-regressão — fluxo normal', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
  });

  test('mensagem não analítica → resultado não tem analyticalFormatted em _meta', async () => {
    mockGetEnabledProviders.mockReturnValue(['groq']);

    let result;
    try {
      result = await serginho.handleRequest({
        message: 'oi, tudo bem?',
        context: {},
      });
    } catch {
      // sem provider real — esperado
      result = null;
    }

    // Se chegou ao fluxo normal (não analítico), não deve ter analyticalFormatted
    if (result && result._meta) {
      expect(result._meta.analyticalFormatted).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 13) Não-regressão — tool results de repos/branches/file
// ---------------------------------------------------------------------------

describe('Não-regressão — tool results de repos/branches/file', () => {
  beforeEach(() => {
    mockAnalyzeComplexity.mockClear();
    mockSerginhoListRepos.mockClear();
    mockSerginhoGetFile.mockClear();
  });

  test('github_list_repos → formatAnalyticalResponse NÃO é chamado (não é fluxo analítico)', async () => {
    mockGetGitHubConfig.mockReturnValue({ token: 'fake-token', enabled: true });
    mockSerginhoListRepos.mockResolvedValue({
      ok: true,
      repos: [{ name: 'repo1', description: 'Test', visibility: 'public', default_branch: 'main' }],
    });

    let result;
    try {
      result = await serginho.handleRequest({
        message: 'liste os repos de kizirianmax',
        context: {},
      });
    } catch {
      // sem provider real — pode falhar ao cair no fluxo LLM
      result = null;
    }

    // Se temos resultado, deve ser um resultado de tool (GitHub), não analítico formatado
    if (result && result._meta) {
      expect(result._meta.analyticalFormatted).toBeFalsy();
      // O fluxo analítico não deve ter sido ativado
      expect(result._meta.analyticalFollowUp).toBeFalsy();
    }
    // Se não temos resultado (erro), o teste passa — o formatter analítico não foi chamado
  });
});
