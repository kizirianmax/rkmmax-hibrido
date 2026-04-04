/**
 * COST OPTIMIZATION SYSTEM
 * Sistema de otimização de custo para RKMMAX
 *
 * Técnicas:
 * 1. Cache inteligente (Redis-like in-memory)
 * 2. Compressão de prompts
 * 3. Deduplicação de mensagens
 * 4. Batching de requisições
 * 5. Token counting e limites
 *
 * Economia esperada: 40-60% em custos de API
 */

import crypto from "crypto";

/**
 * CACHE IN-MEMORY
 * Cache simples mas efetivo para respostas similares
 */
class ResponseCache {
  constructor(maxSize = 1000, ttl = 3600000) {
    // 1 hora TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Gerar hash da mensagem para cache
   */
  generateHash(messages) {
    const content = JSON.stringify(messages);
    return crypto.createHash("md5").update(content).digest("hex");
  }

  /**
   * Buscar no cache
   */
  get(messages) {
    const hash = this.generateHash(messages);
    const cached = this.cache.get(hash);

    if (!cached) return null;

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(hash);
      return null;
    }

    console.log("💰 CACHE HIT! Economia de custo!");
    return cached.response;
  }

  /**
   * Salvar no cache
   */
  set(messages, response) {
    const hash = this.generateHash(messages);

    // Limpar cache se muito grande
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(hash, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpar cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Estatísticas
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

// Instância global do cache
export const responseCache = new ResponseCache();
export { ResponseCache };

/**
 * COMPRESSÃO DE PROMPTS
 * Reduz tamanho de prompts sem perder qualidade.
 * Usa compressão leve que preserva quebras de linha e estrutura hierárquica
 * (headers, seções, listas) — essencial para que o LLM siga instruções formatadas.
 */
export function compressPrompt(prompt) {
  return prompt
    // Remover espaços/tabs no final de cada linha (trailing whitespace)
    .replace(/[ \t]+$/gm, "")
    // Colapsar 3+ quebras de linha consecutivas em 2 (preserva separação de seções)
    .replace(/\n{3,}/g, "\n\n")
    // Trim
    .trim();
}

/**
 * DEDUPLICAÇÃO DE MENSAGENS
 * Remove mensagens duplicadas consecutivas
 */
export function deduplicateMessages(messages) {
  const deduplicated = [];
  let lastContent = null;

  for (const msg of messages) {
    if (msg.content !== lastContent) {
      deduplicated.push(msg);
      lastContent = msg.content;
    }
  }

  return deduplicated;
}

/**
 * TOKEN COUNTING
 * Estima tokens para controlar custos
 */
export function estimateTokens(text) {
  // Estimativa simples: ~4 caracteres = 1 token
  // Mais preciso seria usar tiktoken, mas adiciona dependência
  return Math.ceil(text.length / 4);
}

/**
 * LIMITAR CONTEXTO
 * Mantém apenas mensagens recentes para economizar
 */
export function limitContext(messages, maxTokens = 4000) {
  let totalTokens = 0;
  const limited = [];

  // Iterar de trás para frente (mais recentes primeiro)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = estimateTokens(msg.content);

    if (totalTokens + tokens > maxTokens) {
      break;
    }

    limited.unshift(msg);
    totalTokens += tokens;
  }

  return limited;
}

/**
 * BATCHING DE REQUISIÇÕES
 * Agrupa múltiplas requisições em uma
 */
class RequestBatcher {
  constructor(batchSize = 5, batchDelay = 100) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.queue = [];
    this.timer = null;
  }

  /**
   * Adicionar requisição ao batch
   */
  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      // Se atingiu tamanho do batch, processar imediatamente
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else {
        // Senão, agendar processamento
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  /**
   * Processar batch
   */
  async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);

    console.log(`🔄 Processando batch de ${batch.length} requisições`);

    // Processar em paralelo
    const results = await Promise.allSettled(batch.map(({ request }) => request()));

    // Resolver promessas
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        batch[index].resolve(result.value);
      } else {
        batch[index].reject(result.reason);
      }
    });
  }
}

export { RequestBatcher };
export const requestBatcher = new RequestBatcher();

/**
 * GUARD DE BUDGET DE TOKENS
 * Garante que system prompt + messages caibam no context window seguro do provider.
 *
 * Budget conservador para input Groq:
 *   - MAX_INPUT_TOKENS: 6000 tokens para system + messages combined
 *   - DEFAULT_OUTPUT_BUDGET: 4096 tokens (reservado para saída)
 *
 * Se o total ultrapassar o budget, trunca o system prompt de forma inteligente
 * removendo blocos opcionais do final do prompt (few-shot, micro-referência, etc.).
 * Retorna sempre um objeto com { systemPrompt, messages, truncated }.
 *
 * @param {string} systemPrompt - System prompt já comprimido
 * @param {Array} messages - Mensagens já limitadas por limitContext()
 * @param {number} [maxInputTokens=6000] - Budget máximo para system + messages
 * @returns {{ systemPrompt: string, messages: Array, truncated: boolean }}
 */
export function ensureTokenBudget(systemPrompt, messages, maxInputTokens = 6000) {
  const systemTokens = estimateTokens(systemPrompt);
  const messagesTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  const totalInputTokens = systemTokens + messagesTokens;

  if (totalInputTokens <= maxInputTokens) {
    return { systemPrompt, messages, truncated: false };
  }

  // Budget excedido — tentar reduzir o system prompt removendo blocos opcionais do final.
  // Estratégia: truncar no limite máximo de tokens para o system prompt, preservando
  // parágrafos completos (split por dupla quebra de linha).
  const maxSystemTokens = Math.max(maxInputTokens - messagesTokens, 1000);
  const maxSystemChars = maxSystemTokens * 4; // estimativa reversa (~4 chars/token)

  if (systemPrompt.length <= maxSystemChars) {
    return { systemPrompt, messages, truncated: false };
  }

  // Truncar preservando parágrafos completos
  const paragraphs = systemPrompt.split('\n\n');
  let truncated = '';
  for (const paragraph of paragraphs) {
    const candidate = truncated ? truncated + '\n\n' + paragraph : paragraph;
    if (candidate.length > maxSystemChars) break;
    truncated = candidate;
  }

  // Fallback: se nenhum parágrafo coube, truncar por caractere no limite
  if (!truncated) {
    truncated = systemPrompt.slice(0, maxSystemChars);
  }

  return { systemPrompt: truncated.trim(), messages, truncated: true };
}

/**
 * OTIMIZAÇÃO COMPLETA
 * Aplica todas as otimizações
 */
export function optimizeRequest(messages, systemPrompt) {
  // 1. Verificar cache
  const cached = responseCache.get(messages);
  if (cached) {
    return { cached: true, response: cached };
  }

  // 2. Deduplicar mensagens
  const deduplicated = deduplicateMessages(messages);

  // 3. Limitar contexto
  const limited = limitContext(deduplicated);

  // 4. Comprimir prompt
  const compressedPrompt = compressPrompt(systemPrompt);

  // 5. Garantir budget de tokens (system + messages dentro do limite seguro)
  const budgeted = ensureTokenBudget(compressedPrompt, limited);

  // 6. Estimar custo
  const promptTokens = estimateTokens(budgeted.systemPrompt);
  const messagesTokens = budgeted.messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  const totalTokens = promptTokens + messagesTokens;
  const estimatedCost = (totalTokens / 1000) * 0.00075; // Groq pricing reference

  if (budgeted.truncated) {
    console.warn(`⚠️ System prompt truncado para caber no budget de tokens (${promptTokens} tokens)`);
  }

  console.log(`💰 Custo estimado: $${estimatedCost.toFixed(6)} (${totalTokens} tokens)`);

  return {
    cached: false,
    messages: budgeted.messages,
    systemPrompt: budgeted.systemPrompt,
    stats: {
      originalMessages: messages.length,
      optimizedMessages: budgeted.messages.length,
      totalTokens,
      estimatedCost,
      systemPromptTruncated: budgeted.truncated,
    },
  };
}

/**
 * SALVAR RESPOSTA NO CACHE
 */
export function cacheResponse(messages, response) {
  responseCache.set(messages, response);
}

/**
 * ESTATÍSTICAS DE ECONOMIA
 */
export function getCostStats() {
  return {
    cache: responseCache.stats(),
    // Adicionar mais estatísticas conforme necessário
  };
}

/**
 * Exportar tudo
 */
export default {
  responseCache,
  compressPrompt,
  deduplicateMessages,
  estimateTokens,
  limitContext,
  ensureTokenBudget,
  requestBatcher,
  optimizeRequest,
  cacheResponse,
  getCostStats,
};
