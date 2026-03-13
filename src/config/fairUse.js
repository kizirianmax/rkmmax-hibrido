// src/config/fairUse.js
// ===== Fair Use — Limites por Plano =====
// Planos oficiais: basic | intermediate | premium | ultra | dev
// Plano "free" removido — produto 100% pago.
// Plano desconhecido → lança erro explícito (nunca cai silenciosamente em free).

export const plans = {
  basic: {
    id: "basic",
    name: "Básico",
    price: 14.9,
    currency: "BRL",
    limits: {
      messagesPerDay: 100,
      messagesPerMonth: 3000,
      specialists: "all",
      maxTokensPerMessage: 2000,
      features: {
        studyLab: true,
        prioritySupport: false,
        advancedModels: false,
      },
    },
  },
  intermediate: {
    id: "intermediate",
    name: "Intermediário",
    price: 50,
    currency: "BRL",
    limits: {
      messagesPerDay: 300,
      messagesPerMonth: 9000,
      specialists: "all",
      maxTokensPerMessage: 4000,
      features: {
        studyLab: true,
        prioritySupport: true,
        advancedModels: false,
      },
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 90,
    currency: "BRL",
    limits: {
      messagesPerDay: 500,
      messagesPerMonth: 15000,
      specialists: "all",
      maxTokensPerMessage: 8000,
      features: {
        studyLab: true,
        prioritySupport: true,
        advancedModels: true,
      },
    },
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    price: null, // preço definido pelo comercial
    currency: "BRL",
    limits: {
      messagesPerDay: 0,       // 0 = sem limite
      messagesPerMonth: 0,     // 0 = sem limite
      specialists: "all",
      maxTokensPerMessage: 0,  // 0 = sem limite
      features: {
        studyLab: true,
        prioritySupport: true,
        advancedModels: true,
        compliance: true,
      },
    },
  },
  dev: {
    id: "dev",
    name: "Dev",
    price: null, // ambiente de desenvolvimento
    currency: "BRL",
    limits: {
      messagesPerDay: 0,       // 0 = sem limite
      messagesPerMonth: 0,     // 0 = sem limite
      specialists: "all",
      maxTokensPerMessage: 0,  // 0 = sem limite
      features: {
        studyLab: true,
        prioritySupport: true,
        advancedModels: true,
      },
    },
  },
};

/**
 * Resolve o objeto de plano pelo id.
 * Nunca cai silenciosamente em "free" — lança erro para plano desconhecido.
 * @param {string} userPlan
 * @returns {object} plano
 */
function resolvePlan(userPlan) {
  const plan = plans[userPlan];
  if (!plan) {
    throw new Error(
      `[fairUse] Plano desconhecido: "${userPlan}". Planos válidos: ${Object.keys(plans).join(", ")}.`
    );
  }
  return plan;
}

// Verificar se usuário atingiu limite
export const checkLimit = (userPlan, usage) => {
  const plan = resolvePlan(userPlan);

  // 0 = sem limite (ultra/dev)
  const dailyLimit = plan.limits.messagesPerDay;
  const monthlyLimit = plan.limits.messagesPerMonth;

  const dailyRemaining  = dailyLimit  === 0 ? Infinity : dailyLimit  - (usage.messagesToday    || 0);
  const monthlyRemaining = monthlyLimit === 0 ? Infinity : monthlyLimit - (usage.messagesThisMonth || 0);

  return {
    canSendMessage: dailyRemaining > 0 && monthlyRemaining > 0,
    dailyRemaining:  dailyRemaining  === Infinity ? null : dailyRemaining,
    monthlyRemaining: monthlyRemaining === Infinity ? null : monthlyRemaining,
    dailyLimit,
    monthlyLimit,
    softLimitReached:
      (dailyRemaining  !== Infinity && dailyRemaining  < 10) ||
      (monthlyRemaining !== Infinity && monthlyRemaining < 50),
  };
};

// Mensagens de aviso
export const getLimitMessage = (limitStatus) => {
  if (!limitStatus.canSendMessage) {
    if (limitStatus.dailyRemaining !== null && limitStatus.dailyRemaining <= 0) {
      return {
        type: "error",
        message:
          "Limite diário atingido. Você poderá enviar novas mensagens amanhã ou fazer upgrade do plano.",
        action: "upgrade",
      };
    }
    if (limitStatus.monthlyRemaining !== null && limitStatus.monthlyRemaining <= 0) {
      return {
        type: "error",
        message: "Limite mensal atingido. Faça upgrade para continuar usando.",
        action: "upgrade",
      };
    }
  }

  if (limitStatus.softLimitReached) {
    if (limitStatus.dailyRemaining !== null && limitStatus.dailyRemaining < 10) {
      return {
        type: "warning",
        message: `Você tem apenas ${limitStatus.dailyRemaining} mensagens restantes hoje. Considere fazer upgrade.`,
        action: "info",
      };
    }
    if (limitStatus.monthlyRemaining !== null && limitStatus.monthlyRemaining < 50) {
      return {
        type: "warning",
        message: `Você tem apenas ${limitStatus.monthlyRemaining} mensagens restantes este mês. Considere fazer upgrade.`,
        action: "info",
      };
    }
  }

  return null;
};

// Verificar se especialista está disponível no plano
export const canUseSpecialist = (userPlan, specialistId) => {
  const plan = resolvePlan(userPlan);

  if (plan.limits.specialists === "all") {
    return true;
  }

  return plan.limits.specialists.includes(specialistId);
};

// Obter modelo de IA baseado no plano
export const getAIModel = (userPlan, messageType = "standard") => {
  const plan = resolvePlan(userPlan);

  // Premium/ultra/dev podem escolher modelo avançado
  if (plan.limits.features.advancedModels && messageType === "advanced") {
    return "llama-70b";
  }

  return "llama-8b";
};

// Calcular custo estimado por mensagem
export const estimateMessageCost = (userPlan, tokens) => {
  const model = getAIModel(userPlan);

  const pricing = {
    "llama-8b":  0.00000005, // $0.05 / 1M tokens
    "llama-70b": 0.0000003,  // $0.30 / 1M tokens
  };

  const costPerToken = pricing[model] || pricing["llama-8b"];
  const costUSD = tokens * costPerToken;
  const costBRL = costUSD * 5; // Conversão aproximada

  return {
    model,
    tokens,
    costUSD,
    costBRL,
  };
};
