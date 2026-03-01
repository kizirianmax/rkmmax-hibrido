/**
 * 📊 PERFORMANCE METRICS - Monitoramento de performance
 * 
 * Rastreia:
 * - Tempos de resposta
 * - Seleção de engines
 * - Incidentes de timeout
 * - Cache hit rate
 * - Exporta para Sentry/PostHog
 */

class PerformanceMetrics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      responseTimes: [],
      engineUsage: {},
      cacheStats: { hits: 0, misses: 0 },
      errors: [],
    };
  }

  /**
   * Registrar nova requisição
   */
  recordRequest(data) {
    this.metrics.totalRequests++;
    
    if (data.success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (data.timeout) {
      this.metrics.timeouts++;
    }

    if (data.responseTime) {
      this.metrics.responseTimes.push(data.responseTime);
      // Manter apenas últimas 1000 medições
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes.shift();
      }
    }

    if (data.engine) {
      this.metrics.engineUsage[data.engine] = (this.metrics.engineUsage[data.engine] || 0) + 1;
    }

    if (data.cached !== undefined) {
      if (data.cached) {
        this.metrics.cacheStats.hits++;
      } else {
        this.metrics.cacheStats.misses++;
      }
    }

    if (data.error) {
      this.metrics.errors.push({
        message: data.error,
        timestamp: new Date().toISOString(),
        engine: data.engine,
      });
      // Manter apenas últimos 100 erros
      if (this.metrics.errors.length > 100) {
        this.metrics.errors.shift();
      }
    }
  }

  /**
   * Calcular estatísticas de tempo de resposta
   */
  getResponseTimeStats() {
    if (this.metrics.responseTimes.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    
    return {
      avg: Math.round(sum / sorted.length),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    };
  }

  /**
   * Obter todas as métricas
   */
  getMetrics() {
    const responseTimeStats = this.getResponseTimeStats();
    const total = this.metrics.cacheStats.hits + this.metrics.cacheStats.misses;
    const cacheHitRate = total > 0 ? ((this.metrics.cacheStats.hits / total) * 100).toFixed(2) : 0;

    return {
      requests: {
        total: this.metrics.totalRequests,
        successful: this.metrics.successfulRequests,
        failed: this.metrics.failedRequests,
        successRate: this.metrics.totalRequests > 0 
          ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : '0%',
      },
      performance: {
        avgResponseTime: responseTimeStats.avg + 'ms',
        minResponseTime: responseTimeStats.min + 'ms',
        maxResponseTime: responseTimeStats.max + 'ms',
        p95ResponseTime: responseTimeStats.p95 + 'ms',
        p99ResponseTime: responseTimeStats.p99 + 'ms',
        timeouts: this.metrics.timeouts,
      },
      engines: this.metrics.engineUsage,
      cache: {
        hits: this.metrics.cacheStats.hits,
        misses: this.metrics.cacheStats.misses,
        hitRate: cacheHitRate + '%',
      },
      recentErrors: this.metrics.errors.slice(-10), // Últimos 10 erros
    };
  }

  /**
   * Exportar métricas para Sentry
   */
  exportToSentry(Sentry) {
    if (!Sentry) return;

    const metrics = this.getMetrics();
    Sentry.setContext('performance', metrics.performance);
    Sentry.setContext('engines', metrics.engines);
    Sentry.setContext('cache', metrics.cache);
  }

  /**
   * Resetar métricas
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      responseTimes: [],
      engineUsage: {},
      cacheStats: { hits: 0, misses: 0 },
      errors: [],
    };
  }
}

// Instância global
const globalMetrics = new PerformanceMetrics();

export { PerformanceMetrics, globalMetrics };
