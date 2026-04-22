/**
 * Testes de validação estática dos prompts do sistema RKMMAX
 *
 * Verificam:
 * 1. Contenção de domínio mais forte do que antes (sem chamada real ao LLM)
 * 2. Suffix de especialistas verifica recusa em vez de incentivar "agregar valor"
 * 3. serginho e hybrid não foram alterados em comportamento de roteamento
 * 4. O prompt final gerado para um especialista como Code tenderia a recusar
 *    uma pergunta fora do domínio ("proposta comercial para captar investidores")
 * 5. HYBRID_GENIUS_PROMPT v3.2 contém os 4 blocos estruturais corretos
 * 6. HYBRID_SELF_REFLECTION_SUFFIX mantém verificações de qualidade
 */

import {
  SPECIALIST_GENIUS_PROMPT,
  SPECIALIST_SELF_REFLECTION_SUFFIX,
  SELF_REFLECTION_SUFFIX,
  HYBRID_SELF_REFLECTION_SUFFIX,
  HYBRID_GENIUS_PROMPT,
  FEW_SHOT_EXAMPLES,
  buildGeniusPrompt,
} from '../geniusPrompts.js';

import { getWebPresetBlock } from '../premiumWebPresets.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CODE_SPECIALIST = {
  name: 'Code',
  description: 'Especialista em programação, desenvolvimento e engenharia de software',
  category: 'tech',
  systemPrompt: 'Você é especialista em código. Responda apenas questões de desenvolvimento.',
};

// Prompt final gerado para o especialista Code
const codePromptFull = buildGeniusPrompt('specialist', {
  name: CODE_SPECIALIST.name,
  description: CODE_SPECIALIST.description,
  category: CODE_SPECIALIST.category,
  systemPrompt: CODE_SPECIALIST.systemPrompt,
});

// ─── Bloco 1: contenção de domínio no SPECIALIST_GENIUS_PROMPT ───────────────

describe('SPECIALIST_GENIUS_PROMPT — contenção de domínio', () => {
  let prompt;

  beforeAll(() => {
    prompt = SPECIALIST_GENIUS_PROMPT(
      CODE_SPECIALIST.name,
      CODE_SPECIALIST.description,
      CODE_SPECIALIST.category,
      CODE_SPECIALIST.systemPrompt
    );
  });

  it('contém bloco POLÍTICA DE CONTENÇÃO DE DOMÍNIO — INVIOLÁVEL', () => {
    expect(prompt).toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO — INVIOLÁVEL');
  });

  it('contém diretiva PROIBIDO com lista de vedações explícitas', () => {
    expect(prompt).toContain('PROIBIDO — você NUNCA deve:');
  });

  it('proíbe responder fora do domínio mesmo parcialmente', () => {
    expect(prompt).toContain('nem parcialmente');
  });

  it('proíbe agir como assistente generalista', () => {
    expect(prompt).toContain('assistente generalista');
  });

  it('proíbe escrever propostas comerciais explicitamente', () => {
    expect(prompt).toContain('propostas comerciais');
  });

  it('instrui parar imediatamente quando fora do domínio', () => {
    expect(prompt).toContain('PARAR imediatamente');
  });

  it('inclui mensagem padrão de recusa com emoji 🚫', () => {
    expect(prompt).toContain('🚫 Esta solicitação está fora da minha especialidade como Code');
  });

  it('instrui a redirecionar ao Serginho', () => {
    expect(prompt).toContain('Serginho');
  });

  it('inclui exemplo de pergunta fora do domínio que deve ser recusada (few-shot)', () => {
    expect(prompt).toContain('proposta comercial para captar investidores');
  });

  it('contém seção ESCOPO DO ESPECIALISTA separada com o systemPrompt individual', () => {
    expect(prompt).toContain('ESCOPO DO ESPECIALISTA');
    expect(prompt).toContain(CODE_SPECIALIST.systemPrompt);
  });

  it('posiciona o bloco de contenção ANTES do systemPrompt individual', () => {
    const containmentIdx = prompt.indexOf('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
    const scopeIdx = prompt.indexOf(CODE_SPECIALIST.systemPrompt);
    expect(containmentIdx).toBeLessThan(scopeIdx);
  });
});

// ─── Bloco 2: suffix de especialistas verifica domínio em vez de incentivar valor ──

describe('SPECIALIST_SELF_REFLECTION_SUFFIX — verificação de domínio', () => {
  it('verifica se a pergunta estava dentro do domínio', () => {
    expect(SPECIALIST_SELF_REFLECTION_SUFFIX).toContain(
      'A pergunta estava dentro do meu domínio de especialidade?'
    );
  });

  it('instrui a descartar respostas parciais fora do escopo', () => {
    expect(SPECIALIST_SELF_REFLECTION_SUFFIX).toContain('DESCARTE');
  });

  it('NÃO contém "Agregou valor real" — que incentivava respostas fora do escopo', () => {
    expect(SPECIALIST_SELF_REFLECTION_SUFFIX).not.toContain('Agregou valor real');
  });

  it('o suffix genérico ainda contém "Agregou valor real" para Serginho e Hybrid', () => {
    expect(SELF_REFLECTION_SUFFIX).toContain('Agregou valor real');
  });
});

// ─── Bloco 2b: SERGINHO_GENIUS_PROMPT — camada de tom e personalidade ─────────

describe('SERGINHO_GENIUS_PROMPT — tom e personalidade', () => {
  let serginhoPrompt;

  beforeAll(() => {
    serginhoPrompt = buildGeniusPrompt('serginho');
  });

  it('contém bloco TOM E PERSONALIDADE', () => {
    expect(serginhoPrompt).toContain('TOM E PERSONALIDADE:');
  });

  it('instrui ser acessível e humano — nunca robótico', () => {
    expect(serginhoPrompt).toContain('nunca robótico');
  });

  it('instrui adaptar formalidade ao tom do usuário', () => {
    expect(serginhoPrompt).toContain('Adapte a formalidade ao tom do usuário');
  });

  it('instrui evitar cara de template', () => {
    expect(serginhoPrompt).toContain('Evite cara de template');
  });

  it('instrui português brasileiro nativo com naturalidade', () => {
    expect(serginhoPrompt).toContain('português brasileiro nativo');
  });

  it('bloco TOM E PERSONALIDADE aparece antes das regras de execução', () => {
    const tomIdx = serginhoPrompt.indexOf('TOM E PERSONALIDADE:');
    const regrasIdx = serginhoPrompt.indexOf('REGRA CRÍTICA - EXECUÇÃO DE TAREFAS');
    expect(tomIdx).toBeLessThan(regrasIdx);
  });

  it('bloco TOM E PERSONALIDADE NÃO está nos prompts de especialistas', () => {
    const specialistPrompt = buildGeniusPrompt('specialist', {
      name: 'Code',
      description: 'Especialista em código',
      category: 'tech',
      systemPrompt: 'Responda apenas questões de desenvolvimento.',
    });
    expect(specialistPrompt).not.toContain('TOM E PERSONALIDADE:');
  });
});

// ─── Bloco 2c: SERGINHO_GENIUS_PROMPT — comportamento proativo e especialidades ──

describe('SERGINHO_GENIUS_PROMPT — comportamento proativo e especialidades', () => {
  let serginhoPrompt;

  beforeAll(() => {
    serginhoPrompt = buildGeniusPrompt('serginho');
  });

  it('contém bloco COMPORTAMENTO PROATIVO', () => {
    expect(serginhoPrompt).toContain('COMPORTAMENTO PROATIVO:');
  });

  it('instrui buscar contexto completo antes de responder', () => {
    expect(serginhoPrompt).toContain('Busca entender o contexto completo antes de responder');
  });

  it('instrui ser proativo em sugerir soluções e próximos passos', () => {
    expect(serginhoPrompt).toContain('É proativo em sugerir soluções e próximos passos');
  });

  it('contém bloco ESPECIALIDADES DO GENERALISTA', () => {
    expect(serginhoPrompt).toContain('ESPECIALIDADES DO GENERALISTA:');
  });

  it('lista programação e desenvolvimento de software como especialidade', () => {
    expect(serginhoPrompt).toContain('Programação e desenvolvimento de software');
  });

  it('COMPORTAMENTO PROATIVO NÃO está nos prompts de especialistas', () => {
    const specialistPrompt = buildGeniusPrompt('specialist', {
      name: 'Code',
      description: 'Especialista em código',
      category: 'tech',
      systemPrompt: 'Responda apenas questões de desenvolvimento.',
    });
    expect(specialistPrompt).not.toContain('COMPORTAMENTO PROATIVO:');
    expect(specialistPrompt).not.toContain('ESPECIALIDADES DO GENERALISTA:');
  });

  it('COMPORTAMENTO PROATIVO NÃO está no prompt hybrid', () => {
    const hybridPrompt = buildGeniusPrompt('hybrid');
    expect(hybridPrompt).not.toContain('COMPORTAMENTO PROATIVO:');
    expect(hybridPrompt).not.toContain('ESPECIALIDADES DO GENERALISTA:');
  });
});

// ─── Bloco 3: buildGeniusPrompt — serginho e hybrid roteamento correto ───────

describe('buildGeniusPrompt — serginho e hybrid roteamento correto', () => {
  it('serginho usa SELF_REFLECTION_SUFFIX genérico (com "Agregou valor real")', () => {
    const serginhoPrompt = buildGeniusPrompt('serginho');
    expect(serginhoPrompt).toContain('Agregou valor real');
    expect(serginhoPrompt).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });

  it('hybrid usa HYBRID_SELF_REFLECTION_SUFFIX dedicado (com "Agregou valor real")', () => {
    const hybridPrompt = buildGeniusPrompt('hybrid');
    expect(hybridPrompt).toContain('Agregou valor real');
    expect(hybridPrompt).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });

  it('type desconhecido cai em serginho sem bloco de contenção de especialista', () => {
    const fallbackPrompt = buildGeniusPrompt('unknown');
    expect(fallbackPrompt).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
    expect(fallbackPrompt).toContain('SERGINHO');
  });
});

// ─── Bloco 4: prompt final do especialista Code — cenário proposta comercial ──

describe('Prompt final do especialista Code — tendência de recusa para proposta comercial', () => {
  it('contém todos os gatilhos que fariam o LLM recusar "proposta comercial"', () => {
    const signals = [
      'POLÍTICA DE CONTENÇÃO DE DOMÍNIO — INVIOLÁVEL',
      'PROIBIDO — você NUNCA deve:',
      'propostas comerciais',
      'PARAR imediatamente',
      '🚫 Esta solicitação está fora da minha especialidade como Code',
      'proposta comercial para captar investidores',
      'A pergunta estava dentro do meu domínio de especialidade?',
      'DESCARTE e use apenas a mensagem de recusa',
    ];
    for (const signal of signals) {
      expect(codePromptFull).toContain(signal);
    }
  });

  it('o prompt NÃO contém a frase fraca original "Respeite estritamente o escopo acima"', () => {
    expect(codePromptFull).not.toContain('Respeite estritamente o escopo acima');
  });

  it('o prompt NÃO usa apenas a categoria genérica como fronteira (e.g. apenas "tech")', () => {
    expect(codePromptFull).toContain('Code');
    expect(codePromptFull).toContain(CODE_SPECIALIST.description);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID_GENIUS_PROMPT v3.2 — validação dos 4 blocos estruturais
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Bloco 5: HYBRID_GENIUS_PROMPT v3.2 — identidade do Construtor ──────────

describe('HYBRID_GENIUS_PROMPT v3.2 — identidade do Construtor', () => {
  it('declara ser o CONSTRUTOR do RKMMAX', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('CONSTRUTOR');
    expect(HYBRID_GENIUS_PROMPT).toContain('RKMMAX');
  });

  it('declara que cria artefatos digitais', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('artefatos digitais');
  });

  it('lista tipos de artefato: código, docs, diagramas, JSON', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('código');
    expect(HYBRID_GENIUS_PROMPT).toContain('docs');
    expect(HYBRID_GENIUS_PROMPT).toContain('diagramas');
    expect(HYBRID_GENIUS_PROMPT).toContain('JSON');
  });

  it('contém bloco IDENTIDADE', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('IDENTIDADE:');
  });

  it('proíbe mencionar Serginho', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Nunca mencione "Serginho"');
  });

  it('proíbe mencionar especialistas', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('"especialistas"');
  });

  it('proíbe mencionar qualquer outro motor', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('qualquer outro motor');
  });

  it('proíbe agir como assistente de bate-papo genérico', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('bate-papo genérico');
  });

  it('instrui focar em construção', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('foque em construção');
  });
});

// ─── Bloco 6: HYBRID_GENIUS_PROMPT v3.2 — classificação de intenção ─────────

describe('HYBRID_GENIUS_PROMPT v3.2 — classificação de intenção', () => {
  it('contém bloco CLASSIFICAÇÃO DE INTENÇÃO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('CLASSIFICAÇÃO DE INTENÇÃO');
  });

  it('instrui não revelar classificação ao usuário', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('não revele');
  });

  it('define nível TRIVIAL com critérios corretos', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('TRIVIAL');
    expect(HYBRID_GENIUS_PROMPT).toContain('saudações');
    expect(HYBRID_GENIUS_PROMPT).toContain('cortesias');
    expect(HYBRID_GENIUS_PROMPT).toContain('< 15 chars');
  });

  it('define nível AMBIGUOUS com critérios corretos', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('AMBIGUOUS');
    expect(HYBRID_GENIUS_PROMPT).toContain('substantivo de artefato');
    expect(HYBRID_GENIUS_PROMPT).toContain('sem verbo de construção');
  });

  it('define nível BUILD com critérios corretos', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('BUILD');
    expect(HYBRID_GENIUS_PROMPT).toContain('verbo de construção');
    expect(HYBRID_GENIUS_PROMPT).toContain('> 80 chars');
  });

  it('CLASSIFICAÇÃO DE INTENÇÃO aparece DEPOIS de IDENTIDADE', () => {
    const identidadeIdx = HYBRID_GENIUS_PROMPT.indexOf('IDENTIDADE:');
    const classificacaoIdx = HYBRID_GENIUS_PROMPT.indexOf('CLASSIFICAÇÃO DE INTENÇÃO');
    expect(identidadeIdx).toBeGreaterThan(-1);
    expect(classificacaoIdx).toBeGreaterThan(identidadeIdx);
  });
});

// ─── Bloco 7: HYBRID_GENIUS_PROMPT v3.2 — comportamento por nível ───────────

describe('HYBRID_GENIUS_PROMPT v3.2 — comportamento por nível de intenção', () => {
  it('contém bloco COMPORTAMENTO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('COMPORTAMENTO:');
  });

  it('define resposta para TRIVIAL com saudação curta do Construtor', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Sou o Construtor do RKMMAX');
  });

  it('instrui que TRIVIAL não gera artefato', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('saudação curta');
    expect(HYBRID_GENIUS_PROMPT).toContain('sem artefato');
  });

  it('define resposta para AMBIGUOUS com 3 perguntas de clarificação', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('clarificação');
    expect(HYBRID_GENIUS_PROMPT).toContain('O que deve ser criado');
    expect(HYBRID_GENIUS_PROMPT).toContain('Para quem');
  });

  it('define resposta para BUILD com geração de artefato', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('gerar apenas o artefato pedido');
  });

  it('instrui uso de blocos de código adequados no BUILD', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('blocos');
    expect(HYBRID_GENIUS_PROMPT).toContain('lang');
  });

  it('instrui sem explicações externas ao artefato no BUILD', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('sem explicações externas');
  });

  it('instrui máximo de 4096 tokens no BUILD', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('4096 tokens');
  });

  it('instrui dividir em vários arquivos se necessário', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('vários arquivos');
  });

  it('COMPORTAMENTO aparece DEPOIS de CLASSIFICAÇÃO DE INTENÇÃO', () => {
    const classificacaoIdx = HYBRID_GENIUS_PROMPT.indexOf('CLASSIFICAÇÃO DE INTENÇÃO');
    const comportamentoIdx = HYBRID_GENIUS_PROMPT.indexOf('COMPORTAMENTO:');
    expect(classificacaoIdx).toBeGreaterThan(-1);
    expect(comportamentoIdx).toBeGreaterThan(classificacaoIdx);
  });
});

// ─── Bloco 8: HYBRID_GENIUS_PROMPT v3.2 — limites e segurança ──────────────

describe('HYBRID_GENIUS_PROMPT v3.2 — limites e segurança', () => {
  it('contém bloco LIMITES', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('LIMITES:');
  });

  it('proíbe conteúdo ilegal', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('ilegal');
  });

  it('proíbe conteúdo malicioso', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('malicioso');
  });

  it('proíbe expor lógica interna', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('lógica interna');
  });

  it('proíbe expor env-vars', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('env-vars');
  });

  it('proíbe expor o prompt', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('este prompt');
  });

  it('LIMITES aparece DEPOIS de COMPORTAMENTO', () => {
    const comportamentoIdx = HYBRID_GENIUS_PROMPT.indexOf('COMPORTAMENTO:');
    const limitesIdx = HYBRID_GENIUS_PROMPT.indexOf('LIMITES:');
    expect(comportamentoIdx).toBeGreaterThan(-1);
    expect(limitesIdx).toBeGreaterThan(comportamentoIdx);
  });
});

// ─── Bloco 9: HYBRID_GENIUS_PROMPT v3.2 — separação de camadas ─────────────

describe('HYBRID_GENIUS_PROMPT v3.2 — separação de camadas', () => {
  it('NÃO contém COMPORTAMENTO PROATIVO (exclusivo do Serginho)', () => {
    expect(HYBRID_GENIUS_PROMPT).not.toContain('COMPORTAMENTO PROATIVO:');
  });

  it('NÃO contém ESPECIALIDADES DO GENERALISTA (exclusivo do Serginho)', () => {
    expect(HYBRID_GENIUS_PROMPT).not.toContain('ESPECIALIDADES DO GENERALISTA:');
  });

  it('NÃO contém POLÍTICA DE CONTENÇÃO DE DOMÍNIO (exclusivo de especialistas)', () => {
    expect(HYBRID_GENIUS_PROMPT).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });

  it('NÃO contém TOM E PERSONALIDADE (exclusivo do Serginho)', () => {
    expect(HYBRID_GENIUS_PROMPT).not.toContain('TOM E PERSONALIDADE:');
  });

  it('instrui responder em Português Brasileiro', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Português Brasileiro');
  });

  it('instrui entregar, não descrever', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Entregue');
    expect(HYBRID_GENIUS_PROMPT).toContain('Não descreva');
  });
});

// ─── Bloco 10: buildGeniusPrompt("hybrid") — prompt completo v3.2 ──────────

describe('buildGeniusPrompt("hybrid") — prompt completo v3.2', () => {
  let hybridPrompt;

  beforeAll(() => {
    hybridPrompt = buildGeniusPrompt('hybrid');
  });

  it('inclui HYBRID_GENIUS_PROMPT com CONSTRUTOR', () => {
    expect(hybridPrompt).toContain('CONSTRUTOR');
  });

  it('inclui HYBRID_SELF_REFLECTION_SUFFIX com "Agregou valor real"', () => {
    expect(hybridPrompt).toContain('Agregou valor real');
  });

  it('NÃO contém POLÍTICA DE CONTENÇÃO DE DOMÍNIO (exclusivo de especialistas)', () => {
    expect(hybridPrompt).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });

  it('NÃO contém bloco de presets premium (PRESETS PREMIUM PARA ARTEFATOS WEB)', () => {
    expect(hybridPrompt).not.toContain('PRESETS PREMIUM PARA ARTEFATOS WEB');
  });

  it('NÃO contém instrução de seleção de paleta baseada no contexto', () => {
    expect(hybridPrompt).not.toContain('Analise o pedido e selecione a paleta');
  });

  it('NÃO contém as 4 paletas de design por nome', () => {
    expect(hybridPrompt).not.toContain('Midnight Pro');
    expect(hybridPrompt).not.toContain('Sunrise Warm');
    expect(hybridPrompt).not.toContain('Ocean Corporate');
    expect(hybridPrompt).not.toContain('Nature Fresh');
  });

  it('NÃO contém instrução sobre paleta roxa', () => {
    expect(hybridPrompt).not.toContain('NÃO use sempre a mesma paleta roxa');
  });

  it('NÃO contém estruturas por tipo de página do bloco premium (landing, institucional, startup)', () => {
    expect(hybridPrompt).not.toContain('Landing Page Premium');
    expect(hybridPrompt).not.toContain('Página Institucional de Produto');
    expect(hybridPrompt).not.toContain('Apresentação de Startup');
  });

  it('NÃO contém blocos CSS com backdrop-filter (glass morphism)', () => {
    expect(hybridPrompt).not.toContain('backdrop-filter');
  });

  it('NÃO contém few-shot original de webArtifact (landing page produtividade) no prompt', () => {
    // O few-shot existe como export separado, mas não é injetado no prompt
    expect(hybridPrompt).not.toContain('FocusFlow');
  });

  it('NÃO contém few-shot adicional de página institucional', () => {
    expect(hybridPrompt).not.toContain('FEW-SHOT: PÁGINA INSTITUCIONAL DE PRODUTO');
    expect(hybridPrompt).not.toContain('DataStream');
  });

  it('NÃO contém few-shot adicional de apresentação de startup', () => {
    expect(hybridPrompt).not.toContain('FEW-SHOT: APRESENTAÇÃO DE STARTUP');
    expect(hybridPrompt).not.toContain('GreenRoute');
  });
});

// ─── Bloco 11: buildGeniusPrompt('serginho') e ('specialist') NÃO foram alterados ──

describe("buildGeniusPrompt('serginho') — NÃO alterado pelos presets", () => {
  let serginhoPrompt;

  beforeAll(() => {
    serginhoPrompt = buildGeniusPrompt('serginho');
  });

  it('NÃO contém bloco de presets premium', () => {
    expect(serginhoPrompt).not.toContain('PRESETS PREMIUM PARA ARTEFATOS WEB');
  });

  it('NÃO contém few-shot de DataStream (página institucional)', () => {
    expect(serginhoPrompt).not.toContain('DataStream');
  });

  it('NÃO contém few-shot de GreenRoute (startup)', () => {
    expect(serginhoPrompt).not.toContain('GreenRoute');
  });

  it('ainda contém SERGINHO e SELF_REFLECTION_SUFFIX inalterados', () => {
    expect(serginhoPrompt).toContain('SERGINHO');
    expect(serginhoPrompt).toContain('Agregou valor real');
  });
});

describe("buildGeniusPrompt('specialist') — NÃO alterado pelos presets", () => {
  let specialistPrompt;

  beforeAll(() => {
    specialistPrompt = buildGeniusPrompt('specialist', {
      name: 'Code',
      description: 'Especialista em programação',
      category: 'tech',
      systemPrompt: 'Responda apenas questões de desenvolvimento.',
    });
  });

  it('NÃO contém bloco de presets premium', () => {
    expect(specialistPrompt).not.toContain('PRESETS PREMIUM PARA ARTEFATOS WEB');
  });

  it('NÃO contém few-shot de DataStream', () => {
    expect(specialistPrompt).not.toContain('DataStream');
  });

  it('ainda contém POLÍTICA DE CONTENÇÃO DE DOMÍNIO', () => {
    expect(specialistPrompt).toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO — INVIOLÁVEL');
  });
});

// ─── Bloco 12: FEW_SHOT_EXAMPLES — exemplo de artefato web ─────────────────

describe('FEW_SHOT_EXAMPLES — exemplo de artefato web (webArtifact)', () => {
  it('contém chave webArtifact', () => {
    expect(FEW_SHOT_EXAMPLES).toHaveProperty('webArtifact');
  });

  it('webArtifact contém exemplo de resposta FRACA com divs genéricas', () => {
    expect(FEW_SHOT_EXAMPLES.webArtifact).toContain('FRACA');
    expect(FEW_SHOT_EXAMPLES.webArtifact).toContain('Bem-vindo');
  });

  it('webArtifact contém exemplo de resposta FORTE com HTML semântico e design system', () => {
    expect(FEW_SHOT_EXAMPLES.webArtifact).toContain('FORTE');
    expect(FEW_SHOT_EXAMPLES.webArtifact).toContain('--color-primary');
    expect(FEW_SHOT_EXAMPLES.webArtifact).toContain('Intersection Observer');
  });

  it('webArtifact demonstra copy magnética no exemplo forte', () => {
    expect(FEW_SHOT_EXAMPLES.webArtifact).toContain('Pare de gerenciar');
  });

  it('FEW_SHOT_EXAMPLES.webArtifact existe como objeto exportado (disponível para uso sob demanda)', () => {
    expect(FEW_SHOT_EXAMPLES.webArtifact).toBeTruthy();
    expect(typeof FEW_SHOT_EXAMPLES.webArtifact).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID_SELF_REFLECTION_SUFFIX — verificações de qualidade (inalterado)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Bloco 13: HYBRID_SELF_REFLECTION_SUFFIX — qualidade técnica web ────────

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificações de qualidade web', () => {
  it('verifica uso de tags semânticas no HTML', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('<header>');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('<section>');
  });

  it('verifica CSS custom properties (design system)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('CSS custom properties');
  });

  it('verifica responsividade com @media breakpoints', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('mobile-first');
  });

  it('verifica headline magnética e CTAs com verbos de ação', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('headline');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('Começar agora');
  });

  it('verifica estrutura mínima de 5 seções para landing page', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('5 seções');
  });

  it('verifica interatividade real com JS (smooth scroll, Intersection Observer)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('smooth scroll');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('Intersection Observer');
  });

  it('verifica se resultado parece profissional (não rascunho)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('projeto profissional');
  });

  it('mantém verificação de valor real (Agregou valor real)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('Agregou valor real');
  });

  it('NÃO contém "POLÍTICA DE CONTENÇÃO DE DOMÍNIO" (é exclusivo de especialistas)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });
});

// ─── Bloco 14: HYBRID_SELF_REFLECTION_SUFFIX — verificação anti-genérico ────

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação anti-genérico', () => {
  it('contém bloco QUALIDADE DE CONTEÚDO', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('QUALIDADE DE CONTEÚDO');
  });

  it('verifica genericidade da headline (teste da troca de marca)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('qualquer outro produto');
  });

  it('verifica repetição de estrutura gramatical nos cartões', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('estrutura gramatical idêntica');
  });

  it('verifica CTAs com verbo genérico vs verbo de resultado', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('verbo de resultado');
  });

  it('verifica dominância de paleta roxa', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('roxo/violeta');
  });
});

// ─── Bloco 15: HYBRID_SELF_REFLECTION_SUFFIX — dark mode e OBSERVAÇÕES ──────

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação dos desvios de qualidade', () => {
  it('verifica dark mode: --color-bg escuro quando solicitado', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('sinal de dark mode');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('--color-bg é escuro');
  });

  it('proíbe #fff e #f0f0f0 como fundo em dark mode', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('#fff ou #f0f0f0 como fundo dominante');
  });

  it('instrui remover OBSERVAÇÕES com frases burocráticas', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('frase burocrática vazia');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('Nenhuma observação necessária');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('REMOVA a seção inteiramente');
  });

  it('instrui reescrever hero intercambiável com especificidade do pedido', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('headline intercambiável');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('especificidade do pedido antes de entregar');
  });

  it('instrui ELIMINAR OBSERVAÇÕES se contiver frase de confirmação vazia', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('ELIMINE a seção inteira AGORA');
  });

  it('verifica CTA do hero contra blacklist explícita', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('CTA do hero');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('Veja mais');
  });

  it('verifica se headline incorpora elemento concreto do pedido', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('tipo de artefato, diferencial, resultado, público');
  });

  it('verifica OBSERVAÇÕES sem justificativa concreta', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('REMOVA a seção INTEIRA da resposta AGORA');
  });
});

// ─── Bloco 16: HYBRID_SELF_REFLECTION_SUFFIX — qualidade visual ─────────────

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação de qualidade visual', () => {
  it('contém bloco QUALIDADE VISUAL', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('QUALIDADE VISUAL');
  });

  it('verifica hierarquia tipográfica h1/h2/h3', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('hierarquia tipográfica');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('h1 notavelmente maior');
  });

  it('verifica min-height e padding adequados do hero', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('min-height suficiente');
  });

  it('verifica espaçamento mínimo entre seções', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('mínimo 5rem');
  });

  it('verifica hover com transform e box-shadow nos cards', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('hover com transform e box-shadow');
  });

  it('verifica profundidade em dark mode (camadas de cor)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('camadas distintas');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('chapado');
  });

  it('verifica peso visual do CTA primário', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('CTA primário é visualmente mais chamativo');
  });
});

// ─── Bloco 17: HYBRID_SELF_REFLECTION_SUFFIX — completude e formato ─────────

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação de completude e formato', () => {
  it('contém bloco de verificação de COMPLETUDE E FECHAMENTO', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('COMPLETUDE E FECHAMENTO');
  });

  it('verifica se todas as seções anunciadas estão presentes', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('seções anunciadas no ENTENDIMENTO');
  });

  it('verifica fechamento adequado com riscos, prioridades e conclusão', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('fechamento adequado');
  });

  it('verifica se alguma seção foi cortada no meio', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('cortada no meio');
  });

  it('instrui comprimir seções intermediárias se artefato ficou extenso', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('comprima seções intermediárias');
  });

  it('contém bloco de verificação FORMATO MULTI-FILE', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('FORMATO MULTI-FILE');
  });

  it('verifica uso de delimitadores --- FILE: ---', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('--- FILE: nome.ext ---');
  });

  it('detecta uso incorreto de #### como cabeçalho de arquivo', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('#### ou ###');
  });

  it('instrui remover header ### ARTEFATO quando multi-file', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('### ARTEFATO');
  });

  it('verifica formato obrigatório (ENTENDIMENTO → ARTEFATO → RESUMO)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('formato obrigatório');
  });

  it('menciona as seções do formato (ENTENDIMENTO, ARTEFATO, RESUMO, OBSERVAÇÕES)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('ENTENDIMENTO');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('ARTEFATO');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('RESUMO');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('OBSERVAÇÕES');
  });
});

// ─── Bloco 18: HYBRID_SELF_REFLECTION_SUFFIX — copy premium e legibilidade ──

describe('HYBRID_SELF_REFLECTION_SUFFIX — copy premium e legibilidade', () => {
  it('verifica se headline usa palavra-chave do pedido', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('palavra-chave do pedido original');
  });

  it('verifica se subheadline traz informação nova', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('informação NOVA');
  });

  it('verifica se CTA espelha resultado da headline', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('espelha o resultado');
  });

  it('verifica densidade mínima dos cartões de benefício', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('mínimo 2 linhas');
  });

  it('verifica headline não é apenas nome do produto', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('nome do produto/marca sem proposta de valor');
  });

  it('contém bloco LEGIBILIDADE DE CÓDIGO', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('LEGIBILIDADE DE CÓDIGO');
  });

  it('verifica indentação consistente', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('indentação consistente');
  });

  it('verifica espaçamento entre funções/blocos', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('linhas em branco entre funções');
  });

  it('verifica JSON pretty-printed', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('pretty-printed');
  });

  it('verifica legibilidade do README.md', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('README.md');
  });

  it('instrui corrigir código denso antes de entregar', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('copiar/colar');
  });
});

// ─── Bloco 19: HYBRID_SELF_REFLECTION_SUFFIX — proteção para artefatos longos ─

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação de proteção para artefatos longos', () => {
  it('contém sub-bloco PROTEÇÃO PARA ARTEFATOS LONGOS na self-reflection', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('PROTEÇÃO PARA ARTEFATOS LONGOS');
  });

  it('verifica se seções intermediárias estão compactas em artefatos longos', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('seções intermediárias estão compactas');
  });

  it('verifica proporcionalidade — seção intermediária ocupando mais de 25%', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('25%');
  });

  it('verifica presença das seções finais protegidas', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('seções finais protegidas');
  });

  it('instrui adicionar fechamento mínimo se artefato termina abruptamente', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('termina abruptamente');
  });

  it('verifica se artefatos com 6+ seções têm intermediárias comprimidas', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('mais de 6 seções');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('fechamento é mais importante que detalhe uniforme');
  });

  it('verifica se as 3 últimas coisas do artefato são riscos, próximos passos e conclusão', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('riscos/atenção, próximos passos, conclusão');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('reorganize para garantir esse fechamento');
  });
});

// ─── Bloco 20: HYBRID_SELF_REFLECTION_SUFFIX — proíbe tags internas ─────────

describe('HYBRID_SELF_REFLECTION_SUFFIX — proíbe exposição de processo interno', () => {
  it('proíbe tags como <thinking>, <self-check>', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('<thinking>');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('<self-check>');
  });

  it('instrui entregar diretamente', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('Entregue diretamente');
  });
});
