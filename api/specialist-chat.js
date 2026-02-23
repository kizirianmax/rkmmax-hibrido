/**
 * SPECIALIST CHAT ENDPOINT - Serginho Orchestrator (Multi-Orch v2.1.0)
 *
 * Delega a requisição para o especialista mais adequado via
 * serginho.delegateSpecialists().
 *
 * MIGRATED: from src/api/serginhoOrchestrator.js
 * NOW USES: api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)
 */
import serginho from "./lib/serginho-orchestrator.js";
import { specialists } from "../src/config/specialists.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { specialistId, message, sessionId, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ Delegate via serginho.delegateSpecialists() (Multi-Orch v2.1.0)
    // Se specialistId for fornecido, força o especialista específico;
    // caso contrário, o orquestrador seleciona automaticamente.
    let result;

    if (specialistId) {
      const specialist = specialists[specialistId];
      if (!specialist) {
        return res.status(404).json({ error: "Specialist not found" });
      }

      result = await serginho.handleRequest({
        message,
        messages,
        context: { specialistId: specialist.id },
        options: {
          systemPrompt: specialist.systemPrompt,
          sessionId: `specialist-${specialistId}-${sessionId || "default"}`,
        },
      });

      return res.status(200).json({
        ...result,
        specialist: {
          id: specialist.id,
          name: specialist.name,
          category: specialist.category,
        },
      });
    }

    // Auto-delegate: orquestrador escolhe o especialista
    result = await serginho.delegateSpecialists(message, specialists, {
      messages,
      sessionId: sessionId || "default",
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Specialist chat error:", error);

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
