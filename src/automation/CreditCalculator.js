/**
 * CREDIT CALCULATOR
 * Calcula créditos, preços e margens bruta de IA
 * Regras: Básico 60% margem, Intermediário/Premium 40% margem
 * Limites rígidos por dia em planos pagos
 */

class CreditCalculator {
  constructor() {
    // Custos de IA por operação (em centavos de real)
    this.aiCosts = {
      "llama-8b": {
        input: 0.05, // R$ 0,0005 por 1K tokens (fast, efficient)
        output: 0.1, // R$ 0,001 por 1K tokens
      },
      "llama-70b": {
        input: 0.3, // R$ 0,003 por 1K tokens (complex tasks)
        output: 0.8, // R$ 0,008 por 1K tokens
      },
      "llama-120b": {
        input: 0.6, // R$ 0,006 por 1K tokens (very complex tasks)
        output: 1.2, // R$ 0,012 por 1K tokens
      },
      "groq-fallback": {
        input: 0.05, // R$ 0,0005 por 1K tokens
        output: 0.1, // R$ 0,001 por 1K tokens
      },
    };

    // Custos operacionais por operação (em centavos)
    this.operationalCosts = {
      analysis: 50, // R$ 0,50
      "code-generation": 100, // R$ 1,00
      "security-validation": 30, // R$ 0,30
      "git-operations": 20, // R$ 0,20
      storage: 10, // R$ 0,10
    };

    // Definição de planos com limites rígidos
    this.plans = {
      free: {
        name: "Plano Gratuito",
        monthlyPrice: 0,
        dailyLimits: {
          automations: -1, // Sem limite
          aiRequests: -1, // Sem limite
          totalCredits: -1, // Sem limite
        },
        features: {
          specialists: 1, // Apenas Serginho
          modes: ["MANUAL"],
          maxFilesPerAutomation: 5,
          maxLinesOfCode: 1000,
          gitIntegration: false,
          prCreation: false,
        },
        marginTarget: 0, // Gratuito não tem margem
        status: "ACTIVE",
        deprecationWarning: true, // Aviso de descontinuação
      },

      basic: {
        name: "Plano Básico",
        monthlyPrice: 4990, // R$ 49,90
        dailyLimits: {
          automations: 5, // 5 automações por dia
          aiRequests: 20, // 20 requisições de IA por dia
          totalCredits: 50, // 50 créditos por dia
        },
        features: {
          specialists: 10, // 10 especialistas
          modes: ["MANUAL", "HYBRID"],
          maxFilesPerAutomation: 10,
          maxLinesOfCode: 5000,
          gitIntegration: true,
          prCreation: false,
        },
        marginTarget: 60, // 60% de margem
        status: "ACTIVE",
      },

      intermediate: {
        name: "Plano Intermediário",
        monthlyPrice: 9990, // R$ 99,90
        dailyLimits: {
          automations: 15, // 15 automações por dia
          aiRequests: 60, // 60 requisições de IA por dia
          totalCredits: 150, // 150 créditos por dia
        },
        features: {
          specialists: 30, // 30 especialistas
          modes: ["MANUAL", "HYBRID", "OPTIMIZED"],
          maxFilesPerAutomation: 25,
          maxLinesOfCode: 15000,
          gitIntegration: true,
          prCreation: true,
        },
        marginTarget: 40, // 40% de margem
        status: "ACTIVE",
      },

      premium: {
        name: "Plano Premium",
        monthlyPrice: 19990, // R$ 199,90
        dailyLimits: {
          automations: 50, // 50 automações por dia
          aiRequests: 200, // 200 requisições de IA por dia
          totalCredits: 500, // 500 créditos por dia
        },
        features: {
          specialists: 54, // Todos os especialistas
          modes: ["MANUAL", "HYBRID", "OPTIMIZED"],
          maxFilesPerAutomation: 100,
          maxLinesOfCode: 50000,
          gitIntegration: true,
          prCreation: true,
        },
        marginTarget: 40, // 40% de margem
        status: "ACTIVE",
      },

      enterprise: {
        name: "Plano Enterprise",
        monthlyPrice: 0, // Customizado
        dailyLimits: {
          automations: -1, // Sem limite
          aiRequests: -1, // Sem limite
          totalCredits: -1, // Sem limite
        },
        features: {
          specialists: 54, // Todos os especialistas
          modes: ["MANUAL", "HYBRID", "OPTIMIZED"],
          maxFilesPerAutomation: -1,
          maxLinesOfCode: -1,
          gitIntegration: true,
          prCreation: true,
        },
        marginTarget: 40,
        status: "CUSTOM",
      },
    };

    // Custos de IA por tipo de operação
    this.operationCosts = {
      MANUAL: {
        analysis: 0.5, // R$ 0,50
        codeGeneration: 1.0, // R$ 1,00
        securityValidation: 0.3, // R$ 0,30
        gitOperations: 0.2, // R$ 0,20
      },
      HYBRID: {
        analysis: 0.75, // R$ 0,75
        codeGeneration: 1.5, // R$ 1,50
        securityValidation: 0.5, // R$ 0,50
        gitOperations: 0.3, // R$ 0,30
      },
      OPTIMIZED: {
        analysis: 1.0, // R$ 1,00
        codeGeneration: 2.0, // R$ 2,00
        securityValidation: 0.75, // R$ 0,75
        gitOperations: 0.5, // R$ 0,50
      },
    };
  }

  /**
   * Calcular custo total de uma automação
   */
  calculateAutomationCost(mode, tokensUsed = 1000, model = "llama-8b") {
    const operationCost = this.operationCosts[mode] || this.operationCosts["MANUAL"];

    // Custo de IA (estimado por tokens)
    const aiCost = this.estimateAICost(model, tokensUsed);

    // Custo operacional
    const totalOperational =
      operationCost.analysis +
      operationCost.codeGeneration +
      operationCost.securityValidation +
      operationCost.gitOperations;

    // Custo total
    const totalCost = aiCost + totalOperational;

    return {
      mode,
      model,
      tokensUsed,
      aiCost: parseFloat(aiCost.toFixed(2)),
      operationalCost: parseFloat(totalOperational.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      breakdown: {
        analysis: operationCost.analysis,
        codeGeneration: operationCost.codeGeneration,
        securityValidation: operationCost.securityValidation,
        gitOperations: operationCost.gitOperations,
      },
    };
  }

  /**
   * Estimar custo de IA por tokens
   */
  estimateAICost(model, totalTokens) {
    const modelCost = this.aiCosts[model] || this.aiCosts["llama-8b"];

    // Estimativa: 70% input, 30% output
    const inputTokens = totalTokens * 0.7;
    const outputTokens = totalTokens * 0.3;

    const inputCost = (inputTokens / 1000) * modelCost.input;
    const outputCost = (outputTokens / 1000) * modelCost.output;

    return inputCost + outputCost;
  }

  /**
   * Converter custo em créditos
   */
  costToCredits(costInReais, plan = "basic") {
    // 1 crédito = R$ 0,10 (base)
    const creditValue = 0.1;
    return Math.ceil(costInReais / creditValue);
  }

  /**
   * Calcular preço de venda com margem
   */
  calculateSellingPrice(costInReais, marginPercentage) {
    // Fórmula: Preço de Venda = Custo / (1 - Margem%)
    const margin = marginPercentage / 100;
    const sellingPrice = costInReais / (1 - margin);

    return parseFloat(sellingPrice.toFixed(2));
  }

  /**
   * Obter informações de plano
   */
  getPlanInfo(planName) {
    return this.plans[planName] || null;
  }

  /**
   * Listar todos os planos
   */
  listAllPlans() {
    return Object.entries(this.plans).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));
  }

  /**
   * Verificar se usuário atingiu limite diário
   */
  checkDailyLimit(planName, currentUsage) {
    const plan = this.plans[planName];
    if (!plan) return { valid: false, message: "Plano não encontrado" };

    const limits = plan.dailyLimits;

    // Plano gratuito não tem limite
    if (planName === "free") {
      return { valid: true, message: "Sem limite" };
    }

    // Verificar cada limite
    if (limits.automations > 0 && currentUsage.automations >= limits.automations) {
      return {
        valid: false,
        message: `Limite de automações diárias atingido: ${limits.automations}`,
        limit: limits.automations,
        current: currentUsage.automations,
      };
    }

    if (limits.aiRequests > 0 && currentUsage.aiRequests >= limits.aiRequests) {
      return {
        valid: false,
        message: `Limite de requisições de IA diárias atingido: ${limits.aiRequests}`,
        limit: limits.aiRequests,
        current: currentUsage.aiRequests,
      };
    }

    if (limits.totalCredits > 0 && currentUsage.totalCredits >= limits.totalCredits) {
      return {
        valid: false,
        message: `Limite de créditos diários atingido: ${limits.totalCredits}`,
        limit: limits.totalCredits,
        current: currentUsage.totalCredits,
      };
    }

    return { valid: true, message: "Dentro dos limites" };
  }

  /**
   * Calcular preços finais para todos os planos
   */
  calculatePlanPrices() {
    const prices = {};

    for (const [planId, plan] of Object.entries(this.plans)) {
      if (planId === "free" || planId === "enterprise") continue;

      // Estimar custo mensal (assumindo 20 automações por dia)
      const automationsPerMonth = 20 * 30; // 20 por dia, 30 dias
      const avgTokensPerAutomation = 2000;
      const avgModel = "gemini-2.0-flash";

      const costPerAutomation = this.calculateAutomationCost(
        "OPTIMIZED",
        avgTokensPerAutomation,
        avgModel
      );

      const monthlyCost = costPerAutomation.totalCost * automationsPerMonth;

      // Calcular preço de venda com margem
      const sellingPrice = this.calculateSellingPrice(monthlyCost, plan.marginTarget);

      // Arredondar para valor comercial
      const commercialPrice = Math.ceil(sellingPrice / 10) * 10; // Arredondar para múltiplo de 10

      prices[planId] = {
        plan: plan.name,
        estimatedMonthlyCost: parseFloat(monthlyCost.toFixed(2)),
        marginTarget: plan.marginTarget,
        calculatedPrice: parseFloat(sellingPrice.toFixed(2)),
        commercialPrice: commercialPrice,
        monthlyPrice: plan.monthlyPrice,
        priceMatch: Math.abs(plan.monthlyPrice - commercialPrice * 100) < 100,
      };
    }

    return prices;
  }

  /**
   * Gerar relatório de preços
   */
  generatePricingReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      plans: [],
      summary: {
        totalPlans: 0,
        activeePlans: 0,
        totalMonthlyRevenue: 0,
      },
    };

    for (const [planId, plan] of Object.entries(this.plans)) {
      const planReport = {
        id: planId,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        dailyLimits: plan.dailyLimits,
        features: plan.features,
        marginTarget: plan.marginTarget,
        status: plan.status,
      };

      report.plans.push(planReport);
      report.summary.totalPlans++;

      if (plan.status === "ACTIVE") {
        report.summary.activeePlans++;
        report.summary.totalMonthlyRevenue += plan.monthlyPrice;
      }
    }

    return report;
  }

  /**
   * Validar se especialista está disponível no plano
   */
  canUseSpecialist(planName, specialistCount) {
    const plan = this.plans[planName];
    if (!plan) return false;

    return specialistCount <= plan.features.specialists;
  }

  /**
   * Validar se modo está disponível no plano
   */
  canUseMode(planName, mode) {
    const plan = this.plans[planName];
    if (!plan) return false;

    return plan.features.modes.includes(mode);
  }

  /**
   * Obter créditos restantes do dia
   */
  getRemainingCreditsToday(planName, usedCredits) {
    const plan = this.plans[planName];
    if (!plan || plan.dailyLimits.totalCredits === -1) {
      return -1; // Sem limite
    }

    return Math.max(0, plan.dailyLimits.totalCredits - usedCredits);
  }
}

export default CreditCalculator;
