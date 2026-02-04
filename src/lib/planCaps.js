// src/lib/planCaps.js
// ===== Planos e limites oficiais RKMMax =====

export const PLAN = { BASIC: "basic", MID: "mid", PREMIUM: "premium" };

/** Modelo “principal” por plano (para o seu modelPicker) */
export const MODEL_BY_PLAN = {
  [PLAN.BASIC]: { model: "gpt-5-nano" },
  [PLAN.MID]: { model: "gpt-4.1-mini" },
  [PLAN.PREMIUM]: { model: "gpt-4.1-mini" }, // Premium usa mini no dia a dia; booster sob demanda
};

/** Limites de consumo */
export const LIMITS = {
  [PLAN.BASIC]: { tokensDaily: 275_000, tokensMonthly5: 0 },
  [PLAN.MID]: { tokensDaily: 410_000, tokensMonthly5: 0 },
  [PLAN.PREMIUM]: { tokensDaily: 1_200_000, tokensMonthly5: 710_000 },
};

/** Recursos por plano (para UI/flags) */
export const FEATURES = {
  [PLAN.BASIC]: { allAgents: true, voice: false, personalization: true, multiAgents: 1 },
  [PLAN.MID]: { allAgents: true, voice: true, personalization: true, multiAgents: 2 },
  [PLAN.PREMIUM]: {
    allAgents: true,
    voice: true,
    personalization: true,
    multiAgents: 3,
    hybrid: true,
  },
};

/** Rótulos para exibição */
export const PLAN_LABEL = {
  [PLAN.BASIC]: "Básico",
  [PLAN.MID]: "Intermediário",
  [PLAN.PREMIUM]: "Premium",
};

/**
 * === Objeto usado pelas funções serverless ===
 * O guardAndBill espera estas chaves:
 *   - limit_requests_per_day
 *   - limit_tokens_per_day
 *   - limit_tokens_per_month
 * Coloque 0 quando quiser “sem limite” naquele eixo.
 */
export const capsByPlan = {
  [PLAN.BASIC]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day: LIMITS[PLAN.BASIC].tokensDaily,
    limit_tokens_per_month: 0,
  },
  [PLAN.MID]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day: LIMITS[PLAN.MID].tokensDaily,
    limit_tokens_per_month: 0,
  },
  [PLAN.PREMIUM]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day: LIMITS[PLAN.PREMIUM].tokensDaily,
    // Aqui usamos o acumulativo mensal para GPT-5 como “teto mensal geral”.
    // Se não quiser teto mensal, deixe 0.
    limit_tokens_per_month: LIMITS[PLAN.PREMIUM].tokensMonthly5,
  },
};

// Exporte dos dois jeitos para evitar erro de import
export default capsByPlan;
