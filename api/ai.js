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
import guardAndBill from "./_utils/guardAndBill.js";

const { buildGeniusPrompt } = geniusPrompts;
const { optimizeRequest, cacheResponse } = costOptimization;

/** Fallback de tokens de saída quando a API não informa usage (estimativa conservadora). */
const DEFAULT_OUTPUT_TOKENS = 800;

// ─────────────────────────────────────────────────────────────────────────────
// Guard de intenção trivial para o Construtor/Híbrido
// Detecta entradas claramente conversacionais que NÃO devem gerar artefato.
// Critério: whitelist explícita de saudações/triviais + ausência de verbo de construção.
// Na dúvida (ambíguo), retorna { trivial: false } para preservar o fluxo normal.
// ─────────────────────────────────────────────────────────────────────────────

/** Saudações e entradas triviais conhecidas (normalizadas, sem acento, lowercase). */
const TRIVIAL_EXACT = new Set([
  'oi', 'ola', 'oi!', 'ola!', 'hey', 'hi', 'hello',
  'bom dia', 'boa tarde', 'boa noite',
  'bom dia!', 'boa tarde!', 'boa noite!',
  'tudo bem', 'tudo bem?', 'tudo bom', 'tudo bom?',
  'e ai', 'e ai?', 'e aí', 'e aí?', 'eai', 'eai?',
  'teste', 'test', 'ok', 'ok!', 'beleza', 'beleza?',
  'obrigado', 'obrigada', 'valeu', 'vlw', 'thanks', 'thank you',
  'falou', 'tchau', 'bye', 'ate mais', 'ate logo',
  'sim', 'nao', 'não', 'yes', 'no',
]);

/** Verbos de construção (PT-BR e EN) — se presentes, a entrada NÃO é trivial. */
const BUILD_VERBS = /\b(crie|cria|gere|gera|faça|faz|construa|construir|desenvolva|implemente|escreva|monte|elabore|projete|desenhe|create|generate|build|make|write|implement|design|code|develop)\b/i;

/**
 * Classifica se uma entrada do usuário é trivial/conversacional.
 * @param {string} raw - Mensagem bruta do usuário
 * @returns {{ trivial: boolean, reason: string }}
 */
function _classifyTrivialInput(raw) {
  if (!raw || typeof raw !== 'string') {
    return { trivial: false, reason: 'empty_or_invalid' };
  }

  const normalized = raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[.,;:!?]+$/g, '')                       // remove pontuação final
    .trim();

  // Se contém verbo de construção, NUNCA é trivial (mesmo que curto)
  if (BUILD_VERBS.test(raw)) {
    return { trivial: false, reason: 'has_build_verb' };
  }

  // Match exato na whitelist (com e sem pontuação)
  if (TRIVIAL_EXACT.has(normalized)) {
    return { trivial: true, reason: 'exact_match' };
  }

  // Saudação + nome (ex: "oi serginho", "boa tarde kizi")
  const greetingPrefix = /^(oi|ola|hey|hi|hello|bom dia|boa tarde|boa noite|e ai|eai)\s+\w{1,20}[!?]?$/i;
  if (greetingPrefix.test(normalized)) {
    return { trivial: true, reason: 'greeting_with_name' };
  }

  // Na dúvida, preservar fluxo normal do Construtor
  return { trivial: false, reason: 'not_trivial' };
}

/**
 * Resolve o plano do usuário via Supabase subscriptions.
 * Reutiliza a mesma lógica de api/admin.js handleMePlan.
 * Retorna 'basic' como fallback seguro.
 */
async function resolveUserPlan(user) {
  if (!user?.email) return 'basic';
  // Dev local
  if (user.id === 'dev-local') return 'dev';

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return 'basic';

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, stripe_price_id, status')
      .eq('email', user.email.toLowerCase())
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return 'basic';
    if (!['active', 'trialing'].includes(data.status)) return 'basic';

    // Mesmo mapeamento de api/admin.js
    const VALID_PLANS = new Set(['basic', 'intermediate', 'premium', 'ultra', 'dev']);
    if (data.plan && VALID_PLANS.has(data.plan)) return data.plan;

    return 'basic';
  } catch {
    return 'basic';
  }
}

/**
 * Estimativa grosseira de tokens do prompt (1 token ≈ 4 chars).
 */
function estimatePromptSize(messages) {
  if (!Array.isArray(messages)) return 100;
  const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  return Math.ceil(totalChars / 4);
}

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

  // === Usage guard — controle persistente de consumo ===
  // Resolve o plano do usuário e checa limites ANTES de consumir a IA
  let usageBill = null;
  try {
    const userPlan = await resolveUserPlan(user);
    const promptSize = estimatePromptSize(req.body.messages);
    const guard = await guardAndBill({
      user: { id: user.id },
      plan: userPlan,
      promptSize,
    });
    usageBill = guard.bill;
  } catch (usageError) {
    // Se o erro é de limite excedido, retornar 429
    if (usageError.message && usageError.message.includes('Limite')) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: usageError.message,
      });
    }
    // Outros erros de usage (plano inválido, etc.) — logar mas não bloquear
    console.error('[USAGE] guardAndBill error:', usageError.message);
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

      // ── Guard de intenção trivial ──────────────────────────────────────
      // Entradas claramente conversacionais/triviais não devem acionar o
      // pipeline pesado de geração de artefatos (120B → 70B, maxTokens 4096).
      // Em vez disso, são redirecionadas ao Serginho (genius) para resposta
      // leve e natural. Pedidos reais de construção passam intactos.
      // Reversível: remover este bloco restaura o comportamento anterior.
      const _lastMsg = (messages[messages.length - 1]?.content || '').trim();
      const _isTrivial = _classifyTrivialInput(_lastMsg);
      if (_isTrivial.trivial) {
        console.log(`🏗️ HYBRID guard: entrada trivial detectada ("${_lastMsg.slice(0, 30)}") → redirecionando ao Serginho`);
        const _sergPrompt = buildGeniusPrompt('serginho');
        const _sergOpt = optimizeRequest(messages, _sergPrompt);
        const _sergResult = await executeAITask(
          _sergOpt.messages || messages,
          _sergOpt.systemPrompt || _sergPrompt,
          { source: 'hybrid-api', type: 'serginho', trivialGuard: true },
          {} // auto-routing do Serginho, sem forceProvider
        );
        const _trivialResp = {
          response: _sergResult.text,
          model: _sergResult.model,
          provider: _sergResult.provider,
          tier: _sergResult.tier,
          complexity: _sergResult.complexity,
          routing: _sergResult.routing,
          execution: { ...(_sergResult.execution || {}), trivialGuard: true },
          type: 'hybrid',
          metadata: {
            provider: _sergResult.provider,
            tier: _sergResult.tier,
            complexity: _sergResult.complexity,
          },
          success: true,
          usage: _sergResult.usage,
        };
        cacheResponse(messages, _trivialResp);
        if (usageBill) {
          const _ot = _sergResult.usage?.completion_tokens || _sergResult.usage?.output_tokens || DEFAULT_OUTPUT_TOKENS;
          usageBill(_ot).catch(err => console.error('[USAGE] bill error:', err.message));
        }
        return res.status(200).json({ ..._trivialResp, cached: false, optimized: true, stats: _sergOpt.stats });
      }
      // ── Fim do guard de intenção trivial ────────────────────────────────

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

      // Registrar tokens reais após sucesso (non-blocking)
      if (usageBill) {
        const outputTokens = result.usage?.completion_tokens || result.usage?.output_tokens || DEFAULT_OUTPUT_TOKENS;
        usageBill(outputTokens).catch(err => console.error('[USAGE] bill error:', err.message));
      }

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

      // Verificar cache (modo manual força execução no provider selecionado)
      if (optimized.cached && !forceProvider) {
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
        orchOptions.noFallback = true; // Modo manual: sem fallback silencioso
      }
      const requestMessages = optimized.messages || messages;
      const requestSystemPrompt = optimized.systemPrompt || systemPrompt;
      const result = await executeAITask(
        requestMessages,
        requestSystemPrompt,
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

      // Registrar tokens reais após sucesso (non-blocking)
      if (usageBill) {
        const outputTokens = result.usage?.completion_tokens || result.usage?.output_tokens || DEFAULT_OUTPUT_TOKENS;
        usageBill(outputTokens).catch(err => console.error('[USAGE] bill error:', err.message));
      }

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

      // Registrar tokens reais após sucesso (non-blocking)
      if (usageBill) {
        const outputTokens = result.usage?.completion_tokens || result.usage?.output_tokens || DEFAULT_OUTPUT_TOKENS;
        usageBill(outputTokens).catch(err => console.error('[USAGE] bill error:', err.message));
      }

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
