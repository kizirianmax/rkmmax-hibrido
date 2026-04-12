/**
 * 🤖 ENDPOINT UNIFICADO DE IA - KIZI AI
 * 
 * Enterprise-grade AI API using Serginho Orchestrator
 * 
 * Features:
 * - Serginho Orchestrator for centralized provider management
 * - Circuit breaker protection
 * - 8s timeout protection
 * - Automatic fallback
 * - Standardized error handling
 * - Intelligent complexity-based routing
 */

import geniusPrompts from "../src/prompts/geniusPrompts.js";
import costOptimization from "../src/utils/costOptimization.js";
import { specialists } from "../src/config/specialists.js";
import serginho from "./lib/serginho-orchestrator.js";
import { trackSpecialistUsage } from "./lib/specialist-usage.js";
import { applyCorsRestricted } from "./lib/cors.js";
import { verifyAuth } from "./lib/auth.js";

const { buildGeniusPrompt } = geniusPrompts;
const { optimizeRequest, cacheResponse } = costOptimization;

/**
 * Execute AI task via Serginho Orchestrator
 * @param {Array} messages - Full messages array (last entry is the user message)
 * @param {string} systemPrompt - System prompt for this request
 * @param {object} [context={}] - Additional context (source, type, etc.)
 * @param {object} [options={}] - Orchestrator options (e.g. forceProvider)
 */
async function executeAITask(messages, systemPrompt, context = {}, options = {}) {
  // Extract the user's message from the last message
  const userMessage = messages[messages.length - 1]?.content || "";
  
  // Prepare conversation history (exclude the last message as it's passed separately)
  const conversationHistory = messages.slice(0, -1);
  
  // Add system prompt to context if provided
  if (systemPrompt) {
    context.systemPrompt = systemPrompt;
  }
  
  // Call Serginho Orchestrator
  const result = await serginho.handleRequest({
    message: userMessage,
    messages: conversationHistory,
    context,
    options,
  });
  
  return result;
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS restrito — substitui o antigo "*"
  if (applyCorsRestricted(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth guard — rejeitar requisições sem JWT válido
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    const statusMap = {
      missing_token: 401,
      invalid_token: 401,
      auth_unavailable: 503,
      auth_error: 503,
    };
    return res.status(statusMap[authError] || 401).json({
      error: authError === 'auth_unavailable' ? 'Service configuration error' : 'Unauthorized',
      message: authError === 'missing_token'
        ? 'Authentication required. Send Authorization: Bearer <token> header.'
        : authError === 'auth_unavailable'
        ? 'Authentication service is not configured. Contact administrator.'
        : 'Invalid or expired token. Please log in again.',
      code: authError,
    });
  }

  try {
    const {
      type = "genius",
      messages,
      agentType,
      specialistId,
      forceProvider,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: "Bad request",
        message: "Messages array is required" 
      });
    }

    console.log(`🤖 KIZI AI - Type: ${type}`);

    // ========================================
    // TIPO: HYBRID (Construtor)
    // ========================================
    if (type === "hybrid" || (type === "genius" && agentType === "hybrid")) {
      console.log("🏗️ KIZI AI - Híbrido/Construtor ativado");
      const systemPrompt = buildGeniusPrompt("hybrid");
      const optimized = optimizeRequest(messages, systemPrompt);

      if (optimized.cached) {
        console.log("💰 CACHE HIT!");
        return res.status(200).json({
          ...optimized.response,
          cached: true,
          type: "hybrid",
        });
      }

      let result;
      let hybridFallbackUsed = false;
      let fallbackReason = null;
      let primaryProviderError = null;

      if (forceProvider && forceProvider !== 'auto') {
        // Teste controlado: motor forçado manualmente pelo usuário
        console.log(`🏗️ HYBRID: Motor forçado manualmente → ${forceProvider}`);
        try {
          result = await executeAITask(
            optimized.messages,
            optimized.systemPrompt,
            { source: 'hybrid-api', type: 'hybrid', manualEngine: forceProvider },
            { forceProvider, noFallback: true, maxTokens: 4096 }
          );
        } catch (errManual) {
          throw new Error(`Manual engine "${forceProvider}" failed: ${errManual.message || 'unknown error'}`);
        }
      } else {
        // Híbrido: fluxo estrito 120B → 70B apenas. Nenhum outro fallback permitido.
        try {
          result = await executeAITask(
            optimized.messages,
            optimized.systemPrompt,
            { source: 'hybrid-api', type: 'hybrid' },
            { forceProvider: 'llama-120b', noFallback: true, maxTokens: 4096 }
          );
        } catch (err120b) {
          // 120B indisponível — tentativa única com 70B (proibido qualquer outro fallback)
          hybridFallbackUsed = true;
          primaryProviderError = err120b.message;
          fallbackReason = err120b.message?.includes('Timeout') ? 'timeout'
            : err120b.message?.includes('Circuit breaker') ? 'circuit_breaker_open'
            : err120b.message?.includes('429') ? 'rate_limit'
            : err120b.message?.includes('503') ? 'service_unavailable'
            : 'provider_error';
          console.log('🏗️ HYBRID: 120B falhou → tentando 70B (único fallback permitido)', { reason: fallbackReason, error: err120b.message });
          try {
            result = await executeAITask(
              optimized.messages,
              optimized.systemPrompt,
              { source: 'hybrid-api', type: 'hybrid' },
              { forceProvider: 'llama-70b', noFallback: true, maxTokens: 4096 }
            );
          } catch (err70b) {
            throw new Error(`All providers failed. Tried: llama-120b, llama-70b. ${err70b.message}`);
          }
        }
      }

      const response = {
        response: result.text,
        model: result.model,
        provider: result.provider,
        tier: result.tier,
        complexity: result.complexity,
        routing: result.routing,
        execution: {
          ...(result.execution || {}),
          // Sobrescreve fallbackLevel para refletir o fallback explícito do Híbrido
          fallbackLevel: (hybridFallbackUsed ? 1 : 0) + (result.execution?.fallbackLevel || 0),
          status: hybridFallbackUsed ? 'fallback' : (result.execution?.status || 'success'),
          fallbackReason: hybridFallbackUsed ? fallbackReason : null,
          primaryProviderError: hybridFallbackUsed ? primaryProviderError : null,
          ...(forceProvider && forceProvider !== 'auto' ? { manualEngine: forceProvider } : {}),
        },
        type: "hybrid",
        metadata: {
          provider: result.provider,
          tier: result.tier,
          complexity: result.complexity,
        },
        success: true,
        usage: result.usage,
      };

      cacheResponse(messages, response);

      return res.status(200).json({
        ...response,
        cached: false,
        optimized: true,
        stats: optimized.stats,
      });
    }

    // ========================================
    // TIPO: GENIUS (Serginho)
    // ========================================
    if (type === "genius" || type === "chat" || type === "intelligent") {
      const promptType = agentType || "serginho";
      const systemPrompt = buildGeniusPrompt(promptType);
      const optimized = optimizeRequest(messages, systemPrompt);

      // Verificar cache
      if (optimized.cached) {
        console.log("💰 CACHE HIT!");
        return res.status(200).json({
          ...optimized.response,
          cached: true,
          type: promptType,
        });
      }

      // Execute via Serginho Orchestrator
      // forceProvider is optional — when absent, auto-routing applies (Groq-only).
      // When present, the orchestrator's A5.7 guard validates the provider is enabled.
      const orchOptions = {};
      if (forceProvider) {
        orchOptions.forceProvider = forceProvider;
      }
      const result = await executeAITask(
        optimized.messages,
        optimized.systemPrompt,
        { source: 'ai-api', type: promptType },
        orchOptions
      );

      const response = {
        response: result.text,
        model: result.model,
        provider: result.provider,
        tier: result.tier,
        complexity: result.complexity,
        routing: result.routing,
        execution: result.execution,
        type: promptType,
        metadata: {
          provider: result.provider,
          tier: result.tier,
          complexity: result.complexity,
        },
        success: true,
        usage: result.usage,
      };

      cacheResponse(messages, response);

      return res.status(200).json({
        ...response,
        cached: false,
        optimized: true,
        stats: optimized.stats,
      });
    }

    // ========================================
    // TIPO: SPECIALIST
    // ========================================
    if (type === "specialist") {
      if (!specialistId) {
        return res.status(400).json({ error: "specialistId required" });
      }

      const specialist = specialists[specialistId];
      if (!specialist) {
        return res.status(404).json({ error: "Specialist not found" });
      }

      const systemPrompt = buildGeniusPrompt("specialist", {
        name: specialist.name,
        description: specialist.description,
        category: specialist.category,
        systemPrompt: specialist.systemPrompt,
      });

      const optimized = optimizeRequest(messages, systemPrompt);

      if (optimized.cached) {
        console.log("💰 CACHE HIT!");
        const cachedResp = {
          response: optimized.response.response,
          model: optimized.response.model,
          success: optimized.response.success ?? true,
          cached: true,
          specialist: specialist.name,
        };
        return res.status(200).json(cachedResp);
      }

      // Execute via Serginho Orchestrator
      const result = await executeAITask(
        optimized.messages,
        optimized.systemPrompt,
        { source: 'specialist-api', specialistId }
      );

      const response = {
        response: result.text,
        model: result.model,
        provider: result.provider,
        tier: result.tier,
        complexity: result.complexity,
        specialist: specialist.name,
        metadata: {
          provider: result.provider,
          tier: result.tier,
          complexity: result.complexity,
        },
        success: true,
        usage: result.usage,
      };

      cacheResponse(messages, response);

      trackSpecialistUsage(specialistId, {
        model: result.model ?? null,
        provider: result.provider ?? null,
        cached: false,
        source: "ai-api",
      });

      return res.status(200).json({
        ...response,
        cached: false,
        optimized: true,
        stats: optimized.stats,
      });
    }

    // ========================================
    // TIPO: TRANSCRIBE
    // ========================================
    if (type === "transcribe") {
      return res.status(501).json({
        error: "Transcription not implemented in this endpoint",
        hint: "Use /api/transcribe endpoint instead",
      });
    }

    return res.status(400).json({
      error: "Invalid type",
      hint: "Use type: genius, specialist, or transcribe",
    });
  } catch (error) {
    console.error("❌ KIZI AI error:", error);

    // Provider not available (e.g., GEMINI_API_KEY not configured)
    if (error.message && error.message.includes('is not available:')) {
      return res.status(503).json({
        error: 'Provider not available',
        message: error.message,
      });
    }

    // Circuit breaker error
    if (error.message && error.message.includes('Circuit breaker')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'AI service is temporarily unavailable. Please try again in a moment.',
        retryAfter: 60,
      });
    }

    // Timeout error
    if (error.message && error.message.includes('Timeout')) {
      return res.status(504).json({
        error: 'Gateway timeout',
        message: 'Request took too long. Please try a simpler query or try again.',
        maxTimeout: 8000,
      });
    }

    // All providers failed
    if (error.message && error.message.includes('All providers failed')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'All AI providers are currently unavailable. Please try again later.',
      });
    }

    // Token/payload limit exceeded
    if (error.message && (
      error.message.includes('maximum context length') ||
      error.message.includes('too many tokens') ||
      error.message.includes('Request too large') ||
      error.message.includes('context_length_exceeded') ||
      error.message.includes('413')
    )) {
      return res.status(413).json({
        error: 'Payload too large',
        message: 'A conversa ficou longa demais para este motor. Limpe o histórico ou use um motor com janela maior.',
      });
    }

    // Manual engine failed (from the try/catch above)
    if (error.message && error.message.includes('Manual engine')) {
      return res.status(502).json({
        error: 'Engine unavailable',
        message: error.message,
        hint: 'Tente outro motor ou volte para o modo Padrão (auto).',
      });
    }

    // Generic error
    return res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
