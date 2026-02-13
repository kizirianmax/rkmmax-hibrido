/**
 * 🤖 ENDPOINT UNIFICADO DE IA - KIZI AI
 *
 * Sistema 100% Groq com 3 modelos em cascata:
 * - KIZI Primary (openai/gpt-oss-120b) = Raciocínio principal
 * - KIZI Speed (llama-3.3-70b-versatile) = Fallback rápido
 * - KIZI Long (mixtral-8x7b-32768) = Fallback para contextos longos
 *
 * O sistema tenta PRIMARY primeiro, se falhar usa fallbacks automaticamente.
 */

import geniusPrompts from "../src/prompts/geniusPrompts.js";
import costOptimization from "../src/utils/costOptimization.js";
import { specialists } from "../src/config/specialists.js";

const { buildGeniusPrompt } = geniusPrompts;
const { optimizeRequest, cacheResponse } = costOptimization;

/**
 * Analisar complexidade da mensagem para escolher o modelo Groq ideal
 */
function analyzeComplexity(messages) {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const messageLength = lastMessage.length;
  const conversationLength = messages.length;

  // Indicadores de contexto longo que precisam do Mixtral
  const longContextIndicators = [
    messageLength > 2000,
    conversationLength > 15,
  ];

  if (longContextIndicators.some(indicator => indicator)) {
    return "long"; // Mixtral para contextos longos
  }

  // Por padrão, usa o modelo primary (openai/gpt-oss-120b)
  return "primary";
}

/**
 * Chamar KIZI Primary (Groq openai/gpt-oss-120b - modelo principal)
 */
async function callKiziPrimary(messages, systemPrompt, apiKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KIZI Primary error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Chamar KIZI Speed (Groq llama-3.3-70b-versatile - fallback rápido)
 */
async function callKiziSpeed(messages, systemPrompt, apiKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KIZI Speed error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Chamar KIZI Long (Groq mixtral-8x7b-32768 - para contextos longos)
 */
async function callKiziLong(messages, systemPrompt, apiKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages,
      temperature: 0.7,
      max_tokens: 28000, // Set to 28000 to account for input tokens and avoid API errors
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`KIZI Long error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Chamar o modelo KIZI apropriado com fallback automático
 * Todos os modelos são Groq - sem dependência de Gemini
 */
async function callKizi(messages, systemPrompt, complexity, groqKey) {
  // Ordem de tentativa baseada na complexidade
  let attempts = [];

  switch (complexity) {
    case "long":
      // Para contextos longos, tenta Mixtral primeiro
      attempts = [
        {
          name: "kizi-long",
          fn: () => callKiziLong(messages, systemPrompt, groqKey),
        },
        {
          name: "kizi-primary",
          fn: () => callKiziPrimary(messages, systemPrompt, groqKey),
        },
        {
          name: "kizi-speed",
          fn: () => callKiziSpeed(messages, systemPrompt, groqKey),
        },
      ];
      break;
    case "primary":
    default:
      // Padrão: tenta Primary primeiro, depois Speed, depois Long
      attempts = [
        {
          name: "kizi-primary",
          fn: () => callKiziPrimary(messages, systemPrompt, groqKey),
        },
        {
          name: "kizi-speed",
          fn: () => callKiziSpeed(messages, systemPrompt, groqKey),
        },
        {
          name: "kizi-long",
          fn: () => callKiziLong(messages, systemPrompt, groqKey),
        },
      ];
      break;
  }

  // Tentar cada modelo em ordem
  for (const attempt of attempts) {
    try {
      console.log(`🤖 Tentando ${attempt.name}...`);
      const response = await attempt.fn();
      console.log(`✅ ${attempt.name} respondeu com sucesso`);
      return { response, model: attempt.name };
    } catch (error) {
      console.error(`❌ ${attempt.name} falhou:`, error.message);
    }
  }

  throw new Error("Todos os modelos KIZI falharam");
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
      forceModel, // Opcional: forçar um modelo específico ('primary', 'speed', 'long')
    } = req.body;

    // ✅ VERIFICAR APENAS GROQ
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error("❌ GROQ_API_KEY not configured");
      return res.status(500).json({
        error: "GROQ_API_KEY not configured",
        hint: "Add GROQ_API_KEY to your Vercel environment variables",
      });
    }

    // Analisar complexidade automaticamente ou usar modelo forçado
    const complexity = forceModel || analyzeComplexity(messages);
    console.log(`🤖 KIZI AI - Type: ${type} | Complexity: ${complexity}`);

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

      // Chamar KIZI com seleção automática (100% Groq)
      const { response, model } = await callKizi(
        optimized.messages,
        optimized.systemPrompt,
        complexity,
        groqKey
      );

      const result = {
        response,
        model,
        provider: "groq",
        tier: complexity,
        type: promptType,
        success: true,
      };

      cacheResponse(messages, result);

      return res.status(200).json({
        ...result,
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

      // Chamar KIZI com seleção automática (100% Groq)
      const { response, model } = await callKizi(
        optimized.messages,
        optimized.systemPrompt,
        complexity,
        groqKey
      );

      const result = {
        response,
        model,
        provider: "groq",
        specialist: specialist.name,
        tier: complexity,
        success: true,
      };

      cacheResponse(messages, result);

      return res.status(200).json({
        ...result,
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
        error: "Transcription not implemented yet",
      });
    }

    return res.status(400).json({
      error: "Invalid type",
      hint: "Use type: genius, specialist, or transcribe",
    });
  } catch (error) {
    console.error("❌ KIZI AI error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
