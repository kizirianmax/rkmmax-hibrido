/**
 * specialist-usage.js
 * Fase 2C — Tracking mínimo de uso de especialistas
 *
 * Registra uso via console.log estruturado (capturado pelo Vercel Runtime Logs).
 * Completamente reversível: remover a chamada em ai.js e specialist-chat.js
 * é suficiente para desativar o tracking sem nenhum outro efeito.
 *
 * NUNCA lança exceção — o try/catch interno garante que o fluxo principal
 * nunca seja afetado por falha no tracking.
 */

/**
 * Registra o uso de um especialista após execução bem-sucedida.
 *
 * @param {string} specialistId - ID do especialista (ex: "code", "mentor")
 * @param {object} [meta={}]
 * @param {string|null} [meta.model] - Modelo de IA utilizado
 * @param {string|null} [meta.provider] - Provider utilizado (ex: "google", "openai")
 * @param {boolean} [meta.cached] - Se a resposta veio do cache
 * @param {string} [meta.source] - Endpoint de origem ("ai-api" | "specialist-chat")
 */
export function trackSpecialistUsage(specialistId, meta = {}) {
  try {
    const entry = {
      event: "specialist_used",
      specialistId,
      timestamp: new Date().toISOString(),
      model: meta.model ?? null,
      provider: meta.provider ?? null,
      cached: meta.cached ?? false,
      source: meta.source ?? null,
    };
    console.log(`[USAGE] ${JSON.stringify(entry)}`);
  } catch (_) {
    // Absorve qualquer erro silenciosamente — nunca quebra o fluxo principal
  }
}
