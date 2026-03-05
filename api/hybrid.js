/**
 * HYBRID ENDPOINT — Groq-only, openai/gpt-oss-120b enforced
 *
 * Single-provider mode: usa APENAS openai/gpt-oss-120b via Groq.
 * Se falhar → 503 (sem fallback para outro modelo).
 *
 * Logs obrigatórios em toda request:
 *   [HYBRID] provider=groq model=openai/gpt-oss-120b groqOnly=true route=/api/hybrid
 */
import serginho from "./lib/serginho-orchestrator.js";

const HYBRID_PROVIDER = "llama-120b";
const HYBRID_MODEL = "openai/gpt-oss-120b";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const start = Date.now();

  try {
    const { message, sessionId, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ── Groq-only guard ──────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error("[HYBRID] GROQ_API_KEY not configured — returning 503");
      return res.status(503).json({
        error: "Service unavailable",
        message: "GROQ_API_KEY is not configured. Hybrid mode requires Groq.",
      });
    }

    // ── Structured log: request start ────────────────────────────────
    console.log(
      `[HYBRID] provider=groq model=${HYBRID_MODEL} groqOnly=true route=/api/hybrid`
    );

    // ── Single-provider call: forceProvider → llama-120b (= openai/gpt-oss-120b) ──
    const result = await serginho.handleRequest({
      message,
      messages,
      context: {},
      options: { forceProvider: HYBRID_PROVIDER },
    });

    const latency = Date.now() - start;
    console.log(
      `[HYBRID] success provider=groq model=${HYBRID_MODEL} latency=${latency}ms`
    );

    return res.status(200).json(result);
  } catch (error) {
    const latency = Date.now() - start;

    // ── Structured error log ─────────────────────────────────────────
    console.error("[HYBRID] Groq error:", {
      status: error.status || error.statusCode || "unknown",
      message: error.message,
      model: HYBRID_MODEL,
      latency: `${latency}ms`,
    });

    // Circuit breaker open
    if (error.message && error.message.includes("Circuit breaker")) {
      return res.status(503).json({
        error: "Service unavailable",
        message:
          "AI service is temporarily unavailable (circuit breaker open). Try again in 60s.",
        retryAfter: 60,
      });
    }

    // Timeout
    if (error.message && error.message.includes("Timeout")) {
      return res.status(504).json({
        error: "Gateway timeout",
        message: "Request took too long. Try a simpler query or try again.",
        maxTimeout: 8000,
      });
    }

    // Any other Groq failure → 503, NO fallback
    return res.status(503).json({
      error: "Service unavailable",
      message:
        `Groq ${HYBRID_MODEL} failed. No fallback available. Try again later.`,
    });
  }
}
