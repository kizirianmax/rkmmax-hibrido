/**
 * Testes unitários para o classificador de intenção do Construtor/Híbrido.
 *
 * Valida os 3 níveis:
 *   1. TRIVIAL  — saudações, cortesias, testes → sem artefato
 *   2. AMBIGUOUS — pedido vago/incompleto → clarificação
 *   3. BUILD    — pedido concreto → pipeline do Construtor
 *
 * Extrai as funções diretamente do ai.js via regex para testar sem
 * precisar importar o módulo inteiro (que depende de env/Supabase).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Extrair funções do ai.js para teste isolado ──
const aiPath = path.resolve(__dirname, '../ai.js');
const aiContent = fs.readFileSync(aiPath, 'utf8');

// Extrair o bloco de código entre os marcadores do classificador
const classifierStart = aiContent.indexOf('// ─────────────────────────────────────────────────────────────────────────────\n// Classificador de intenção');
const classifierEnd = aiContent.indexOf('/**\n * Resolve o plano do usuário');
const classifierBlock = aiContent.slice(classifierStart, classifierEnd);

// Avaliar o bloco isoladamente para obter as funções
const fn = new Function(
  `${classifierBlock}\n` +
  `return { _classifyHybridIntent, _classifyTrivialInput, _buildTrivialResponse, _buildClarificationResponse, _normalize };`
);
const { _classifyHybridIntent, _classifyTrivialInput, _buildTrivialResponse, _buildClarificationResponse, _normalize } = fn();

// ── Testes ──

describe('Hybrid Intent Classifier — _classifyHybridIntent', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // Nível 1: TRIVIAL
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nível 1: TRIVIAL', () => {
    const trivialInputs = [
      'Oi', 'oi', 'Olá', 'olá', 'Hey', 'Hi', 'Hello',
      'Bom dia', 'Boa tarde', 'Boa noite',
      'Tudo bem', 'Tudo bem?', 'Tudo bom?',
      'E aí', 'E aí?', 'Eai',
      'Teste', 'test', 'Ok', 'Beleza', 'Beleza?',
      'Obrigado', 'Obrigada', 'Valeu', 'Vlw', 'Thanks',
      'Falou', 'Tchau', 'Bye', 'Ate mais',
      'Sim', 'Não', 'Yes', 'No',
    ];

    test.each(trivialInputs)('"%s" → trivial', (input) => {
      const result = _classifyHybridIntent(input);
      expect(result.intent).toBe('trivial');
    });

    test('"Oi Serginho" → trivial (saudação + nome)', () => {
      expect(_classifyHybridIntent('Oi Serginho').intent).toBe('trivial');
    });

    test('"Boa tarde Kizi" → trivial (saudação + nome)', () => {
      expect(_classifyHybridIntent('Boa tarde Kizi').intent).toBe('trivial');
    });

    test('"oi!" com pontuação → trivial', () => {
      expect(_classifyHybridIntent('oi!').intent).toBe('trivial');
    });

    test('mensagem muito curta sem intenção → trivial', () => {
      expect(_classifyHybridIntent('hm').intent).toBe('trivial');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Nível 2: AMBIGUOUS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nível 2: AMBIGUOUS', () => {
    const ambiguousInputs = [
      'landing page',
      'app de agenda',
      'sistema para clínica',
      'dashboard',
      'formulário de cadastro',
      'portfólio',
      'blog',
      'loja virtual',
      'e-commerce',
    ];

    test.each(ambiguousInputs)('"%s" → ambiguous (substantivo sem verbo)', (input) => {
      const result = _classifyHybridIntent(input);
      expect(result.intent).toBe('ambiguous');
    });

    test('"landing page moderna" (substantivo + qualificador curto) → ambiguous', () => {
      const result = _classifyHybridIntent('landing page moderna');
      expect(result.intent).toBe('ambiguous');
    });

    test('"dashboard com gráficos" (substantivo + qualificador curto) → ambiguous', () => {
      const result = _classifyHybridIntent('dashboard com gráficos');
      expect(result.intent).toBe('ambiguous');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Nível 3: BUILD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nível 3: BUILD', () => {
    test('verbo de construção PT-BR → build', () => {
      expect(_classifyHybridIntent('Crie um site de portfólio').intent).toBe('build');
    });

    test('verbo de construção EN → build', () => {
      expect(_classifyHybridIntent('Create a landing page for my startup').intent).toBe('build');
    });

    test('"Faça um dashboard de vendas com gráficos" → build', () => {
      expect(_classifyHybridIntent('Faça um dashboard de vendas com gráficos').intent).toBe('build');
    });

    test('"Desenvolva um sistema de login" → build', () => {
      expect(_classifyHybridIntent('Desenvolva um sistema de login').intent).toBe('build');
    });

    test('"Escreva um formulário de contato" → build', () => {
      expect(_classifyHybridIntent('Escreva um formulário de contato').intent).toBe('build');
    });

    test('verbo de construção curto → build (nunca trivial)', () => {
      expect(_classifyHybridIntent('Crie').intent).toBe('build');
    });

    test('mensagem longa com substantivo e qualificador → build', () => {
      const longInput = 'Preciso de um dashboard moderno com gráficos de vendas, filtros por data, exportação em PDF e tema escuro, responsivo para mobile';
      expect(_classifyHybridIntent(longInput).intent).toBe('build');
    });

    test('entrada sem substantivo e sem verbo mas longa → build (default)', () => {
      const input = 'Quero algo que mostre as métricas do meu negócio de forma visual e interativa';
      expect(_classifyHybridIntent(input).intent).toBe('build');
    });

    test('null/undefined → build (fallback seguro)', () => {
      expect(_classifyHybridIntent(null).intent).toBe('build');
      expect(_classifyHybridIntent(undefined).intent).toBe('build');
      expect(_classifyHybridIntent('').intent).toBe('build');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Proteções de borda
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Proteções de borda', () => {
    test('verbo de construção SEMPRE prevalece sobre trivial', () => {
      expect(_classifyHybridIntent('Crie').intent).toBe('build');
      expect(_classifyHybridIntent('Faça algo').intent).toBe('build');
    });

    test('verbo de construção SEMPRE prevalece sobre ambíguo', () => {
      expect(_classifyHybridIntent('Crie um site').intent).toBe('build');
    });

    test('saudação com verbo de construção → build', () => {
      expect(_classifyHybridIntent('Oi, crie um site').intent).toBe('build');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Compatibilidade: _classifyTrivialInput (alias)
// ═══════════════════════════════════════════════════════════════════════════

describe('_classifyTrivialInput (alias de compatibilidade)', () => {
  test('"Oi" → trivial: true', () => {
    expect(_classifyTrivialInput('Oi').trivial).toBe(true);
  });

  test('"Crie um site" → trivial: false', () => {
    expect(_classifyTrivialInput('Crie um site').trivial).toBe(false);
  });

  test('"landing page" → trivial: false (é ambíguo, não trivial)', () => {
    expect(_classifyTrivialInput('landing page').trivial).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// _buildTrivialResponse (resposta local leve do Construtor)
// ═══════════════════════════════════════════════════════════════════════════

describe('_buildTrivialResponse', () => {
  test('saudação "Oi" → resposta do Construtor (sem bypass para genius)', () => {
    const resp = _buildTrivialResponse('Oi');
    expect(resp).toContain('Construtor');
    expect(resp).toContain('construir');
    expect(resp).not.toContain('Serginho');
  });

  test('"Bom dia" → resposta com período correto', () => {
    expect(_buildTrivialResponse('Bom dia')).toMatch(/^Bom dia/);
  });

  test('"Boa tarde" → resposta com período correto', () => {
    expect(_buildTrivialResponse('Boa tarde')).toMatch(/^Boa tarde/);
  });

  test('"Boa noite" → resposta com período correto', () => {
    expect(_buildTrivialResponse('Boa noite')).toMatch(/^Boa noite/);
  });

  test('despedida "Tchau" → resposta de despedida do Construtor', () => {
    const resp = _buildTrivialResponse('Tchau');
    expect(resp).toContain('Até mais');
    expect(resp).toContain('construir');
  });

  test('agradecimento "Obrigado" → resposta de agradecimento do Construtor', () => {
    const resp = _buildTrivialResponse('Obrigado');
    expect(resp).toContain('De nada');
    expect(resp).toContain('construir');
  });

  test('entrada genérica "hm" → resposta default do Construtor', () => {
    const resp = _buildTrivialResponse('hm');
    expect(resp).toContain('Construtor');
    expect(resp).toContain('RKMMAX');
  });

  test('todas as respostas mencionam "construir" (identidade do Construtor)', () => {
    const inputs = ['Oi', 'Bom dia', 'Tchau', 'Obrigado', 'hm'];
    for (const input of inputs) {
      expect(_buildTrivialResponse(input)).toContain('construir');
    }
  });

  test('nenhuma resposta menciona "Serginho" (sem bypass entre camadas)', () => {
    const inputs = ['Oi', 'Bom dia', 'Boa tarde', 'Boa noite', 'Tchau', 'Obrigado', 'teste'];
    for (const input of inputs) {
      expect(_buildTrivialResponse(input)).not.toContain('Serginho');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// _buildClarificationResponse
// ═══════════════════════════════════════════════════════════════════════════

describe('_buildClarificationResponse', () => {
  test('retorna string com a entrada do usuário', () => {
    const resp = _buildClarificationResponse('landing page');
    expect(resp).toContain('landing page');
  });

  test('retorna perguntas de clarificação', () => {
    const resp = _buildClarificationResponse('dashboard');
    expect(resp).toContain('O que');
    expect(resp).toContain('Para quem');
  });

  test('trunca entradas longas', () => {
    const longInput = 'a'.repeat(200);
    const resp = _buildClarificationResponse(longInput);
    expect(resp).not.toContain('a'.repeat(200));
  });
});
