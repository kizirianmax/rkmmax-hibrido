/**
 * API Fallback Service
 * Gerencia fallback automático de tier FREE para PAGO
 * quando os limites gratuitos são atingidos
 */

// Configuração de APIs e seus limites FREE
const API_CONFIG = {
  groq: {
    freeLimitPerDay: 14400, // requisições/dia
    freeApiKey: process.env.REACT_APP_GROQ_API_KEY_FREE || process.env.REACT_APP_GROQ_API_KEY,
    paidApiKey: process.env.REACT_APP_GROQ_API_KEY_PAID || process.env.REACT_APP_GROQ_API_KEY,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  gemini: {
    freeLimitPerDay: 1500, // requisições/dia
    freeApiKey: process.env.REACT_APP_GEMINI_API_KEY_FREE || process.env.REACT_APP_GEMINI_API_KEY,
    paidApiKey: process.env.REACT_APP_GEMINI_API_KEY_PAID || process.env.REACT_APP_GEMINI_API_KEY,
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  },
  claude: {
    freeLimitPerDay: 0, // Claude não tem tier free
    freeApiKey: null,
    paidApiKey: process.env.REACT_APP_CLAUDE_API_KEY,
    endpoint: "https://api.anthropic.com/v1/messages",
  },
};

// Contador de uso (em memória - resetado diariamente)
let usageCounter = {
  groq: { free: 0, paid: 0, lastReset: new Date().toDateString() },
  gemini: { free: 0, paid: 0, lastReset: new Date().toDateString() },
  claude: { free: 0, paid: 0, lastReset: new Date().toDateString() },
};

/**
 * Reseta contadores se for um novo dia
 */
function resetCountersIfNewDay() {
  const today = new Date().toDateString();

  Object.keys(usageCounter).forEach((api) => {
    if (usageCounter[api].lastReset !== today) {
      usageCounter[api] = { free: 0, paid: 0, lastReset: today };
      console.log(`[Fallback] Contador ${api} resetado para novo dia`);
    }
  });
}

/**
 * Verifica se deve usar tier FREE ou PAGO
 */
function shouldUseFree(apiName) {
  resetCountersIfNewDay();

  const config = API_CONFIG[apiName];
  const usage = usageCounter[apiName];

  // Claude não tem tier free
  if (apiName === "claude") return false;

  // Se ainda não atingiu o limite FREE, usa FREE
  return usage.free < config.freeLimitPerDay;
}

/**
 * Incrementa contador de uso
 */
function incrementUsage(apiName, tier) {
  resetCountersIfNewDay();
  usageCounter[apiName][tier]++;
}

/**
 * Retorna estatísticas de uso
 */
export function getUsageStats() {
  resetCountersIfNewDay();

  return {
    groq: {
      free: usageCounter.groq.free,
      paid: usageCounter.groq.paid,
      freeLimit: API_CONFIG.groq.freeLimitPerDay,
      percentUsed: ((usageCounter.groq.free / API_CONFIG.groq.freeLimitPerDay) * 100).toFixed(1),
    },
    gemini: {
      free: usageCounter.gemini.free,
      paid: usageCounter.gemini.paid,
      freeLimit: API_CONFIG.gemini.freeLimitPerDay,
      percentUsed: ((usageCounter.gemini.free / API_CONFIG.gemini.freeLimitPerDay) * 100).toFixed(
        1
      ),
    },
    claude: {
      free: 0,
      paid: usageCounter.claude.paid,
      freeLimit: 0,
      percentUsed: 0,
    },
    lastReset: usageCounter.groq.lastReset,
  };
}

/**
 * Faz requisição com fallback automático FREE → PAGO
 */
export async function requestWithFallback(apiName, requestData) {
  const config = API_CONFIG[apiName];

  if (!config) {
    throw new Error(`API ${apiName} não configurada`);
  }

  // Decide qual tier usar
  const useFree = shouldUseFree(apiName);
  const apiKey = useFree ? config.freeApiKey : config.paidApiKey;
  const tier = useFree ? "free" : "paid";

  console.log(`[Fallback] ${apiName} usando tier ${tier.toUpperCase()}`);

  try {
    // Tenta fazer a requisição
    const response = await makeRequest(apiName, apiKey, requestData);

    // Sucesso! Incrementa contador
    incrementUsage(apiName, tier);

    return {
      success: true,
      data: response,
      tier,
      usageStats: getUsageStats(),
    };
  } catch (error) {
    // Se falhou no tier FREE por limite (429), tenta PAGO
    if (useFree && (error.status === 429 || error.code === "RESOURCE_EXHAUSTED")) {
      console.warn(`[Fallback] ${apiName} tier FREE esgotado, tentando tier PAGO...`);

      const paidApiKey = config.paidApiKey;

      try {
        const response = await makeRequest(apiName, paidApiKey, requestData);

        // Sucesso no tier PAGO! Incrementa contador
        incrementUsage(apiName, "paid");

        return {
          success: true,
          data: response,
          tier: "paid",
          fallback: true, // Indica que houve fallback
          usageStats: getUsageStats(),
        };
      } catch (paidError) {
        console.error(`[Fallback] ${apiName} tier PAGO também falhou:`, paidError);
        throw paidError;
      }
    }

    // Erro não relacionado a limite, propaga
    throw error;
  }
}

/**
 * Faz a requisição HTTP para a API
 */
async function makeRequest(apiName, apiKey, requestData) {
  const config = API_CONFIG[apiName];

  if (apiName === "groq") {
    return await makeGroqRequest(config.endpoint, apiKey, requestData);
  } else if (apiName === "gemini") {
    return await makeGeminiRequest(config.endpoint, apiKey, requestData);
  } else if (apiName === "claude") {
    return await makeClaudeRequest(config.endpoint, apiKey, requestData);
  }

  throw new Error(`API ${apiName} não implementada`);
}

/**
 * Requisição para Groq API
 */
async function makeGroqRequest(endpoint, apiKey, requestData) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.error?.message || "Groq API error");
    err.status = response.status;
    throw err;
  }

  return await response.json();
}

/**
 * Requisição para Gemini API
 */
async function makeGeminiRequest(endpoint, apiKey, requestData) {
  const url = `${endpoint}?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.error?.message || "Gemini API error");
    err.code = error.error?.code;
    throw err;
  }

  return await response.json();
}

/**
 * Requisição para Claude API
 */
async function makeClaudeRequest(endpoint, apiKey, requestData) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.error?.message || "Claude API error");
    err.status = response.status;
    throw err;
  }

  return await response.json();
}

const apiFallback = {
  requestWithFallback,
  getUsageStats,
};

export default apiFallback;
