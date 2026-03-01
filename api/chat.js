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
 * - SSE streaming mode via ?mode=stream or /api/chat-stream path
 *
 * MIGRATED: from src/api/serginhoOrchestrator.js (SerginhoContextual v2.0)
 * NOW USES: api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)
 */
import serginho from "./lib/serginho-orchestrator.js";
import geniusPrompts from "../src/prompts/geniusPrompts.js";
import { orchestrateEngines } from "./lib/engine-orchestrator.js";

const { buildGeniusPrompt } = geniusPrompts;

/**
 * Escreve no SSE apenas se a conexão ainda estiver aberta.
 */
function safeWrite(res, data) {
  if (!res.writableEnded && !res.finished) {
    res.write(data);
  }
}

/**
 * Stream tokens de resposta via SSE
 */
async function streamResponse(res, messages, systemPrompt, options) {
  const startTime = Date.now();
  const controller = new AbortController();
  let timeoutHandle = null;

  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    safeWrite(res, "event: start\n");
    safeWrite(
      res,
      `data: ${JSON.stringify({ status: "processing", timestamp: Date.now() })}\n\n`
    );

    // Timeout: aborta trabalho in-flight e fecha conexão com guard
    timeoutHandle = setTimeout(() => {
      controller.abort();
      safeWrite(res, "event: timeout\n");
      safeWrite(
        res,
        `data: ${JSON.stringify({
          error: "Request timeout",
          duration: Date.now() - startTime,
        })}\n\n`
      );
      if (!res.writableEnded && !res.finished) {
        res.end();
      }
    }, 11000);

    // Passa signal para o orquestrador poder cancelar fetches in-flight
    const result = await orchestrateEngines(messages, systemPrompt, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutHandle);
    timeoutHandle = null;

    if (res.writableEnded || res.finished) return;

    const response = result.response;
    const chunkSize = 50;

    for (let i = 0; i < response.length; i += chunkSize) {
      if (controller.signal.aborted || res.writableEnded || res.finished) break;

      const chunk = response.slice(i, i + chunkSize);
      safeWrite(res, "event: chunk\n");
      safeWrite(res, `data: ${JSON.stringify({ text: chunk })}\n\n`);

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    safeWrite(res, "event: complete\n");
    safeWrite(
      res,
      `data: ${JSON.stringify({
        model: result.model,
        cached: result.cached,
        duration: Date.now() - startTime,
        success: true,
      })}\n\n`
    );

    if (!res.writableEnded && !res.finished) {
      res.end();
    }
  } catch (error) {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }

    // Abort é esperado quando o timeout dispara — conexão já foi fechada
    if (error.name === "AbortError") return;

    console.error("❌ Streaming error:", error);

    safeWrite(res, "event: error\n");
    safeWrite(
      res,
      `data: ${JSON.stringify({
        error: error.message,
        duration: Date.now() - startTime,
      })}\n\n`
    );

    if (!res.writableEnded && !res.finished) {
      res.end();
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Route to SSE streaming mode when ?mode=stream query param is present
  const isStream = req.query?.mode === "stream";

  if (isStream) {
    try {
      const {
        type = "genius",
        messages,
        agentType,
        complexity = "speed",
      } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;

      if (!geminiKey && !groqKey) {
        return res.status(500).json({
          error: "No AI providers configured",
          hint: "Configure GEMINI_API_KEY or GROQ_API_KEY",
        });
      }

      const promptType = agentType || "serginho";
      const systemPrompt = buildGeniusPrompt(promptType);

      console.warn(
        `🌊 Starting SSE stream - Type: ${type} | Complexity: ${complexity}`
      );

      await streamResponse(res, messages, systemPrompt, {
        geminiKey,
        groqKey,
        complexity,
        useParallel: true,
      });
    } catch (error) {
      console.error("❌ Stream handler error:", error);

      if (res.headersSent) {
        safeWrite(res, "event: error\n");
        safeWrite(res, `data: ${JSON.stringify({ error: error.message })}\n\n`);
        if (!res.writableEnded && !res.finished) {
          res.end();
        }
      } else {
        return res.status(500).json({
          error: "Internal server error",
          message: error.message,
        });
      }
    }
    return;
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
