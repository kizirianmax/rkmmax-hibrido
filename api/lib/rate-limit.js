/**
 * 🛡️ RATE LIMITING - Proteção contra abuso
 * 
 * Implementa rate limiting com:
 * - 100 requests/minute por IP
 * - 1000 requests/hour por usuário
 * - Algoritmo de sliding window
 */

class RateLimiter {
  constructor() {
    this.requests = new Map(); // IP -> timestamps array
    this.userRequests = new Map(); // userId -> timestamps array
  }

  /**
   * Limpar requests antigas
   */
  cleanup() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Limpar IPs
    for (const [ip, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(t => now - t < oneHour);
      if (recent.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recent);
      }
    }

    // Limpar usuários
    for (const [userId, timestamps] of this.userRequests.entries()) {
      const recent = timestamps.filter(t => now - t < oneHour);
      if (recent.length === 0) {
        this.userRequests.delete(userId);
      } else {
        this.userRequests.set(userId, recent);
      }
    }
  }

  /**
   * Verificar limite por IP
   * @param {string} ip - Endereço IP
   * @returns {Object} - { allowed: boolean, limit: number, remaining: number, reset: number }
   */
  checkIpLimit(ip) {
    // Fix: normalizar IP falsy para 'unknown' em vez de bypass ilimitado
    const normalizedIp = ip || 'unknown';

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const limit = 100;

    // Obter requests do último minuto
    const timestamps = this.requests.get(normalizedIp) || [];
    const recentRequests = timestamps.filter(t => now - t < oneMinute);

    // Verificar limite
    const allowed = recentRequests.length < limit;
    const remaining = Math.max(0, limit - recentRequests.length);

    // Calcular quando o limite será resetado
    const oldestTimestamp = recentRequests[0] || now;
    const reset = oldestTimestamp + oneMinute;

    return {
      allowed,
      limit,
      remaining,
      reset,
      retryAfter: allowed ? 0 : Math.ceil((reset - now) / 1000),
    };
  }

  /**
   * Verificar limite por usuário
   * @param {string} userId - ID do usuário
   * @returns {Object} - { allowed: boolean, limit: number, remaining: number, reset: number }
   */
  checkUserLimit(userId) {
    if (!userId) {
      return { allowed: true, limit: 1000, remaining: 1000, reset: Date.now() + 3600000 };
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const limit = 1000;

    // Obter requests da última hora
    const timestamps = this.userRequests.get(userId) || [];
    const recentRequests = timestamps.filter(t => now - t < oneHour);

    // Verificar limite
    const allowed = recentRequests.length < limit;
    const remaining = Math.max(0, limit - recentRequests.length);
    
    // Calcular quando o limite será resetado
    const oldestTimestamp = recentRequests[0] || now;
    const reset = oldestTimestamp + oneHour;

    return {
      allowed,
      limit,
      remaining,
      reset,
      retryAfter: allowed ? 0 : Math.ceil((reset - now) / 1000),
    };
  }

  /**
   * Registrar nova requisição
   * @param {string} ip - Endereço IP
   * @param {string} userId - ID do usuário (opcional)
   */
  recordRequest(ip, userId = null) {
    const now = Date.now();

    // Registrar por IP (normalizar falsy para 'unknown')
    const normalizedIp = ip || 'unknown';
    const timestamps = this.requests.get(normalizedIp) || [];
    timestamps.push(now);
    this.requests.set(normalizedIp, timestamps);

    // Registrar por usuário
    if (userId) {
      const timestamps = this.userRequests.get(userId) || [];
      timestamps.push(now);
      this.userRequests.set(userId, timestamps);
    }
  }

  /**
   * Verificar e registrar requisição
   * @param {string} ip - Endereço IP
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Object} - { allowed: boolean, ipLimit: Object, userLimit: Object }
   */
  checkAndRecord(ip, userId = null) {
    const ipLimit = this.checkIpLimit(ip);
    const userLimit = userId ? this.checkUserLimit(userId) : { allowed: true };

    const allowed = ipLimit.allowed && userLimit.allowed;

    if (allowed) {
      this.recordRequest(ip, userId);
    }

    return {
      allowed,
      ipLimit,
      userLimit,
    };
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      totalIps: this.requests.size,
      totalUsers: this.userRequests.size,
      activeConnections: this.requests.size + this.userRequests.size,
    };
  }
}

// Instância global
const globalRateLimiter = new RateLimiter();

// Limpar a cada 5 minutos
setInterval(() => {
  globalRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Middleware para Express/Vercel
 */
export function rateLimitMiddleware(req, res, next) {
  // Fix: x-forwarded-for pode ser lista CSV — pegar apenas o primeiro IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = forwardedFor
    ? forwardedFor.split(',').map(s => s.trim()).filter(Boolean)[0] || req.connection?.remoteAddress
    : req.connection?.remoteAddress;
  const userId = req.headers['x-user-id'] || req.body?.userId;

  const result = globalRateLimiter.checkAndRecord(ip, userId);

  // Adicionar headers
  res.setHeader('X-RateLimit-Limit', result.ipLimit.limit);
  res.setHeader('X-RateLimit-Remaining', result.ipLimit.remaining);
  res.setHeader('X-RateLimit-Reset', result.ipLimit.reset);

  if (!result.allowed) {
    const retryAfter = Math.max(result.ipLimit.retryAfter, result.userLimit.retryAfter || 0);
    res.setHeader('Retry-After', retryAfter);
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter,
      limits: {
        ip: result.ipLimit,
        user: result.userLimit,
      },
    });
  }

  if (next) next();
}

export { RateLimiter, globalRateLimiter };
