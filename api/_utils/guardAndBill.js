// api/_utils/guardAndBill.js
import { capsByPlan } from "../../src/lib/planCaps.js";

/** ===== Armazenamento simples (em memória) =====
 * Em serverless reinicia às vezes. Para produção, troque por um storage
 * (Vercel KV/Upstash, Redis, Supabase, etc.). A lógica é plugável: basta
 * substituir readCounter/writeCounter pelo seu storage.
 */
const mem = globalThis.__USAGE_MEM__ || (globalThis.__USAGE_MEM__ = new Map());
async function readCounter(key) {
  return Number(mem.get(key) || 0);
}
async function writeCounter(key, value) {
  mem.set(key, String(value));
  return true;
}

/** Helpers de chave por dia/mês (UTC) */
function dayStampUTC() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
} // YYYYMMDD
function monthStampUTC() {
  return new Date().toISOString().slice(0, 7).replace(/-/g, "");
} // YYYYMM
const reqKey = (uid) => `reqs:${uid}:${dayStampUTC()}`;
const dayTokKey = (uid) => `toks:day:${uid}:${dayStampUTC()}`;
const monTokKey = (uid) => `toks:mon:${uid}:${monthStampUTC()}`;

function ensureCaps(planKey) {
  const caps = capsByPlan?.[planKey];
  if (!caps) throw new Error(`Plano inválido: ${planKey}`);
  return {
    dayReqs: Number(caps.limit_requests_per_day || 0),
    dayToks: Number(caps.limit_tokens_per_day || 0),
    monToks: Number(caps.limit_tokens_per_month || 0),
  };
}

/**
 * Checa limites e incrementa APENAS a contagem de requisições.
 * Retorna { bill(actualOutputTokens) } para registrar tokens APÓS o sucesso.
 *
 * @param {Object} p
 * @param {{id:string}} p.user
 * @param {string} p.plan
 * @param {string} [p.model]
 * @param {number} p.promptSize
 * @param {number} [p.expectedOutputSize=800]
 */
export default async function guardAndBill(p) {
  const { user, plan, model, promptSize, expectedOutputSize = 800 } = p || {};
  if (!user?.id) throw new Error("user.id obrigatório");
  if (!plan) throw new Error("plan obrigatório");
  const caps = ensureCaps(plan);

  // ========== 1) Requisições por dia ==========
  const rK = reqKey(user.id);
  const reqsToday = await readCounter(rK);
  if (caps.dayReqs && reqsToday + 1 > caps.dayReqs) {
    const left = Math.max(0, caps.dayReqs - reqsToday);
    throw new Error(
      `Limite de requisições/dia do plano ${plan} atingido. Restantes hoje: ${left}.`
    );
  }

  // ========== 2) Tokens por dia (checagem preventiva) ==========
  const dK = dayTokKey(user.id);
  const dayTokens = await readCounter(dK);
  const willSpend = Number(promptSize || 0) + Number(expectedOutputSize || 0);
  if (caps.dayToks && dayTokens + willSpend > caps.dayToks) {
    const left = Math.max(0, caps.dayToks - dayTokens);
    throw new Error(`Limite diário de tokens do plano ${plan} atingido. Restantes hoje: ${left}.`);
  }

  // ========== 3) Tokens por mês (checagem preventiva) ==========
  const mK = monTokKey(user.id);
  const monTokens = await readCounter(mK);
  if (caps.monToks && monTokens + willSpend > caps.monToks) {
    const left = Math.max(0, caps.monToks - monTokens);
    throw new Error(
      `Limite mensal de tokens do plano ${plan} atingido. Restantes no mês: ${left}.`
    );
  }

  // Aprovado: já contabiliza 1 requisição agora
  await writeCounter(rK, reqsToday + 1);

  // Retorna função para "faturar" tokens após sucesso
  return {
    ok: true,
    plan,
    model,
    usage_preview: {
      requests_today: reqsToday + 1,
      day_tokens_preview: dayTokens + willSpend,
      month_tokens_preview: monTokens + willSpend,
    },
    /**
     * Registra tokens reais após a resposta do modelo.
     * @param {number} actualOutputTokens - se não souber, usa expectedOutputSize
     */
    async bill(actualOutputTokens) {
      const out = Number(
        Number.isFinite(actualOutputTokens) ? actualOutputTokens : expectedOutputSize
      );
      const spend = Number(promptSize || 0) + out;
      const [curDay, curMon] = await Promise.all([readCounter(dK), readCounter(mK)]);
      await Promise.all([writeCounter(dK, curDay + spend), writeCounter(mK, curMon + spend)]);
      return { billed_tokens: spend };
    },
  };
}
