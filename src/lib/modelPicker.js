// src/lib/modelPicker.js
import { PLAN, MODEL_BY_PLAN } from "./planCaps.js";

/**
 * pickModel(plan, context)
 * - Premium: se ainda houver saldo de GPT-5 no mês E a tarefa for "avançada", use gpt-5.
 * - Caso contrário, use o modelo principal do plano (mini).
 * Obs: você pode plugar aqui seu detector de complexidade.
 */
export function pickModel(plan, { advanced = false, gpt5QuotaLeft = 0 } = {}) {
  if (plan === PLAN.PREMIUM && advanced && gpt5QuotaLeft > 0) {
    return "gpt-5"; // Standard
  }
  return MODEL_BY_PLAN[plan]?.model || MODEL_BY_PLAN[PLAN.BASIC].model;
}
