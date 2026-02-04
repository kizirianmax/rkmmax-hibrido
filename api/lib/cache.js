/**
 * 💰 SMART CACHE - Cache inteligente para respostas
 * 
 * Implementa:
 * - Cache em memória com TTL de 5 minutos
 * - LRU eviction policy
 * - Hash de mensagens para chave de cache
 * - Monitoramento de hit rate
 */

import crypto from 'crypto';

class SmartCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutos
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Gerar chave de cache baseada nas mensagens
   */
  generateKey(messages) {
    const content = JSON.stringify(messages);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Obter do cache
   */
  get(messages) {
    const key = this.generateKey(messages);
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Hit! Mover para o final (LRU)
    this.cache.delete(key);
    this.cache.set(key, cached);
    this.hits++;

    console.log(`💰 CACHE HIT! (${this.getHitRate()}% hit rate)`);
    return cached.value;
  }

  /**
   * Salvar no cache
   */
  set(messages, value) {
    const key = this.generateKey(messages);
    
    // Se cache está cheio, remover o mais antigo (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Limpar cache expirado
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      totalRequests: this.hits + this.misses,
    };
  }

  getHitRate() {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return ((this.hits / total) * 100).toFixed(2);
  }

  /**
   * Limpar todo o cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Instância global compartilhada
const globalCache = new SmartCache();

// Limpar cache expirado a cada 5 minutos
setInterval(() => {
  globalCache.cleanup();
}, 5 * 60 * 1000);

export { SmartCache, globalCache };
