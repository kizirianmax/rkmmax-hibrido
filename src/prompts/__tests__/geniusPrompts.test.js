/**
 * Testes de validação estática do SPECIALIST_GENIUS_PROMPT
 *
 * Verificam:
 * 1. Contenção de domínio mais forte do que antes (sem chamada real ao LLM)
 * 2. Suffix de especialistas verifica recusa em vez de incentivar "agregar valor"
 * 3. serginho e hybrid não foram alterados em comportamento
 * 4. O prompt final gerado para um especialista como Code tenderia a recusar
 *    uma pergunta fora do domínio ("proposta comercial para captar investidores")
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

// ─── Bloco 3: buildGeniusPrompt — serginho e hybrid não foram alterados ───────

describe('buildGeniusPrompt — serginho e hybrid inalterados', () => {
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
    // Verificações cumulativas: cada uma representa uma camada de sinal para o LLM
    const signals = [
      'POLÍTICA DE CONTENÇÃO DE DOMÍNIO — INVIOLÁVEL',
      'PROIBIDO — você NUNCA deve:',
      'propostas comerciais',
      'PARAR imediatamente',
      '🚫 Esta solicitação está fora da minha especialidade como Code',
      'proposta comercial para captar investidores', // few-shot negativo explícito
      'A pergunta estava dentro do meu domínio de especialidade?',
      'DESCARTE e use apenas a mensagem de recusa',
    ];
    for (const signal of signals) {
      expect(codePromptFull).toContain(signal);
    }
  });

  it('o prompt NÃO contém a frase fraca original "Respeite estritamente o escopo acima"', () => {
    // Confirma que a frase fraca da versão anterior não está mais presente
    expect(codePromptFull).not.toContain('Respeite estritamente o escopo acima');
  });

  it('o prompt NÃO usa apenas a categoria genérica como fronteira (e.g. apenas "tech")', () => {
    // Versão antiga usava `${specialistCategory}` isolada como único marcador de escopo
    // Nova versão usa a descrição completa + nome do especialista
    expect(codePromptFull).toContain('Code'); // nome do especialista como âncora
    expect(codePromptFull).toContain(CODE_SPECIALIST.description); // descrição no bloco de identidade
  });
});

// ─── Bloco 5: HYBRID_GENIUS_PROMPT — padrão premium para artefatos web ────────

describe('HYBRID_GENIUS_PROMPT — padrão premium para artefatos web', () => {
  it('contém bloco PADRÃO PREMIUM PARA ARTEFATOS WEB', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('PADRÃO PREMIUM PARA ARTEFATOS WEB');
  });

  it('instrui uso de HTML5 semântico (<header>, <main>, <section>, <footer>)', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('<header>');
    expect(HYBRID_GENIUS_PROMPT).toContain('<main>');
    expect(HYBRID_GENIUS_PROMPT).toContain('<section>');
    expect(HYBRID_GENIUS_PROMPT).toContain('<footer>');
  });

  it('instrui CSS custom properties (variáveis de design system)', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('--color-primary');
    expect(HYBRID_GENIUS_PROMPT).toContain('CSS custom properties');
  });

  it('instrui responsividade mobile-first com @media breakpoints', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('mobile-first');
    expect(HYBRID_GENIUS_PROMPT).toContain('@media');
  });

  it('instrui JavaScript útil (smooth scroll e Intersection Observer)', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Smooth scroll');
    expect(HYBRID_GENIUS_PROMPT).toContain('Intersection Observer');
  });

  it('instrui copy premium com headline magnética e CTA com verbo de ação', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Headline magnética');
    expect(HYBRID_GENIUS_PROMPT).toContain('Começar agora');
  });

  it('define estrutura obrigatória de 6 seções para landing pages', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('ESTRUTURA OBRIGATÓRIA PARA LANDING PAGES');
    expect(HYBRID_GENIUS_PROMPT).toContain('Hero');
    expect(HYBRID_GENIUS_PROMPT).toContain('CTA final');
    expect(HYBRID_GENIUS_PROMPT).toContain('Footer');
  });

  it('contém heurística de detecção de tipo de artefato', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('HEURÍSTICA DE TIPO DE ARTEFATO');
    expect(HYBRID_GENIUS_PROMPT).toContain('landing');
    expect(HYBRID_GENIUS_PROMPT).toContain('código');
    expect(HYBRID_GENIUS_PROMPT).toContain('documento');
  });

  it('preserva a seção FACTUALIDADE intacta', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('FACTUALIDADE:');
    expect(HYBRID_GENIUS_PROMPT).toContain('O Construtor NUNCA pode inventar:');
  });

  it('preserva a seção PROIBIÇÕES intacta', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('PROIBIÇÕES:');
  });
});

// ─── Bloco 5b: HYBRID_GENIUS_PROMPT — anti-padrões de copy e critérios de densidade ──

describe('HYBRID_GENIUS_PROMPT — anti-padrões de copy e critérios de densidade', () => {
  it('contém bloco ANTI-PADRÕES DE COPY', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('ANTI-PADRÕES DE COPY');
  });

  it('lista headlines vagas como anti-padrão', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Headlines vagas');
  });

  it('lista CTAs fracos como anti-padrão', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('CTAs fracos');
  });

  it('instrui teste de genericidade (trocar nome da marca)', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('trocar o nome da marca');
  });

  it('contém bloco CRITÉRIOS DE DENSIDADE', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('CRITÉRIOS DE DENSIDADE');
  });

  it('exige hero com benefício tangível', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('benefício tangível');
  });

  it('exige variação de paleta conforme contexto', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('não usar sempre roxo');
  });

  it('exige classe .visible com opacity e transform reais no CSS', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('.visible');
  });
});

// ─── Bloco 6: HYBRID_SELF_REFLECTION_SUFFIX — verificações de qualidade web ──

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

// ─── Bloco 6b: HYBRID_SELF_REFLECTION_SUFFIX — verificação anti-genérico ─────

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

// ─── Bloco 7: FEW_SHOT_EXAMPLES — exemplo de artefato web ────────────────────

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
});

// ─── Bloco 8: buildGeniusPrompt("hybrid") — micro few-shot de qualidade; presets grandes removidos ──

describe("buildGeniusPrompt('hybrid') — micro few-shot de ancoragem presente; presets premium grandes NÃO injetados", () => {
  let hybridPrompt;

  beforeAll(() => {
    hybridPrompt = buildGeniusPrompt('hybrid');
  });

  it('inclui micro few-shot de ancoragem de qualidade (MICRO REFERÊNCIA — HERO E CTA)', () => {
    expect(hybridPrompt).toContain('MICRO REFERÊNCIA — HERO E CTA');
    expect(hybridPrompt).toContain('Hero fraco');
    expect(hybridPrompt).toContain('Hero forte');
    expect(hybridPrompt).toContain('CTA fraco');
    expect(hybridPrompt).toContain('CTA forte');
  });

  it('NÃO inclui bloco de presets premium (PRESETS PREMIUM PARA ARTEFATOS WEB)', () => {
    expect(hybridPrompt).not.toContain('PRESETS PREMIUM PARA ARTEFATOS WEB');
  });

  it('NÃO inclui instrução de seleção de paleta baseada no contexto', () => {
    expect(hybridPrompt).not.toContain('Analise o pedido e selecione a paleta');
  });

  it('NÃO inclui as 4 paletas de design por nome', () => {
    expect(hybridPrompt).not.toContain('Midnight Pro');
    expect(hybridPrompt).not.toContain('Sunrise Warm');
    expect(hybridPrompt).not.toContain('Ocean Corporate');
    expect(hybridPrompt).not.toContain('Nature Fresh');
  });

  it('NÃO inclui instrução sobre paleta roxa', () => {
    expect(hybridPrompt).not.toContain('NÃO use sempre a mesma paleta roxa');
  });

  it('NÃO inclui estruturas por tipo de página do bloco premium (landing, institucional, startup)', () => {
    expect(hybridPrompt).not.toContain('Landing Page Premium');
    expect(hybridPrompt).not.toContain('Página Institucional de Produto');
    expect(hybridPrompt).not.toContain('Apresentação de Startup');
  });

  it('NÃO inclui blocos CSS com backdrop-filter (glass morphism)', () => {
    expect(hybridPrompt).not.toContain('backdrop-filter');
  });

  it('NÃO inclui blocos JS com IntersectionObserver do preset', () => {
    expect(hybridPrompt).not.toContain('IntersectionObserver');
  });

  it('NÃO inclui blocos JS com smooth scroll do preset', () => {
    expect(hybridPrompt).not.toContain("behavior: 'smooth'");
  });

  it('NÃO inclui few-shot original de webArtifact (landing page produtividade)', () => {
    expect(hybridPrompt).not.toContain('FocusFlow');
    expect(hybridPrompt).not.toContain('Pare de gerenciar');
  });

  it('NÃO inclui few-shot adicional de página institucional', () => {
    expect(hybridPrompt).not.toContain('FEW-SHOT: PÁGINA INSTITUCIONAL DE PRODUTO');
    expect(hybridPrompt).not.toContain('DataStream');
  });

  it('NÃO inclui few-shot adicional de apresentação de startup', () => {
    expect(hybridPrompt).not.toContain('FEW-SHOT: APRESENTAÇÃO DE STARTUP');
    expect(hybridPrompt).not.toContain('GreenRoute');
  });

  it('ainda inclui HYBRID_SELF_REFLECTION_SUFFIX com "Agregou valor real"', () => {
    expect(hybridPrompt).toContain('Agregou valor real');
  });

  it('ainda inclui HYBRID_GENIUS_PROMPT com PADRÃO PREMIUM PARA ARTEFATOS WEB', () => {
    expect(hybridPrompt).toContain('PADRÃO PREMIUM PARA ARTEFATOS WEB');
  });

  it('NÃO contém POLÍTICA DE CONTENÇÃO DE DOMÍNIO (exclusivo de especialistas)', () => {
    expect(hybridPrompt).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });
});

// ─── Bloco 9: buildGeniusPrompt('serginho') e ('specialist') NÃO foram alterados ──

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

// ─── Bloco 10: webArtifact NÃO aparece no hybrid (removido por performance) ────

describe('buildGeniusPrompt("hybrid") — few-shot webArtifact removido do prompt fixo', () => {
  let hybridPrompt;

  beforeAll(() => {
    hybridPrompt = buildGeniusPrompt('hybrid');
  });

  it('NÃO inclui o few-shot webArtifact no prompt híbrido gerado', () => {
    expect(hybridPrompt).not.toContain(FEW_SHOT_EXAMPLES.webArtifact);
  });

  it('FEW_SHOT_EXAMPLES.webArtifact ainda existe como objeto exportado (disponível para uso sob demanda)', () => {
    expect(FEW_SHOT_EXAMPLES.webArtifact).toBeTruthy();
    expect(typeof FEW_SHOT_EXAMPLES.webArtifact).toBe('string');
  });

  it('exemplo FORTE do HYBRID_GENIUS_PROMPT ainda presente (HTML semântico + design system)', () => {
    expect(hybridPrompt).toContain('--color-primary');
    expect(hybridPrompt).toContain('Intersection Observer');
  });

  it('HYBRID_GENIUS_PROMPT base contém referência a Bem-vindo no contexto de exemplo', () => {
    expect(hybridPrompt).toContain('Bem-vindo');
  });
});

// ─── Bloco 11: HYBRID_GENIUS_PROMPT — structured output format ─────────────────

describe('HYBRID_GENIUS_PROMPT — structured output format', () => {
  it('contém bloco FORMATO DE RESPOSTA OBRIGATÓRIO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('FORMATO DE RESPOSTA OBRIGATÓRIO');
  });

  it('define seção ENTENDIMENTO como primeiro bloco', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('**ENTENDIMENTO**');
  });

  it('define seção ARTEFATO como bloco principal', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('**ARTEFATO**');
  });

  it('define seção RESUMO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('**RESUMO**');
  });

  it('define seção OBSERVAÇÕES como excepcional — NÃO faz parte do formato padrão', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('**OBSERVAÇÕES**');
    expect(HYBRID_GENIUS_PROMPT).toContain('OBSERVAÇÕES NÃO é uma seção do formato padrão');
    expect(HYBRID_GENIUS_PROMPT).toContain('TOTALMENTE OMITIDA');
    expect(HYBRID_GENIUS_PROMPT).toContain('Nenhuma observação necessária');
  });

  it('instrui que artefato deve ocupar 80%+ da resposta', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('80%+');
  });

  it('instrui que formato não deve virar burocracia', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('burocracia');
  });

  it('FORMATO DE RESPOSTA aparece ANTES de PROIBIÇÕES', () => {
    const formatIdx = HYBRID_GENIUS_PROMPT.indexOf('FORMATO DE RESPOSTA OBRIGATÓRIO');
    const proibIdx = HYBRID_GENIUS_PROMPT.indexOf('PROIBIÇÕES:');
    expect(formatIdx).toBeGreaterThan(-1);
    expect(proibIdx).toBeGreaterThan(-1);
    expect(formatIdx).toBeLessThan(proibIdx);
  });

  it('FORMATO DE RESPOSTA aparece DEPOIS de COMPORTAMENTO', () => {
    const compIdx = HYBRID_GENIUS_PROMPT.indexOf('COMPORTAMENTO:');
    const formatIdx = HYBRID_GENIUS_PROMPT.indexOf('FORMATO DE RESPOSTA OBRIGATÓRIO');
    expect(compIdx).toBeGreaterThan(-1);
    expect(formatIdx).toBeGreaterThan(compIdx);
  });

  it('structured output NÃO aparece no prompt do Serginho', () => {
    const serginhoPrompt = buildGeniusPrompt('serginho');
    expect(serginhoPrompt).not.toContain('FORMATO DE RESPOSTA OBRIGATÓRIO');
  });

  it('structured output NÃO aparece no prompt de especialistas', () => {
    const specialistPrompt = buildGeniusPrompt('specialist', {
      name: 'Code',
      description: 'Especialista em programação',
      category: 'tech',
      systemPrompt: 'Responda apenas questões de desenvolvimento.',
    });
    expect(specialistPrompt).not.toContain('FORMATO DE RESPOSTA OBRIGATÓRIO');
  });
});

// ─── Bloco 12: HYBRID_SELF_REFLECTION_SUFFIX — verificação de structured output ──

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação de structured output', () => {
  it('verifica se a resposta segue o formato obrigatório', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('formato obrigatório');
  });

  it('menciona as seções do formato (ENTENDIMENTO, ARTEFATO, RESUMO, OBSERVAÇÕES)', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('ENTENDIMENTO');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('ARTEFATO');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('RESUMO');
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('OBSERVAÇÕES');
  });
});

// ─── Bloco 13: HYBRID_GENIUS_PROMPT — desvios de qualidade (OBSERVAÇÕES, dark mode, anti-genérico) ──

describe('HYBRID_GENIUS_PROMPT — OBSERVAÇÕES: blacklist de frases burocráticas', () => {
  it('instrui que OBSERVAÇÕES sem motivo real é ERRO DE RESPOSTA', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('ERRO DE RESPOSTA');
    expect(HYBRID_GENIUS_PROMPT).toContain('TOTALMENTE OMITIDA');
  });

  it('lista condições REAIS para uso de OBSERVAÇÕES', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Assunção real feita que o usuário precisa validar');
    expect(HYBRID_GENIUS_PROMPT).toContain('Limitação técnica real do artefato entregue');
    expect(HYBRID_GENIUS_PROMPT).toContain('Dependência externa real que afeta o resultado');
    expect(HYBRID_GENIUS_PROMPT).toContain('Alerta real sobre risco, compatibilidade ou trade-off');
  });

  it('inclui blacklist de frases burocráticas proibidas', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Nenhuma observação necessária');
    expect(HYBRID_GENIUS_PROMPT).toContain('Sem observações');
    expect(HYBRID_GENIUS_PROMPT).toContain('Tudo entregue conforme solicitado');
    expect(HYBRID_GENIUS_PROMPT).toContain('Nenhuma limitação identificada');
    expect(HYBRID_GENIUS_PROMPT).toContain('O artefato está completo');
  });
});

describe('HYBRID_GENIUS_PROMPT — dark mode: detecção e obediência', () => {
  it('contém regra DARK MODE na seção de CSS', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('REGRA DARK MODE');
  });

  it('lista sinais de detecção de dark mode', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('"visual escuro"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"dark"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"dark mode"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"tema escuro"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"fundo escuro"');
  });

  it('instrui --color-bg escuro com exemplos concretos de cor', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('#0D0D0D');
    expect(HYBRID_GENIUS_PROMPT).toContain('#121212');
  });

  it('instrui --color-text claro com contraste WCAG', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('--color-text DEVE ser claro');
    expect(HYBRID_GENIUS_PROMPT).toContain('#F0F0F0');
  });

  it('proíbe #fff ou #f0f0f0 como base dominante em dark mode', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('NUNCA #fff ou #f0f0f0 como base');
    expect(HYBRID_GENIUS_PROMPT).toContain('PROIBIDO usar fundo claro/branco como base dominante');
  });
});

describe('HYBRID_GENIUS_PROMPT — anti-genérico reforçado: hero, CTA e copy', () => {
  it('contém bloco REGRAS ANTI-GENÉRICO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('REGRAS ANTI-GENÉRICO — OBRIGATÓRIAS');
  });

  it('exige hero específico ao contexto do pedido com teste de intercambialidade', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('teste de intercambialidade');
    expect(HYBRID_GENIUS_PROMPT).toContain('está REPROVADA');
  });

  it('proíbe CTAs genéricos por nome explícito', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('PROIBIDO: "Saiba mais"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"Conheça mais"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"Entre em contato"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"Confira"');
  });

  it('exige verbos de resultado no CTA', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('verbo que descreve o resultado');
    expect(HYBRID_GENIUS_PROMPT).toContain('Desbloquear');
    expect(HYBRID_GENIUS_PROMPT).toContain('Automatizar');
  });

  it('proíbe abstrações vazias na copy sem contexto concreto', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('"alta qualidade"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"profissionalismo"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"inovação"');
    expect(HYBRID_GENIUS_PROMPT).toContain('"excelência"');
  });
});

// ─── Bloco 14: HYBRID_SELF_REFLECTION_SUFFIX — verificações dos 3 desvios ─────

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação dos 3 desvios de qualidade', () => {
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
});

// ─── Bloco 15: HYBRID_GENIUS_PROMPT — ajuste fino de obediência v2 ──────────

describe('HYBRID_GENIUS_PROMPT — OBSERVAÇÕES: regra de default ausente e blacklist expandida', () => {
  it('instrui que OBSERVAÇÕES NÃO é seção do formato padrão (default ausente)', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('OBSERVAÇÕES NÃO é uma seção do formato padrão');
  });

  it('inclui blacklist expandida com variantes adicionais', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Não há observações adicionais');
    expect(HYBRID_GENIUS_PROMPT).toContain('Nada a observar');
    expect(HYBRID_GENIUS_PROMPT).toContain('O resultado atende ao solicitado');
  });

  it('instrui ELIMINAR seção se contiver frase de confirmação vazia', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('ELIMINE a seção INTEIRA');
  });
});

describe('HYBRID_GENIUS_PROMPT — CTA do hero: blacklist explícita aplicada ao hero', () => {
  it('proíbe explicitamente CTAs genéricos NO HERO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('CTA do hero');
    expect(HYBRID_GENIUS_PROMPT).toContain('Veja mais');
  });

  it('instrui que proibição de CTAs se aplica a TODOS os CTAs incluindo hero', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('TODOS os CTAs da página');
  });
});

describe('HYBRID_GENIUS_PROMPT — headline: regra prescritiva de incorporação de contexto', () => {
  it('exige incorporar elemento concreto do pedido na headline', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('tipo de artefato solicitado');
    expect(HYBRID_GENIUS_PROMPT).toContain('diferencial mencionado');
    expect(HYBRID_GENIUS_PROMPT).toContain('resultado esperado');
    expect(HYBRID_GENIUS_PROMPT).toContain('público-alvo');
  });

  it('proíbe "nome do produto + descrição genérica" como headline', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('Nome do produto + descrição genérica');
  });
});

describe('HYBRID_SELF_REFLECTION_SUFFIX — verificação reforçada dos 3 desvios v2', () => {
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
});

// ─── Bloco 15: HYBRID_GENIUS_PROMPT — OBSERVAÇÕES: seção excepcional v3 ──────

describe('HYBRID_GENIUS_PROMPT — OBSERVAÇÕES: seção excepcional v3', () => {
  it('declara que o formato padrão tem APENAS 3 seções', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('APENAS 3 seções: ENTENDIMENTO, ARTEFATO, RESUMO');
  });

  it('declara que OBSERVAÇÕES NÃO é seção do formato padrão', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('OBSERVAÇÕES NÃO é uma seção do formato padrão');
  });

  it('marca presença sem motivo real como ERRO DE RESPOSTA', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('ERRO DE RESPOSTA');
  });

  it('regras do formato declaram presença sem justificativa como DEFEITO', () => {
    expect(HYBRID_GENIUS_PROMPT).toContain('presença sem justificativa concreta é um DEFEITO');
  });
});

describe('HYBRID_SELF_REFLECTION_SUFFIX — remoção imperativa de OBSERVAÇÕES v3', () => {
  it('instrui REMOVER seção INTEIRA da resposta AGORA se não houver justificativa concreta', () => {
    expect(HYBRID_SELF_REFLECTION_SUFFIX).toContain('REMOVA a seção INTEIRA da resposta AGORA');
  });
});
