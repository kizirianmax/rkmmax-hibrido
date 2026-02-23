/**
 * CHAT ENDPOINT - Serginho Orchestrator (Multi-Orch v2.1.0)
 *
 * Enterprise-grade chat API using Serginho Orchestrator
 *
 * Features:
 * - Serginho Orchestrator for centralized provider management
 * - Circuit breaker protection
 * - 8s timeout protection
 * - Automatic fallback
 * - Standardized error handling
 * - Genius prompts for maximum quality
 *
 * MIGRATED: from src/api/serginhoOrchestrator.js (SerginhoContextual v2.0)
 * NOW USES: api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)
 */
import serginho from "./lib/serginho-orchestrator.js";
import geniusPrompts from "../src/prompts/geniusPrompts.js";

const { buildGeniusPrompt } = geniusPrompts;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, sessionId, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Build genius system prompt (Serginho identity)
    let systemPrompt;
    try {
      systemPrompt = buildGeniusPrompt("serginho");
    } catch {
      systemPrompt = `Você é o SERGINHO, um agente do KIZI 2.5 Pro, a IA mais avançada do sistema RKMMAX.`;
    }

    // ✅ ALL requests flow through Serginho Orchestrator v2.1.0
    const result = await serginho.handleRequest({
      message,
      messages,
      context: { systemPrompt, sessionId: sessionId || "default" },
      options: {},
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Chat error:", error);

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
