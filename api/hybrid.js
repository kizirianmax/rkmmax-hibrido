/**
 * HYBRID ENDPOINT - Serginho Orchestrator (Multi-Orch v2.1.0)
 *
 * Betinho Hybrid Mode: executa múltiplos providers em paralelo
 * e retorna o primeiro que responder com sucesso.
 *
 * MIGRATED: from src/api/serginhoOrchestrator.js (betinhoParallel)
 * NOW USES: api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)
 */
import serginho from "./lib/serginho-orchestrator.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, sessionId, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ Betinho Hybrid Mode: parallel execution via serginho.betinhoParallel()
    const result = await serginho.betinhoParallel(message, {
      messages,
      sessionId: sessionId || "hybrid-session",
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Hybrid error:", error);

    // Circuit breaker error
    if (error.message && error.message.includes("Circuit breaker")) {
      return res.status(503).json({
        error: "Service unavailable",
        message: "AI service is temporarily unavailable. Please try again in a moment.",
        retryAfter: 60,
      });
    }

    // Timeout error
    if (error.message && error.message.includes("Timeout")) {
      return res.status(504).json({
        error: "Gateway timeout",
        message: "Request took too long. Please try a simpler query or try again.",
        maxTimeout: 8000,
      });
    }

    // All providers failed
    if (error.message && error.message.includes("All providers failed")) {
      return res.status(503).json({
        error: "Service unavailable",
        message: "All AI providers are currently unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
    });
  }
}
