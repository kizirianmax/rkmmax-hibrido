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
 * Reduz tamanho de prompts sem perder qualidade
 */
export function compressPrompt(prompt) {
  return (
    prompt
      // Remover múltiplos espaços
      .replace(/\s+/g, " ")
      // Remover quebras de linha desnecessárias
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      // Trim
      .trim()
  );
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

  // 5. Estimar custo
  const promptTokens = estimateTokens(compressedPrompt);
  const messagesTokens = limited.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  const totalTokens = promptTokens + messagesTokens;
  const estimatedCost = (totalTokens / 1000) * 0.00075; // Gemini Pro price

  console.log(`💰 Custo estimado: $${estimatedCost.toFixed(6)} (${totalTokens} tokens)`);

  return {
    cached: false,
    messages: limited,
    systemPrompt: compressedPrompt,
    stats: {
      originalMessages: messages.length,
      optimizedMessages: limited.length,
      totalTokens,
      estimatedCost,
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
  requestBatcher,
  optimizeRequest,
  cacheResponse,
  getCostStats,
};
