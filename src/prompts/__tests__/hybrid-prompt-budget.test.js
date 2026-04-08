/**
 * Testes de budget de tokens do prompt híbrido
 *
 * Garantem que o system prompt do Construtor/Híbrido não estoure
 * o context window do Groq, prevenindo a regressão de 503.
 *
 * Threshold conservador:
 *   - System prompt isolado: < 5000 tokens
 *   - System prompt + mensagem representativa: < 6000 tokens (budget seguro para Groq free tier)
 */

import { buildGeniusPrompt } from '../geniusPrompts.js';
import { estimateTokens, ensureTokenBudget } from '../../utils/costOptimization.js';

// Budget seguro para input no Groq (system + messages combinados)
const MAX_SAFE_INPUT_TOKENS = 6000;

// Limite máximo para o system prompt isolado
const MAX_SYSTEM_PROMPT_TOKENS = 5000;

// Mensagem representativa de pedido web premium (worst-case de tamanho de input)
const PREMIUM_WEB_REQUEST =
  'Crie uma landing page profissional para um app de meditação com dark mode, copy premium e multiarquivo. ' +
  'O app se chama MindFlow, ajuda profissionais ocupados a dormirem melhor em 10 minutos por noite. ' +
  'Quero hero com headline magnética, seção de benefícios com 4 cartões, como funciona em 3 passos, ' +
  'seção de credibilidade, CTA final com urgência e footer. Use dark mode profundo, paleta roxa/violeta, ' +
  'tipografia premium com Google Fonts, animações suaves ao scroll, e entregue em formato multiarquivo ' +
  '(index.html + styles.css + script.js + README.md).';

describe('Hybrid prompt — budget de tokens para Groq', () => {
  let hybridSystemPrompt;
  let systemTokens;

  beforeAll(() => {
    hybridSystemPrompt = buildGeniusPrompt('hybrid');
    systemTokens = estimateTokens(hybridSystemPrompt);
  });

  it('system prompt híbrido é gerado com sucesso', () => {
    expect(hybridSystemPrompt).toBeTruthy();
    expect(typeof hybridSystemPrompt).toBe('string');
    expect(hybridSystemPrompt.length).toBeGreaterThan(100);
  });

  it(`system prompt não excede ${MAX_SYSTEM_PROMPT_TOKENS} tokens (limite para evitar 503)`, () => {
    expect(systemTokens).toBeLessThan(MAX_SYSTEM_PROMPT_TOKENS);
  });

  it('system prompt + mensagem de pedido premium cabe no budget seguro do Groq', () => {
    const requestTokens = estimateTokens(PREMIUM_WEB_REQUEST);
    const totalInputTokens = systemTokens + requestTokens;
    expect(totalInputTokens).toBeLessThan(MAX_SAFE_INPUT_TOKENS);
  });

  it('system prompt foi reduzido em relação ao baseline inflado (> 20% menor que 6613 tokens)', () => {
    const BASELINE_TOKENS = 6613; // token count antes da compactação
    const reductionPercent = ((BASELINE_TOKENS - systemTokens) / BASELINE_TOKENS) * 100;
    expect(reductionPercent).toBeGreaterThan(20);
  });
});

describe('ensureTokenBudget — guard de budget para optimizeRequest', () => {
  const sampleMessages = [{ role: 'user', content: PREMIUM_WEB_REQUEST }];

  it('retorna sem truncar quando dentro do budget', () => {
    const shortPrompt = 'Você é um assistente.';
    const result = ensureTokenBudget(shortPrompt, sampleMessages, 6000);
    expect(result.truncated).toBe(false);
    expect(result.systemPrompt).toBe(shortPrompt);
    expect(result.messages).toBe(sampleMessages);
  });

  it('trunca o system prompt quando ultrapassa o budget', () => {
    // Criar um prompt artificialmente grande (> 6000 tokens ≈ > 24000 chars)
    const bloatedPrompt = 'A'.repeat(4) + '\n\n' + 'B'.repeat(24000);
    const result = ensureTokenBudget(bloatedPrompt, [], 1000);
    expect(result.truncated).toBe(true);
    expect(result.systemPrompt.length).toBeLessThan(bloatedPrompt.length);
  });

  it('preserva parágrafos completos ao truncar (não corta no meio de uma frase)', () => {
    const paragraph1 = 'Primeiro parágrafo completo com conteúdo importante.';
    const paragraph2 = 'B'.repeat(20000); // parágrafo enorme que não cabe
    const bloatedPrompt = paragraph1 + '\n\n' + paragraph2;
    const result = ensureTokenBudget(bloatedPrompt, [], 100);
    expect(result.truncated).toBe(true);
    expect(result.systemPrompt).toContain(paragraph1);
    expect(result.systemPrompt).not.toContain('B'.repeat(100));
  });

  it('retorna { systemPrompt, messages, truncated } sempre', () => {
    const result = ensureTokenBudget('Prompt.', sampleMessages);
    expect(result).toHaveProperty('systemPrompt');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('truncated');
  });

  it('o prompt híbrido real não precisa ser truncado com budget de 6000 tokens', () => {
    const hybridPrompt = buildGeniusPrompt('hybrid');
    const result = ensureTokenBudget(hybridPrompt, sampleMessages, MAX_SAFE_INPUT_TOKENS);
    expect(result.truncated).toBe(false);
  });
});
