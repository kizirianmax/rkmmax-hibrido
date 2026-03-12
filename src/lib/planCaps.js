// src/lib/planCaps.js
// ===== Planos e limites oficiais RKMMax =====
// Planos oficiais: basic | intermediate | premium | ultra | dev
// Plano "mid" removido — era legado; nome oficial é "intermediate".
// Plano "free" não existe — produto opera apenas com planos pagos.

export const PLAN = {
  BASIC:        "basic",
  INTERMEDIATE: "intermediate",
  PREMIUM:      "premium",
  ULTRA:        "ultra",
  DEV:          "dev",
};

/** Modelo "principal" por plano (para o seu modelPicker) */
export const MODEL_BY_PLAN = {
  [PLAN.BASIC]:        { model: "gpt-5-nano" },
  [PLAN.INTERMEDIATE]: { model: "gpt-4.1-mini" },
  [PLAN.PREMIUM]:      { model: "gpt-4.1-mini" }, // Premium usa mini no dia a dia; booster sob demanda
  [PLAN.ULTRA]:        { model: "gpt-4.1-mini" }, // Ultra usa o mesmo modelo mas sem hard limit
  [PLAN.DEV]:          { model: "gpt-5-nano" },   // Dev: ambiente de desenvolvimento, sem limite
};

/** Limites de consumo */
export const LIMITS = {
  [PLAN.BASIC]:        { tokensDaily:   275_000, tokensMonthly5:       0 },
  [PLAN.INTERMEDIATE]: { tokensDaily:   410_000, tokensMonthly5:       0 },
  [PLAN.PREMIUM]:      { tokensDaily: 1_200_000, tokensMonthly5: 710_000 },
  [PLAN.ULTRA]:        { tokensDaily:         0, tokensMonthly5:       0 }, // 0 = sem limite (hard_limit: false)
  [PLAN.DEV]:          { tokensDaily:         0, tokensMonthly5:       0 }, // sem limite
};

/** Recursos por plano (para UI/flags) */
export const FEATURES = {
  [PLAN.BASIC]: {
    allAgents: true,
    voice: false,
    personalization: true,
    multiAgents: 1,
  },
  [PLAN.INTERMEDIATE]: {
    allAgents: true,
    voice: true,
    personalization: true,
    multiAgents: 2,
  },
  [PLAN.PREMIUM]: {
    allAgents: true,
    voice: true,
    personalization: true,
    multiAgents: 3,
    hybrid: true,
  },
  [PLAN.ULTRA]: {
    allAgents: true,
    voice: true,
    personalization: true,
    multiAgents: 3,
    hybrid: true,
    compliance: true,
  },
  [PLAN.DEV]: {
    allAgents: true,
    voice: true,
    personalization: true,
    multiAgents: 3,
    hybrid: true,
  },
};

/** Rótulos para exibição */
export const PLAN_LABEL = {
  [PLAN.BASIC]:        "Básico",
  [PLAN.INTERMEDIATE]: "Intermediário",
  [PLAN.PREMIUM]:      "Premium",
  [PLAN.ULTRA]:        "Ultra",
  [PLAN.DEV]:          "Dev",
};

/**
 * === Objeto usado pelas funções serverless ===
 * O guardAndBill espera estas chaves:
 *   - limit_requests_per_day
 *   - limit_tokens_per_day
 *   - limit_tokens_per_month
 * Coloque 0 quando quiser "sem limite" naquele eixo.
 *
 * Planos cobertos: basic | intermediate | premium | ultra | dev
 * "mid" removido (legado). "free" não existe (produto pago).
 */
export const capsByPlan = {
  [PLAN.BASIC]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day:   LIMITS[PLAN.BASIC].tokensDaily,
    limit_tokens_per_month: 0,
  },
  [PLAN.INTERMEDIATE]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day:   LIMITS[PLAN.INTERMEDIATE].tokensDaily,
    limit_tokens_per_month: 0,
  },
  [PLAN.PREMIUM]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day:   LIMITS[PLAN.PREMIUM].tokensDaily,
    // Teto mensal de GPT-5 para plano Premium. Use 0 para remover o teto mensal.
    limit_tokens_per_month: LIMITS[PLAN.PREMIUM].tokensMonthly5,
  },
  [PLAN.ULTRA]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day:   0, // sem limite diário — hard_limit: false
    limit_tokens_per_month: 0,
  },
  [PLAN.DEV]: {
    limit_requests_per_day: 0,
    limit_tokens_per_day:   0, // sem limite — ambiente de desenvolvimento
    limit_tokens_per_month: 0,
  },
};

// Exporte dos dois jeitos para evitar erro de import
export default capsByPlan;
