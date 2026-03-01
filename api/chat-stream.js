/**
 * 🌊 STREAMING SSE ENDPOINT - Server-Sent Events
 *
 * Fix: SSE timeout race condition (CodeRabbit PR #95)
 * - AbortController cancela trabalho in-flight no timeout
 * - Guards res.writableEnded previnem write-after-end
 * - Timeout limpo em todos os caminhos (sucesso, erro, abort)
 */
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
}
