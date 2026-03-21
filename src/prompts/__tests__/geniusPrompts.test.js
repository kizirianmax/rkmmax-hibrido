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
  buildGeniusPrompt,
} from '../geniusPrompts.js';

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

// ─── Bloco 3: buildGeniusPrompt — serginho e hybrid não foram alterados ───────

describe('buildGeniusPrompt — serginho e hybrid inalterados', () => {
  it('serginho usa SELF_REFLECTION_SUFFIX genérico (com "Agregou valor real")', () => {
    const serginhoPrompt = buildGeniusPrompt('serginho');
    expect(serginhoPrompt).toContain('Agregou valor real');
    expect(serginhoPrompt).not.toContain('POLÍTICA DE CONTENÇÃO DE DOMÍNIO');
  });

  it('hybrid usa SELF_REFLECTION_SUFFIX genérico (com "Agregou valor real")', () => {
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
