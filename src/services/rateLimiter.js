/**
 * RATE LIMITER - SISTEMA DE CRÉDITOS
 * Plano Básico = 400 créditos/mês
 * Manual: 1 crédito por requisição
 * Otimizado: 5 créditos por requisição
 * Usuário escolhe qual modo usar
 */

class RateLimiter {
  constructor() {
    // Armazenar em memória (em produção usar Redis)
    this.users = {};

    // Configuração de planos
    this.plans = {
      basic: {
        name: "Básico",
        creditsPerMonth: 400,
        description: "Plano básico com 400 créditos/mês",
      },
      pro: {
        name: "Pro",
        creditsPerMonth: 2000,
        description: "Plano Pro com 2000 créditos/mês",
      },
      enterprise: {
        name: "Enterprise",
        creditsPerMonth: 10000,
        description: "Plano Enterprise com 10000 créditos/mês",
      },
    };

    // Custo de créditos por modo
    this.modeCosts = {
      manual: {
        creditCost: 1,
        speed: "slow",
        description: "Modo manual - mais lento, 1 crédito por requisição",
      },
      optimized: {
        creditCost: 0.5,
        speed: "fast",
        description: "Modo otimizado - MUITO econômico, 0.5 crédito por requisição",
      },
    };

    // Limpar dados a cada mês
    this.cleanupInterval = setInterval(() => this.cleanup(), 2592000000); // 30 dias
  }

  /**
   * Obter chave do usuário
   */
  getUserKey(userId) {
    return userId || "anonymous";
  }

  /**
   * Obter chave do mês
   */
  getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  }

  /**
   * Criar usuário com plano
   */
  createUser(userId, plan = "basic") {
    const userKey = this.getUserKey(userId);
    const monthKey = this.getMonthKey();
    const planConfig = this.plans[plan] || this.plans.basic;

    this.users[userKey] = {
      plan,
      creditsPerMonth: planConfig.creditsPerMonth,
      monthly: {
        [monthKey]: {
          creditsUsed: 0,
          creditsRemaining: planConfig.creditsPerMonth,
          requests: [],
          createdAt: new Date().toISOString(),
        },
      },
    };

    return this.users[userKey];
  }

  /**
   * Obter ou criar usuário
   */
  getOrCreateUser(userId, plan = "basic") {
    const userKey = this.getUserKey(userId);

    if (!this.users[userKey]) {
      return this.createUser(userId, plan);
    }

    // Verificar se precisa resetar o mês
    const monthKey = this.getMonthKey();
    if (!this.users[userKey].monthly[monthKey]) {
      const planConfig = this.plans[this.users[userKey].plan] || this.plans.basic;
      this.users[userKey].monthly[monthKey] = {
        creditsUsed: 0,
        creditsRemaining: planConfig.creditsPerMonth,
        requests: [],
        createdAt: new Date().toISOString(),
      };
    }

    return this.users[userKey];
  }

  /**
   * Verificar se pode fazer requisição
   */
  canMakeRequest(userId, mode = "manual", plan = "basic") {
    const userKey = this.getUserKey(userId);
    const monthKey = this.getMonthKey();
    const user = this.getOrCreateUser(userId, plan);
    const monthData = user.monthly[monthKey];
    const modeCost = this.modeCosts[mode.toLowerCase()] || this.modeCosts.manual;

    // Verificar se tem créditos suficientes
    if (monthData.creditsRemaining < modeCost.creditCost) {
      return {
        allowed: false,
        reason: `Créditos insuficientes (precisa de ${modeCost.creditCost}, tem ${monthData.creditsRemaining})`,
        creditsNeeded: modeCost.creditCost,
        creditsRemaining: monthData.creditsRemaining,
        resetIn: this.getTimeUntilNextMonth(),
      };
    }

    return {
      allowed: true,
      reason: "Requisição permitida",
      creditsRemaining: monthData.creditsRemaining,
      creditCost: modeCost.creditCost,
      mode: mode.toLowerCase(),
    };
  }

  /**
   * Registrar requisição e descontar créditos
   */
  recordRequest(userId, mode = "manual", plan = "basic") {
    const userKey = this.getUserKey(userId);
    const monthKey = this.getMonthKey();
    const user = this.getOrCreateUser(userId, plan);
    const monthData = user.monthly[monthKey];
    const modeCost = this.modeCosts[mode.toLowerCase()] || this.modeCosts.manual;

    // Descontar créditos
    monthData.creditsUsed += modeCost.creditCost;
    monthData.creditsRemaining -= modeCost.creditCost;

    // Registrar requisição
    monthData.requests.push({
      mode: mode.toLowerCase(),
      creditCost: modeCost.creditCost,
      timestamp: new Date().toISOString(),
    });

    return {
      recorded: true,
      creditCost: modeCost.creditCost,
      creditsUsed: monthData.creditsUsed,
      creditsRemaining: monthData.creditsRemaining,
      totalCredits: user.creditsPerMonth,
      percentageUsed: Math.round((monthData.creditsUsed / user.creditsPerMonth) * 100),
    };
  }

  /**
   * Obter uso atual
   */
  getCurrentUsage(userId, plan = "basic") {
    const userKey = this.getUserKey(userId);
    const monthKey = this.getMonthKey();
    const user = this.getOrCreateUser(userId, plan);
    const monthData = user.monthly[monthKey];
    const planConfig = this.plans[plan] || this.plans.basic;

    return {
      plan: user.plan,
      creditsUsed: monthData.creditsUsed,
      creditsRemaining: monthData.creditsRemaining,
      totalCredits: planConfig.creditsPerMonth,
      percentageUsed: Math.round((monthData.creditsUsed / planConfig.creditsPerMonth) * 100),
      requestCount: monthData.requests.length,
      month: monthKey,
      resetIn: this.getTimeUntilNextMonth(),
    };
  }

  /**
   * Obter informações do plano
   */
  getPlanInfo(plan = "basic") {
    const planConfig = this.plans[plan] || this.plans.basic;
    const manualCost = this.modeCosts.manual.creditCost;
    const optimizedCost = this.modeCosts.optimized.creditCost;

    return {
      plan: planConfig.name,
      creditsPerMonth: planConfig.creditsPerMonth,
      description: planConfig.description,
      modes: {
        manual: {
          creditCost: manualCost,
          requestsPerMonth: Math.floor(planConfig.creditsPerMonth / manualCost),
          speed: "lento",
          description: `${Math.floor(planConfig.creditsPerMonth / manualCost)} requisições/mês`,
        },
        optimized: {
          creditCost: optimizedCost,
          requestsPerMonth: Math.floor(planConfig.creditsPerMonth / optimizedCost),
          speed: "rápido",
          description: `${Math.floor(planConfig.creditsPerMonth / optimizedCost)} requisições/mês`,
        },
      },
    };
  }

  /**
   * Obter tempo até próximo mês
   */
  getTimeUntilNextMonth() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const diff = nextMonth - now;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    return `${days}d ${hours}h`;
  }

  /**
   * Limpar dados antigos
   */
  cleanup() {
    const now = new Date();
    const currentMonth = this.getMonthKey();

    for (const userKey in this.users) {
      const user = this.users[userKey];

      // Remover dados de meses antigos (manter últimos 3 meses)
      const months = Object.keys(user.monthly).sort().reverse();
      if (months.length > 3) {
        const toDelete = months.slice(3);
        toDelete.forEach((month) => delete user.monthly[month]);
      }

      // Remover usuário se vazio
      if (Object.keys(user.monthly).length === 0) {
        delete this.users[userKey];
      }
    }
  }

  /**
   * Reset de créditos (admin only)
   */
  resetUserCredits(userId) {
    const userKey = this.getUserKey(userId);
    if (this.users[userKey]) {
      const monthKey = this.getMonthKey();
      const planConfig = this.plans[this.users[userKey].plan] || this.plans.basic;

      this.users[userKey].monthly[monthKey] = {
        creditsUsed: 0,
        creditsRemaining: planConfig.creditsPerMonth,
        requests: [],
        createdAt: new Date().toISOString(),
      };

      return { reset: true };
    }
    return { reset: false };
  }

  /**
   * Destruir limiter
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Instância global
let limiterInstance = null;

function getLimiter() {
  if (!limiterInstance) {
    limiterInstance = new RateLimiter();
  }
  return limiterInstance;
}

export { RateLimiter, getLimiter };
