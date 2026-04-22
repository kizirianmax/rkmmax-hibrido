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
// Classificador de intenção do Construtor/Híbrido (3 níveis)
//
// Nível 1 — TRIVIAL:  saudações, cortesias, testes → resposta curta, sem artefato
// Nível 2 — AMBIGUOUS: pedido vago/incompleto sem verbo de construção
//                       → clarificação curta, sem pipeline pesado
// Nível 3 — BUILD:     pedido concreto com intenção clara de gerar artefato
//                       → pipeline normal do Construtor
//
// Critério conservador: na dúvida entre ambíguo e build, escolhe BUILD
// para nunca bloquear pedidos reais. Reversível: remover este bloco
// restaura o comportamento anterior.
// ─────────────────────────────────────────────────────────────────────────────

/** Saudações e entradas triviais conhecidas (normalizadas, sem acento, lowercase). */
const TRIVIAL_EXACT = new Set([
  'oi', 'ola', 'hey', 'hi', 'hello',
  'bom dia', 'boa tarde', 'boa noite',
  'tudo bem', 'tudo bem?', 'tudo bom', 'tudo bom?',
  'e ai', 'e ai?', 'eai', 'eai?',
  'teste', 'test', 'ok', 'beleza', 'beleza?',
  'obrigado', 'obrigada', 'valeu', 'vlw', 'thanks', 'thank you',
  'falou', 'tchau', 'bye', 'ate mais', 'ate logo',
  'sim', 'nao', 'yes', 'no',
]);

/** Verbos de construção (PT-BR e EN) — presença indica intenção BUILD. */
const BUILD_VERBS = /\b(crie|cria|gere|gera|faça|faz|construa|construir|desenvolva|implemente|escreva|monte|elabore|projete|desenhe|refatore|otimize|adicione|remova|corrija|atualize|configure|integre|create|generate|build|make|write|implement|design|code|develop|refactor|optimize|add|remove|fix|update|configure|integrate)\b/i;

/** Substantivos de artefato — presença SEM verbo indica pedido AMBÍGUO. */
const ARTIFACT_NOUNS = /\b(site|pagina|página|landing|page|app|aplicativo|sistema|dashboard|painel|formulario|formulário|portfolio|portfólio|blog|loja|ecommerce|e-commerce|api|crud|login|cadastro|checkout|layout|componente|tabela|grafico|gráfico|modal|menu|navbar|header|footer|sidebar|card|botao|botão|input|tela|interface|website|webpage|homepage)\b/i;

/** Qualificadores de contexto — indicam que o pedido tem especificidade (favorece BUILD). */
const CONTEXT_QUALIFIERS = /\b(com|usando|para|que|onde|incluindo|contendo|estilo|tipo|como|responsivo|moderno|minimalista|profissional|completo|simples|bonito|escuro|claro|dark|light|react|html|css|tailwind|bootstrap|next|vue|angular)\b/i;

/**
 * Normaliza a entrada removendo acentos, pontuação final e espaços extras.
 * @param {string} raw
 * @returns {string}
 */
function _normalize(raw) {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?]+$/g, '')
    .trim();
}

/**
 * Classifica a intenção de uma entrada do usuário no contexto do Construtor.
 *
 * @param {string} raw - Mensagem bruta do usuário
 * @returns {{ intent: 'trivial'|'ambiguous'|'build', reason: string }}
 */
function _classifyHybridIntent(raw) {
  if (!raw || typeof raw !== 'string') {
    return { intent: 'build', reason: 'empty_or_invalid_fallback_to_build' };
  }

  const normalized = _normalize(raw);
  const hasBuildVerb = BUILD_VERBS.test(raw);
  const hasArtifactNoun = ARTIFACT_NOUNS.test(raw);
  const hasQualifier = CONTEXT_QUALIFIERS.test(raw);

  // ── Nível 3: BUILD — verbo de construção presente → sempre Construtor ──
  if (hasBuildVerb) {
    return { intent: 'build', reason: 'has_build_verb' };
  }

  // ── Nível 1: TRIVIAL — match exato na whitelist ──
  if (TRIVIAL_EXACT.has(normalized)) {
    return { intent: 'trivial', reason: 'exact_match' };
  }

  // Saudação + nome (ex: "oi serginho", "boa tarde kizi")
  const greetingWithName = /^(oi|ola|hey|hi|hello|bom dia|boa tarde|boa noite|e ai|eai)\s+\w{1,20}[!?]?$/i;
  if (greetingWithName.test(normalized)) {
    return { intent: 'trivial', reason: 'greeting_with_name' };
  }

  // ── Nível 2: AMBIGUOUS — substantivo de artefato SEM verbo e SEM qualificador ──
  // Ex: "landing page", "app de agenda", "sistema para clínica"
  if (hasArtifactNoun && !hasQualifier) {
    return { intent: 'ambiguous', reason: 'artifact_noun_without_context' };
  }

  // Substantivo de artefato COM qualificador mas SEM verbo → ainda ambíguo,
  // porém com mais contexto. Na dúvida, pedir clarificação.
  // Ex: "landing page moderna", "dashboard com gráficos"
  if (hasArtifactNoun && hasQualifier) {
    // Se a mensagem é longa (>80 chars) e tem qualificador, provavelmente é build
    if (raw.length > 80) {
      return { intent: 'build', reason: 'artifact_with_qualifier_long_input' };
    }
    return { intent: 'ambiguous', reason: 'artifact_noun_with_qualifier_short' };
  }

  // Mensagem muito curta (<15 chars) sem verbo e sem substantivo → trivial
  if (normalized.length < 15 && !hasArtifactNoun && !hasBuildVerb) {
    return { intent: 'trivial', reason: 'very_short_no_intent' };
  }

  // ── Default: BUILD — na dúvida, preservar fluxo normal do Construtor ──
  return { intent: 'build', reason: 'default_build' };
}

// Alias de compatibilidade com o guard anterior
function _classifyTrivialInput(raw) {
  const result = _classifyHybridIntent(raw);
  return { trivial: result.intent === 'trivial', reason: result.reason };
}

/**
 * Resposta leve para entradas triviais/conversacionais.
 * Gerada localmente sem chamar LLM — custo zero de créditos.
 * Permanece dentro do fluxo hybrid, sem bypass para genius.
 * @param {string} raw - Mensagem bruta do usuário
 * @returns {string}
 */
function _buildTrivialResponse(raw) {
  const normalized = _normalize(raw);

  // Saudações
  if (/^(oi|ola|hey|hi|hello)/.test(normalized)) {
    return 'Olá! Sou o Construtor do RKMMAX. Me diga o que você quer construir e eu crio para você.';
  }
  // Bom dia / Boa tarde / Boa noite
  if (/^(bom dia|boa tarde|boa noite)/.test(normalized)) {
    const periodo = /bom dia/.test(normalized) ? 'Bom dia' : /boa tarde/.test(normalized) ? 'Boa tarde' : 'Boa noite';
    return `${periodo}! Sou o Construtor do RKMMAX. Me diga o que você quer construir e eu crio para você.`;
  }
  // Despedidas
  if (/^(tchau|bye|falou|ate mais|ate logo)/.test(normalized)) {
    return 'Até mais! Quando precisar construir algo, é só chamar.';
  }
  // Agradecimentos
  if (/^(obrigado|obrigada|valeu|vlw|thanks|thank you)/.test(normalized)) {
    return 'De nada! Se precisar construir algo, é só pedir.';
  }
  // Default genérico
  return 'Sou o Construtor do RKMMAX. Me diga o que você quer construir — sites, apps, dashboards, formulários e mais.';
}

/**
 * Mensagem de clarificação para entradas ambíguas.
 * Gerada localmente sem chamar LLM — custo zero de créditos.
 * @param {string} userMsg
 * @returns {string}
 */
function _buildClarificationResponse(userMsg) {
  return (
    `Entendi que você quer algo relacionado a "${userMsg.slice(0, 60).trim()}". ` +
    'Para eu construir exatamente o que você precisa, me diga com mais detalhes:\n\n' +
    '- **O que** deve ser criado? (ex: landing page, dashboard, formulário)\n' +
    '- **Para quem** é? (ex: clínica, loja, portfólio pessoal)\n' +
    '- **Alguma preferência** de estilo ou funcionalidade?\n\n' +
    'Quanto mais detalhes, melhor o resultado!'
  );
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

      // ── Classificador de intenção (3 níveis) ──────────────────────────────
      // trivial   → resposta local leve do Construtor (custo zero, sem artefato)
      // ambiguous → clarificação local do Construtor (custo zero, sem pipeline pesado)
      // build     → pipeline normal do Construtor (120B → 70B)
      // Tudo permanece dentro do fluxo hybrid, sem bypass para genius.
      // Reversível: remover este bloco restaura o comportamento anterior.
      const _lastMsg = (messages[messages.length - 1]?.content || '').trim();
      const _intent = _classifyHybridIntent(_lastMsg);
      console.log(`🏗️ HYBRID intent: "${_lastMsg.slice(0, 40)}" → ${_intent.intent} (${_intent.reason})`);

      // ── Nível 1: TRIVIAL → resposta local leve do Construtor (custo zero) ──
      if (_intent.intent === 'trivial') {
        const _trivialText = _buildTrivialResponse(_lastMsg);
        const _trivialResp = {
          response: _trivialText,
          model: 'local-guard',
          provider: 'hybrid-intent-classifier',
          tier: 'guard',
          complexity: 'trivial',
          routing: 'hybrid-intent-guard',
          execution: { intentGuard: 'trivial', reason: _intent.reason },
          type: 'hybrid',
          metadata: { provider: 'hybrid-intent-classifier', tier: 'guard', complexity: 'trivial' },
          success: true,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
        cacheResponse(messages, _trivialResp);
        if (usageBill) {
          usageBill(0).catch(err => console.error('[USAGE] bill error:', err.message));
        }
        return res.status(200).json({ ..._trivialResp, cached: false, optimized: true });
      }

      // ── Nível 2: AMBIGUOUS → clarificação local do Construtor (custo zero) ──
      if (_intent.intent === 'ambiguous') {
        const _clarification = _buildClarificationResponse(_lastMsg);
        const _ambigResp = {
          response: _clarification,
          model: 'local-guard',
          provider: 'hybrid-intent-classifier',
          tier: 'guard',
          complexity: 'trivial',
          routing: 'hybrid-intent-guard',
          execution: { intentGuard: 'ambiguous', reason: _intent.reason },
          type: 'hybrid',
          metadata: { provider: 'hybrid-intent-classifier', tier: 'guard', complexity: 'trivial' },
          success: true,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
        // Não cachear clarificações — o usuário vai reformular
        if (usageBill) {
          usageBill(0).catch(err => console.error('[USAGE] bill error:', err.message));
        }
        return res.status(200).json({ ..._ambigResp, cached: false, optimized: true });
      }
      // ── Nível 3: BUILD → segue para o pipeline normal abaixo ──
      // ── Fim do classificador de intenção ─────────────────────────────────

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
