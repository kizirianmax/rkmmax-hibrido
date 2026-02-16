// Sistema de Fair Use - Limites por Plano
// Garante uso sustentável e controle de custos

export const plans = {
  free: {
    id: "free",
    name: "Gratuito",
    price: 0,
    currency: "BRL",
    limits: {
      messagesPerDay: 10,
      messagesPerMonth: 100,
      specialists: ["serginho", "didak", "edu"], // Apenas 3 especialistas
      maxTokensPerMessage: 1000,
      features: {
        studyLab: false,
        prioritySupport: false,
        advancedModels: false,
      },
    },
  },
  basic: {
    id: "basic",
    name: "Básico",
    price: 14.9,
    currency: "BRL",
    limits: {
      messagesPerDay: 100,
      messagesPerMonth: 3000,
      specialists: "all", // Todos os especialistas
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
        advancedModels: true, // GPT-4.1 opcional
      },
    },
  },
};

// Verificar se usuário atingiu limite
export const checkLimit = (userPlan, usage) => {
  const plan = plans[userPlan] || plans.free;

  const dailyRemaining = plan.limits.messagesPerDay - (usage.messagesToday || 0);
  const monthlyRemaining = plan.limits.messagesPerMonth - (usage.messagesThisMonth || 0);

  return {
    canSendMessage: dailyRemaining > 0 && monthlyRemaining > 0,
    dailyRemaining,
    monthlyRemaining,
    dailyLimit: plan.limits.messagesPerDay,
    monthlyLimit: plan.limits.messagesPerMonth,
    softLimitReached: dailyRemaining < 10 || monthlyRemaining < 50,
  };
};

// Mensagens de aviso
export const getLimitMessage = (limitStatus) => {
  if (!limitStatus.canSendMessage) {
    if (limitStatus.dailyRemaining <= 0) {
      return {
        type: "error",
        message:
          "Limite diário atingido. Você poderá enviar novas mensagens amanhã ou fazer upgrade do plano.",
        action: "upgrade",
      };
    }
    if (limitStatus.monthlyRemaining <= 0) {
      return {
        type: "error",
        message: "Limite mensal atingido. Faça upgrade para continuar usando.",
        action: "upgrade",
      };
    }
  }

  if (limitStatus.softLimitReached) {
    if (limitStatus.dailyRemaining < 10) {
      return {
        type: "warning",
        message: `Você tem apenas ${limitStatus.dailyRemaining} mensagens restantes hoje. Considere fazer upgrade.`,
        action: "info",
      };
    }
    if (limitStatus.monthlyRemaining < 50) {
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
  const plan = plans[userPlan] || plans.free;

  if (plan.limits.specialists === "all") {
    return true;
  }

  return plan.limits.specialists.includes(specialistId);
};

// Obter modelo de IA baseado no plano
export const getAIModel = (userPlan, messageType = "standard") => {
  const plan = plans[userPlan] || plans.free;

  // Premium pode escolher modelo avançado
  if (plan.limits.features.advancedModels && messageType === "advanced") {
    return "llama-70b"; // Modelo mais complexo para Premium
  }

  // Todos os outros usam Llama 8B (mais barato e rápido)
  return "llama-8b";
};

// Calcular custo estimado por mensagem
export const estimateMessageCost = (userPlan, tokens) => {
  const model = getAIModel(userPlan);

  const pricing = {
    "llama-8b": 0.00000005, // $0.05 / 1M tokens (very cheap)
    "llama-70b": 0.0000003, // $0.30 / 1M tokens
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
