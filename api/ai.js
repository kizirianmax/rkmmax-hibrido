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

const { buildGeniusPrompt } = geniusPrompts;
const { optimizeRequest, cacheResponse } = costOptimization;

/**
 * Execute AI task via Serginho Orchestrator
 */
async function executeAITask(messages, systemPrompt, context = {}) {
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
    options: {},
  });
  
  return result;
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      type = "genius",
      messages,
      agentType,
      specialistId,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: "Bad request",
        message: "Messages array is required" 
      });
    }

    console.log(`🤖 KIZI AI - Type: ${type}`);

    // ========================================
    // TIPO: GENIUS (Serginho + Híbrido)
    // ========================================
    if (type === "genius" || type === "chat" || type === "intelligent" || type === "hybrid") {
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
      const result = await executeAITask(
        optimized.messages,
        optimized.systemPrompt,
        { source: 'ai-api', type: promptType }
      );

      const response = {
        response: result.text,
        model: result.model,
        provider: result.provider,
        tier: result.tier,
        complexity: result.complexity,
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
        return res.status(200).json({
          ...optimized.response,
          cached: true,
          specialist: specialist.name,
        });
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
