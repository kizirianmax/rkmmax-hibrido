/**
 * SERGINHO ORCHESTRATOR - Central Intelligence Router
 * 
 * ÚNICO ponto de entrada para TODAS as requisições de IA.
 * Coordena providers, fallbacks, circuit breakers, cache.
 * 
 * Features:
 * - Automatic complexity analysis and provider selection
 * - Circuit breaker protection per provider
 * - Automatic fallback chains
 * - Response caching
 * - Metrics tracking
 * - ✨ NOVO: Metadata estruturada de transparência
 * 
 * Usage:
 *   const result = await serginho.handleRequest({
 *     message: 'User question',
 *     messages: [], // conversation history
 *     context: {},  // additional context
 *     options: {}   // override options
 *   });
 */

import { randomUUID } from 'crypto';
import { analyzeComplexity, routeToProvider, getNextFallback, FALLBACK_CHAIN } from '../../src/utils/intelligentRouter.js';
import CircuitBreaker from './circuit-breaker.js';
import { getProviderConfig, getModelMetadata, PROVIDERS, getEnabledProviders, getWeightedProviders } from './providers-config.js';
import modelRegistry from './model-registry.js';
import { AUTO_PRIORITY_ORDER } from '../../src/config/modelPriority.js';
// GitHub intent detection — early-return sem chamada LLM (reversível: remover bloco abaixo)
import { detectGitHubIntent } from './serginho/intent/githubIntent.js';
import { getToolByName } from './serginho/tools/index.js';
import { formatGitHubToolResult, formatErrorResponse as formatGitHubError } from './serginho/formatters/githubResponseFormatter.js';
// GitHub conversation context — per-request in-memory (reversível: remover bloco abaixo)
import { createGitHubContext, updateContextFromToolResult, resolveParamsFromContext, getContextSummary } from './serginho/context/githubConversationContext.js';
// GitHub incremental analysis — analytical follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isAnalyticalFollowUp, hasEnoughContextForAnalysis, buildAnalysisPrompt, getInsufficientContextMessage } from './serginho/analysis/githubContextAnalysis.js';
// GitHub analytical response formatter — pós-processamento estruturado (reversível: remover bloco abaixo)
import { formatAnalyticalResponse } from './serginho/analysis/githubAnalyticalResponseFormatter.js';
// GitHub context comparison — comparative follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isComparativeFollowUp, hasEnoughContextForComparison, buildComparisonPrompt, getInsufficientComparisonContextMessage } from './serginho/analysis/githubContextComparison.js';
// GitHub action recommendations — recommendation follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isActionRecommendationFollowUp, hasEnoughContextForRecommendations, buildRecommendationPrompt, formatRecommendationResponse, getInsufficientRecommendationContextMessage } from './serginho/analysis/githubActionRecommendations.js';
// GitHub action plan — sequential plan follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isActionPlanFollowUp, hasEnoughContextForActionPlan, buildActionPlanPrompt, formatActionPlanResponse, getInsufficientActionPlanContextMessage } from './serginho/analysis/githubActionPlan.js';
// GitHub execution checklist — checklist follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isExecutionChecklistFollowUp, hasEnoughContextForChecklist, buildChecklistPrompt, formatChecklistResponse, getInsufficientChecklistContextMessage } from './serginho/analysis/githubExecutionChecklist.js';
// GitHub acceptance criteria — validation/acceptance follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isAcceptanceCriteriaFollowUp, hasEnoughContextForAcceptanceCriteria, buildAcceptanceCriteriaPrompt, formatAcceptanceCriteriaResponse, getInsufficientAcceptanceCriteriaContextMessage } from './serginho/analysis/githubAcceptanceCriteria.js';
// GitHub execution dependencies — dependency/blocker/prerequisite follow-up sem re-fetch (reversível: remover bloco abaixo)
import { isExecutionDependenciesFollowUp, hasEnoughContextForExecutionDependencies, buildExecutionDependenciesPrompt, formatExecutionDependenciesResponse, getInsufficientExecutionDependenciesContextMessage } from './serginho/analysis/githubExecutionDependencies.js';
// Prompt intent classifier — classifica a intenção antes do fluxo de follow-up GitHub (reversível: remover bloco abaixo)
import { classifyPromptIntent } from './serginho/intent/promptIntentClassifier.js';

// Versão do orquestrador (para versionamento de schema)
const ORCHESTRATOR_VERSION = '2.1.0';
const METADATA_SCHEMA_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Helpers de módulo — usados pelo conceptual prompt guard
// ---------------------------------------------------------------------------

/** Número mínimo de caracteres para classificar uma mensagem longa como conceitual. */
const MIN_CONCEPTUAL_MESSAGE_LENGTH = 200;

/**
 * Detecta se uma mensagem contém referências GitHub explícitas:
 * owner/repo patterns, caminhos de arquivo, nomes de branch, ou comandos GitHub.
 *
 * @param {string} message
 * @returns {boolean}
 */
function _hasGitHubReference(message) {
  // owner/repo pattern (e.g. "facebook/react", "de owner/repo")
  if (/[\w.-]+\/[\w.-]+/.test(message)) return true;
  // File path patterns (e.g. "package.json", ".js", ".ts", ".md", "/src/")
  // Ignorados quando a mensagem é um pedido de criação/geração de código
  // (e.g. "Node.js" e "README.md" em "Crie um script Node.js... com README.md" NÃO são sinais de repo)
  if (
    /\b\w+\.(json|js|ts|jsx|tsx|md|yaml|yml|txt|py|go|java|rb|rs)\b/i.test(message) &&
    !/\b(crie|gere|cria|faça|desenvolva|implemente|escreva|construa|create|generate|build|make|write|implement)\b/i.test(message)
  ) return true;
  // Branch references
  if (/\b(branch|branches|main|master|develop|feature\/|hotfix\/)\b/i.test(message)) return true;
  // GitHub action verbs with file/repo objects
  if (/\b(abra|abre|abrir|liste|listar|mostre|mostrar|open|list|show|fetch|busque|buscar)\b.{0,50}\b(repo|arquivo|file|branch|package)\b/i.test(message)) return true;
  return false;
}


/**
 * Retorna a cadeia de providers para o modo automático, filtrada pelos providers habilitados.
 * A ordem segue AUTO_PRIORITY_ORDER — basta reordenar lá para mudar a prioridade.
 *
 * @param {string[]} enabledProviders - Lista de providers habilitados (getEnabledProviders())
 * @returns {string[]} Lista ordenada de provider names disponíveis
 */
function getAutoProviderChain(enabledProviders) {
  return AUTO_PRIORITY_ORDER
    .map(m => m.providerName)
    .filter(p => enabledProviders.includes(p));
}


/**
 * Simple in-memory cache
 * In production, consider using Redis or similar
 */
class SimpleCache {
  constructor(ttl = 3600000) { // 1 hour default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Metrics Tracker
 */
class MetricsTracker {
  constructor() {
    this.reset();
  }

  recordRequest(provider, responseTime, success, fromCache) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    if (fromCache) {
      this.metrics.cacheHits++;
    }
    
    if (!this.metrics.providerUsage[provider]) {
      this.metrics.providerUsage[provider] = 0;
    }
    this.metrics.providerUsage[provider]++;
    
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      providerUsage: {},
      avgResponseTime: 0,
      totalResponseTime: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// GitHub tools result formatter (delegado para githubResponseFormatter)
// ---------------------------------------------------------------------------

/**
 * Formata o resultado de uma tool GitHub em texto legível para o usuário.
 * Delega para o módulo formatters/githubResponseFormatter para formatação
 * inteligente por tipo de arquivo/operação.
 *
 * @param {string} toolName
 * @param {object} data
 * @param {{ owner?: string, repo?: string, path?: string }} [context]
 * @returns {string}
 */
function formatGitHubResult(toolName, data, context = {}) {
  return formatGitHubToolResult(toolName, data, context);
}

// ---------------------------------------------------------------------------

/**
 * Calcula quais parâmetros obrigatórios ainda estão faltando para uma tool GitHub,
 * após a resolução a partir do contexto de conversa.
 *
 * @param {string} toolName
 * @param {{ owner?: string, repo?: string, path?: string }} params
 * @returns {string[]}
 */
function _computeMissingParams(toolName, params) {
  if (toolName === 'github_list_repos') return [];
  if (toolName === 'github_list_branches') {
    const m = [];
    if (!params.owner) m.push('owner');
    if (!params.repo) m.push('repo');
    return m;
  }
  if (toolName === 'github_get_file') {
    const m = [];
    if (!params.owner) m.push('owner');
    if (!params.repo) m.push('repo');
    if (!params.path) m.push('path');
    return m;
  }
  return [];
}

// ---------------------------------------------------------------------------

/**
 * Serginho Orchestrator Class
 */
class SerginhoOrchestrator {
  constructor() {
    this.circuitBreakers = new Map();
    this.cache = new SimpleCache();
    this.metrics = new MetricsTracker();
    this.modelRegistry = modelRegistry;
    this.initializeCircuitBreakers();
    this._registerModels();
  }

  /**
   * Register all models in ModelRegistry with tier and cost info
   * @private
   */
  _registerModels() {
    // Groq models
    this.modelRegistry.registerModel('openai/gpt-oss-120b', 'complex', 0.00);
    this.modelRegistry.registerModel('llama-3.3-70b-versatile', 'complex', 0.00);
    this.modelRegistry.registerModel('llama-3.1-70b-versatile', 'complex', 0.00);
    this.modelRegistry.registerModel('mixtral-8x7b-32768', 'complex', 0.00);
    // Google models
    this.modelRegistry.registerModel('gemini-3-flash-preview', 'speed', 0.00);
    this.modelRegistry.registerModel('gemini-3.1-pro-preview', 'complex', 0.00);
    this.modelRegistry.registerModel('gemini-2.5-pro', 'complex', 0.00);
  }

  /**
   * Initialize circuit breakers for all providers
   */
  initializeCircuitBreakers() {
    // Timeouts diferenciados por provider — TODOS devem ser menores que maxDuration (25s)
    // Regra: timeout_circuit_breaker < maxDuration - 5s (margem para serialização + overhead)
    const PROVIDER_TIMEOUTS = {
      'llama-120b': 20000, // 20s — modelo complexo (margem de 5s abaixo do teto Vercel de 25s)
      'llama-70b': 12000,  // 12s — tier médio
      'groq-fallback': 8000, // 8s — fallback rápido
      'gemini-3-flash': 12000, // 12s — modelo de velocidade (preview)
      'gemini-3.1-pro': 20000, // 20s — modelo de raciocínio avançado (preview)
      'gemini-pro': 20000, // 20s — Gemini 2.5 Pro é modelo de raciocínio; precisa de margem maior
    };
    const PROVIDER_FAILURE_THRESHOLDS = {
      'llama-120b': 5, // Mais tolerante a timeouts esporádicos; evita ciclo de fallback permanente
      'llama-70b': 5,  // Alinhado com 120B — evita circuit aberto por rate limit transitório da Groq
      'gemini-3-flash': 5, // Preview model — tolerância maior para instabilidades iniciais
      'gemini-3.1-pro': 5, // Preview model — tolerância maior para instabilidades iniciais
      'gemini-pro': 5, // Thinking model with variable latency; default 3 opens circuit too early
    };
    const DEFAULT_TIMEOUT = 8000; // 8s para providers não mapeados
    const DEFAULT_FAILURE_THRESHOLD = 3;

    Object.keys(PROVIDERS).forEach(provider => {
      this.circuitBreakers.set(provider, new CircuitBreaker({
        name: provider,
        timeout: PROVIDER_TIMEOUTS[provider] || DEFAULT_TIMEOUT,
        failureThreshold: PROVIDER_FAILURE_THRESHOLDS[provider] || DEFAULT_FAILURE_THRESHOLD,
        resetTimeout: 60000, // 60s cooldown — tempo suficiente para rate limit Groq resetar (janela de 1min)
      }));
    });
  }

  /**
   * Handle ANY AI request - Main entry point (UNIFIED INTERFACE)
   * Supports both string and object signatures for compatibility:
   * - handleRequest('message', options) → string signature
   * - handleRequest({ message, messages, context, options }) → object signature
   * 
   * @param {string|object} firstArg - User message (string) OR full params object
   * @param {object} secondArg - Options (when firstArg is string)
   * @param {AbortSignal} [secondArg.signal] - External AbortSignal for cancellation
   * @param {number} [secondArg.timeoutMs] - Internal deadline in ms. Creates an internal AbortController. Timeout generates a neutral AbortError (no fallback, no cache write, no metrics, no circuit breaker).
   * @param {number} [secondArg.deadlineMs] - Alias for options.timeoutMs
   * @returns {Promise<object>} { text, model, execution, routing, usage, _meta }
   */
  async handleRequest(firstArg, secondArg = {}) {
    // Unified interface: support both string and object signatures
    if (typeof firstArg === 'string') {
      return this._handleStructured({ message: firstArg, options: secondArg });
    }
    return this._handleStructured(firstArg);
  }

  /**
   * Internal structured handler (original handleRequest logic)
   * ✨ NOVO: Retorna metadata estruturada completa
   * 
   * @private
   * @param {object} params
   * @param {string} params.message - User message
   * @param {array} params.messages - Full conversation history (optional)
   * @param {object} params.context - Additional context (optional)
   * @param {object} params.options - Override options (optional)
   * @param {AbortSignal} [params.options.signal] - External AbortSignal for cancellation
   * @param {number} [params.options.timeoutMs] - Internal deadline in ms. Creates an internal AbortController. Timeout generates a neutral AbortError (no fallback, no cache write, no metrics, no circuit breaker).
   * @param {number} [params.options.deadlineMs] - Alias for options.timeoutMs
   * @returns {Promise<object>} { text, model, execution, routing, usage, _meta }
   */
  async _handleStructured({ message, messages = [], context = {}, options = {} }) {
    const orchestrationStartTime = Date.now();
    const traceId = randomUUID();

    // A3: Deadline/timeout setup
    const timeoutMs = options.timeoutMs || options.deadlineMs;
    let controller = null;
    let timer = null;
    let abortListener = null;

    if (timeoutMs) {
      controller = new AbortController();
      timer = setTimeout(() => controller.abort(), timeoutMs);

      // Chain external signal: if external signal aborts, abort internal controller too
      if (options.signal) {
        abortListener = () => controller.abort();
        options.signal.addEventListener('abort', abortListener);
      }
    }

    const signal = controller ? controller.signal : options.signal;

    try {
    // Specialist bypass — skip GitHub analysis chain entirely (reversível: remover este bloco)
    // Requisições de especialistas possuem systemPrompt próprio e não devem ser interceptadas
    // pelos blocos de follow-up GitHub, que causam false-positive early-returns.
    const isSpecialistRequest = !!(context.specialistId || context.source === 'specialist-api');
    // Fim do specialist bypass

    // GitHub conversation context — per-request, in-memory (reversível: remover bloco abaixo)
    // Cópia rasa é suficiente: todos os campos do contexto são primitivos (strings/null).
    // Para specialist requests githubCtx é null — todos os blocos abaixo são ignorados naturalmente.
    const githubCtx = isSpecialistRequest
      ? null
      : context.githubContext
        ? { ...context.githubContext }
        : createGitHubContext();

    // Prompt intent guard — classifica a intenção antes do fluxo de follow-up GitHub
    // Intenções 'conceptual' e 'mixed' ignoram o follow-up chain; 'repo_analysis' continua normal.
    // (reversível: remover este bloco)
    const { intent: promptIntent } = githubCtx ? classifyPromptIntent(message) : { intent: null };
    if (githubCtx && (promptIntent === 'conceptual' || promptIntent === 'mixed')) {
      context = {
        ...context,
        _promptIntent: promptIntent,
        _skipExecutionDependenciesCheck: true,
        _skipAcceptanceCriteriaCheck: true,
        _skipExecutionChecklistCheck: true,
        _skipActionPlanCheck: true,
        _skipRecommendationCheck: true,
        _skipComparisonCheck: true,
        _skipAnalyticalCheck: true,
      };
    }
    // Fim do prompt intent guard

    // GitHub execution dependencies — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipExecutionDependenciesCheck && isExecutionDependenciesFollowUp(message)) {
      if (hasEnoughContextForExecutionDependencies(githubCtx)) {
        const executionDepsPrompt = buildExecutionDependenciesPrompt(message, githubCtx);
        if (executionDepsPrompt) {
          const executionDepsResult = await this._handleStructured({
            message: executionDepsPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipExecutionDependenciesCheck: true, _skipAcceptanceCriteriaCheck: true, _skipExecutionChecklistCheck: true, _skipActionPlanCheck: true, _skipRecommendationCheck: true, _skipComparisonCheck: true, _skipAnalyticalCheck: true },
            options,
          });
          if (executionDepsResult && executionDepsResult._meta) {
            executionDepsResult._meta.githubContext = githubCtx;
            executionDepsResult._meta.executionDependenciesFollowUp = true;
          }
          if (executionDepsResult && executionDepsResult.text) {
            executionDepsResult.text = formatExecutionDependenciesResponse(executionDepsResult.text);
            executionDepsResult._meta = executionDepsResult._meta || {};
            executionDepsResult._meta.executionDependenciesFormatted = true;
          }
          return executionDepsResult;
        }
      } else {
        return {
          text: getInsufficientExecutionDependenciesContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-execution-dependencies',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { executionDependenciesFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco execution dependencies

    // GitHub acceptance criteria — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipAcceptanceCriteriaCheck && isAcceptanceCriteriaFollowUp(message)) {
      if (hasEnoughContextForAcceptanceCriteria(githubCtx)) {
        const acceptanceCriteriaPrompt = buildAcceptanceCriteriaPrompt(message, githubCtx);
        if (acceptanceCriteriaPrompt) {
          const acceptanceCriteriaResult = await this._handleStructured({
            message: acceptanceCriteriaPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipAcceptanceCriteriaCheck: true, _skipExecutionChecklistCheck: true, _skipActionPlanCheck: true, _skipRecommendationCheck: true, _skipComparisonCheck: true, _skipAnalyticalCheck: true },
            options,
          });
          if (acceptanceCriteriaResult && acceptanceCriteriaResult._meta) {
            acceptanceCriteriaResult._meta.githubContext = githubCtx;
            acceptanceCriteriaResult._meta.acceptanceCriteriaFollowUp = true;
          }
          if (acceptanceCriteriaResult && acceptanceCriteriaResult.text) {
            acceptanceCriteriaResult.text = formatAcceptanceCriteriaResponse(acceptanceCriteriaResult.text);
            acceptanceCriteriaResult._meta = acceptanceCriteriaResult._meta || {};
            acceptanceCriteriaResult._meta.acceptanceCriteriaFormatted = true;
          }
          return acceptanceCriteriaResult;
        }
      } else {
        return {
          text: getInsufficientAcceptanceCriteriaContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-acceptance-criteria',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { acceptanceCriteriaFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco acceptance criteria

    // GitHub execution checklist — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipExecutionChecklistCheck && isExecutionChecklistFollowUp(message)) {
      if (hasEnoughContextForChecklist(githubCtx)) {
        const checklistPrompt = buildChecklistPrompt(message, githubCtx);
        if (checklistPrompt) {
          const checklistResult = await this._handleStructured({
            message: checklistPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipExecutionChecklistCheck: true, _skipActionPlanCheck: true, _skipRecommendationCheck: true, _skipComparisonCheck: true, _skipAnalyticalCheck: true },
            options,
          });
          if (checklistResult && checklistResult._meta) {
            checklistResult._meta.githubContext = githubCtx;
            checklistResult._meta.executionChecklistFollowUp = true;
          }
          if (checklistResult && checklistResult.text) {
            checklistResult.text = formatChecklistResponse(checklistResult.text);
            checklistResult._meta = checklistResult._meta || {};
            checklistResult._meta.executionChecklistFormatted = true;
          }
          return checklistResult;
        }
      } else {
        return {
          text: getInsufficientChecklistContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-checklist',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { executionChecklistFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco execution checklist

    // GitHub action plan — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipActionPlanCheck && isActionPlanFollowUp(message)) {
      if (hasEnoughContextForActionPlan(githubCtx)) {
        const actionPlanPrompt = buildActionPlanPrompt(message, githubCtx);
        if (actionPlanPrompt) {
          const actionPlanResult = await this._handleStructured({
            message: actionPlanPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipActionPlanCheck: true, _skipRecommendationCheck: true, _skipComparisonCheck: true, _skipAnalyticalCheck: true },
            options,
          });
          if (actionPlanResult && actionPlanResult._meta) {
            actionPlanResult._meta.githubContext = githubCtx;
            actionPlanResult._meta.actionPlanFollowUp = true;
          }
          if (actionPlanResult && actionPlanResult.text) {
            actionPlanResult.text = formatActionPlanResponse(actionPlanResult.text);
            actionPlanResult._meta = actionPlanResult._meta || {};
            actionPlanResult._meta.actionPlanFormatted = true;
          }
          return actionPlanResult;
        }
      } else {
        return {
          text: getInsufficientActionPlanContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-action-plan',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { actionPlanFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco action plan

    // GitHub action recommendations — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipRecommendationCheck && isActionRecommendationFollowUp(message)) {
      if (hasEnoughContextForRecommendations(githubCtx)) {
        const recommendationPrompt = buildRecommendationPrompt(message, githubCtx);
        if (recommendationPrompt) {
          const recommendationResult = await this._handleStructured({
            message: recommendationPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipRecommendationCheck: true, _skipComparisonCheck: true, _skipAnalyticalCheck: true },
            options,
          });
          if (recommendationResult && recommendationResult._meta) {
            recommendationResult._meta.githubContext = githubCtx;
            recommendationResult._meta.recommendationFollowUp = true;
          }
          if (recommendationResult && recommendationResult.text) {
            recommendationResult.text = formatRecommendationResponse(recommendationResult.text);
            recommendationResult._meta = recommendationResult._meta || {};
            recommendationResult._meta.recommendationFormatted = true;
          }
          return recommendationResult;
        }
      } else {
        return {
          text: getInsufficientRecommendationContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-recommendations',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { recommendationFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco action recommendations

    // GitHub comparative follow-up — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipComparisonCheck && isComparativeFollowUp(message)) {
      if (hasEnoughContextForComparison(githubCtx)) {
        const comparisonPrompt = buildComparisonPrompt(message, githubCtx);
        if (comparisonPrompt) {
          const comparisonResult = await this._handleStructured({
            message: comparisonPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipComparisonCheck: true, _skipAnalyticalCheck: true },
            options,
          });
          if (comparisonResult && comparisonResult._meta) {
            comparisonResult._meta.githubContext = githubCtx;
            comparisonResult._meta.comparativeFollowUp = true;
          }
          // Pós-processa a resposta comparativa com o formatter analítico existente (reversível)
          if (comparisonResult && comparisonResult.text) {
            comparisonResult.text = formatAnalyticalResponse(comparisonResult.text);
            comparisonResult._meta = comparisonResult._meta || {};
            comparisonResult._meta.analyticalFormatted = true;
          }
          return comparisonResult;
        }
      } else {
        return {
          text: getInsufficientComparisonContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-comparison',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { comparativeFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco comparative follow-up

    // GitHub analytical follow-up — sem re-fetch (reversível: remover este bloco)
    if (githubCtx && !context._skipAnalyticalCheck && isAnalyticalFollowUp(message)) {
      if (hasEnoughContextForAnalysis(githubCtx)) {
        const analysisPrompt = buildAnalysisPrompt(message, githubCtx);
        if (analysisPrompt) {
          const analysisResult = await this._handleStructured({
            message: analysisPrompt,
            messages,
            context: { ...context, githubContext: githubCtx, _skipAnalyticalCheck: true },
            options,
          });
          if (analysisResult && analysisResult._meta) {
            analysisResult._meta.githubContext = githubCtx;
            analysisResult._meta.analyticalFollowUp = true;
          }
          // Pós-processa a resposta analítica para estrutura mais útil (reversível)
          if (analysisResult && analysisResult.text) {
            analysisResult.text = formatAnalyticalResponse(analysisResult.text);
            analysisResult._meta = analysisResult._meta || {};
            analysisResult._meta.analyticalFormatted = true;
          }
          return analysisResult;
        }
      } else {
        return {
          text: getInsufficientContextMessage(),
          model: 'serginho-intent',
          provider: 'serginho-analysis',
          traceId,
          orchestrationTime: Date.now() - orchestrationStartTime,
          _meta: { analyticalFollowUp: true, insufficientContext: true, githubContext: githubCtx },
        };
      }
    }
    // Fim do bloco analytical follow-up

    // GitHub intent early-return — sem chamada LLM (reversível: remover este bloco)
    const githubIntent = githubCtx ? detectGitHubIntent(message) : null;
    if (githubIntent) {
      const tool = getToolByName(githubIntent.tool);
      if (tool) {
        // Resolve parâmetros faltantes a partir do contexto de conversa
        const resolvedParams = resolveParamsFromContext(githubCtx, githubIntent.params);
        const remainingMissing = _computeMissingParams(githubIntent.tool, resolvedParams);

        if (remainingMissing.length > 0) {
          return {
            text: `Para executar essa ação, preciso dos seguintes dados: ${remainingMissing.join(', ')}. Pode fornecer?`,
            model: 'serginho-intent',
            provider: 'serginho-tools',
            traceId,
            orchestrationTime: Date.now() - orchestrationStartTime,
            _meta: { intent: githubIntent.tool, missing: remainingMissing, githubContext: githubCtx },
          };
        }
        const result = await tool.execute(resolvedParams);
        // Atualiza contexto após execução da tool
        updateContextFromToolResult(githubCtx, githubIntent.tool, resolvedParams, result);
        if (result.success) {
          return {
            text: formatGitHubResult(githubIntent.tool, result.data, resolvedParams),
            model: 'serginho-intent',
            provider: 'serginho-tools',
            traceId,
            orchestrationTime: Date.now() - orchestrationStartTime,
            _meta: { intent: githubIntent.tool, mode: result.data?.mode, githubContext: githubCtx },
          };
        } else {
          return {
            text: formatGitHubError(result.error),
            model: 'serginho-intent',
            provider: 'serginho-tools',
            traceId,
            orchestrationTime: Date.now() - orchestrationStartTime,
            _meta: { intent: githubIntent.tool, errorCode: result.error.code, githubContext: githubCtx },
          };
        }
      }
    }
    // Fim do bloco GitHub intent

    // Injeta resumo do contexto GitHub (se disponível) para perguntas de acompanhamento
    const githubCtxSummary = githubCtx ? getContextSummary(githubCtx) : null;
    const effectiveMessage = githubCtxSummary
      ? `[Contexto GitHub]\n${githubCtxSummary}\n\n${message}`
      : message;

    // 1. Analyze complexity
    const analysisStartTime = Date.now();
    const analysis = analyzeComplexity(message);
    // Pass enabledProviders so the router knows Gemini availability BEFORE routing.
    // Without this, geminiAvailable defaults to true and the router may select gemini-pro
    // even when GEMINI_API_KEY is absent — causing a callGemini throw + silent fallback.
    // With this, the router correctly degrades to llama-120b when Gemini is unavailable.
    const enabledProvidersList = getEnabledProviders();
    const routing = routeToProvider(analysis, { enabledProviders: enabledProvidersList });
    const analysisTime = Date.now() - analysisStartTime;

    console.log('[Serginho] Complexity:', analysis.scores.complexity, '→ Provider:', routing.provider);
    console.log('[Serginho] Trace ID:', traceId);
    console.log('[Serginho] Enabled providers:', enabledProvidersList);

    // 2. Try primary provider (or forced provider)
    let attemptedModels = [];
    let warnings = [];
    let currentProvider = options.forceProvider || routing.provider;
    let fallbackLevel = 0;

    // Phase A5.7: Guard against forcing a disabled provider (e.g., Gemini without GEMINI_API_KEY)
    // IMPORTANT: When forceProvider is explicitly requested and the provider is disabled,
    // we throw a clear error instead of silently falling back to another provider.
    // This prevents confusing UX where toggle ON still shows Groq responses.
    if (options.forceProvider && !enabledProvidersList.includes(options.forceProvider)) {
      const isGemini = options.forceProvider === 'gemini-pro';
      const missingKey = isGemini ? 'GEMINI_API_KEY' : 'required API key';
      const errorMsg = `Provider "${options.forceProvider}" is not available: ${missingKey} is not configured in the environment.`;
      console.error(`[Serginho] forceProvider "${options.forceProvider}" is disabled — ${missingKey} missing. Refusing silent fallback.`);
      throw new Error(errorMsg);
    }

    while (currentProvider) {
      try {
        // Check cache first
        const cacheCheckStartTime = Date.now();
        const cacheKey = this.getCacheKey(effectiveMessage, currentProvider);
        const cached = this.cache.get(cacheKey);
        const cacheCheckTime = Date.now() - cacheCheckStartTime;
        
        if (cached && !options.bypassCache) {
          console.log('[Serginho] Cache hit:', currentProvider);
          const totalOrchestrationTime = Date.now() - orchestrationStartTime;
          this.metrics.recordRequest(currentProvider, totalOrchestrationTime, true, true);
          
          // ✨ NOVO: Retornar metadata estruturada do cache
          return this._buildCachedResponse(
            cached,
            currentProvider,
            traceId,
            totalOrchestrationTime,
            analysis,
            routing,
            options
          );
        }

        // Execute with circuit breaker
        const modelExecutionStartTime = Date.now();
        const result = await this.executeWithProvider(currentProvider, {
          message: effectiveMessage,
          messages,
          context,
          analysis,
          signal,
          maxTokens: options.maxTokens,
        });
        const modelExecutionTime = Date.now() - modelExecutionStartTime;

        // Record successful attempt
        const modelId = result.model || getProviderConfig(currentProvider).model;
        attemptedModels.push({
          providerName: currentProvider,
          modelId,
          status: 'success',
          executionTime: modelExecutionTime,
          fallbackLevel
        });
        
        // ✨ NOVO: Registrar execução no ModelRegistry
        this.modelRegistry.recordExecution(modelId, true, modelExecutionTime, false);

        // Cache successful response
        this.cache.set(cacheKey, result);

        const totalOrchestrationTime = Date.now() - orchestrationStartTime;
        this.metrics.recordRequest(currentProvider, totalOrchestrationTime, true, false);

        // ✨ NOVO: Retornar metadata estruturada completa
        return this._buildSuccessResponse(
          result,
          currentProvider,
          traceId,
          orchestrationStartTime,
          modelExecutionTime,
          totalOrchestrationTime,
          analysis,
          routing,
          attemptedModels,
          warnings,
          fallbackLevel,
          options
        );

      } catch (error) {
        // A3: AbortError is neutral — no fallback, no metrics, no cache, no circuit breaker failure
        if (error.name === 'AbortError') {
          throw error;
        }

        console.error(`[Serginho] Provider ${currentProvider} failed:`, error.message);
        
        const modelExecutionTime = Date.now() - orchestrationStartTime;
        
        // Record failed attempt
        const modelId = getProviderConfig(currentProvider)?.model || currentProvider;
        const isTimeout = error.message?.includes('timeout') || error.message?.includes('timed out');
        
        attemptedModels.push({
          providerName: currentProvider,
          modelId,
          status: 'failed',
          executionTime: modelExecutionTime,
          fallbackLevel,
          error: error.message
        });
        
        // ✨ NOVO: Registrar falha no ModelRegistry
        this.modelRegistry.recordExecution(modelId, false, 0, isTimeout);
        
        this.metrics.recordRequest(currentProvider, modelExecutionTime, false, false);

        // noFallback mode: caller manages its own fallback chain without automatic cascade
        if (options.noFallback) {
          throw error;
        }
        
        // Get next fallback — use provider names for correct deduplication, skip disabled providers
        const enabledProviders = getEnabledProviders();
        let nextProvider = getNextFallback(currentProvider, attemptedModels.map(a => a.providerName));
        // Skip disabled providers (e.g., Gemini when only GROQ_API_KEY is set)
        while (nextProvider && !enabledProviders.includes(nextProvider)) {
          console.log(`[Serginho] Skipping disabled provider: ${nextProvider}`);
          nextProvider = getNextFallback(nextProvider, attemptedModels.map(a => a.providerName));
        }
        
        if (!nextProvider) {
          throw new Error(`All providers failed. Tried: ${attemptedModels.map(a => a.modelId).join(', ')}`);
        }

        // Add warning about fallback
        warnings.push({
          code: 'PROVIDER_FALLBACK',
          message: `${currentProvider} failed, falling back to ${nextProvider}`,
          severity: 'warning',
          timestamp: new Date().toISOString()
        });

        console.log('[Serginho] Falling back to:', nextProvider);
        currentProvider = nextProvider;
        fallbackLevel++;
      }
    }
    } finally {
      // A3.1: Clean shutdown — no dangling timers or listeners
      if (timer !== null) {
        clearTimeout(timer);
      }
      if (options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
    }
  }

  /**
   * ✨ NOVO: Build structured success response with full metadata
   * @private
   */
  _buildSuccessResponse(
    result,
    providerName,
    traceId,
    orchestrationStartTime,
    modelExecutionTime,
    totalOrchestrationTime,
    analysis,
    routing,
    attemptedModels,
    warnings,
    fallbackLevel,
    options
  ) {
    const config = getProviderConfig(providerName);
    const metadata = getModelMetadata(providerName);
    const circuitBreakerStates = this._getCircuitBreakerStates();

    return {
      // ✨ NOVO: Schema metadata
      _meta: {
        schemaVersion: METADATA_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        traceId,
        orchestratorVersion: ORCHESTRATOR_VERSION
      },

      // ✅ OBRIGATÓRIO: Resposta do modelo
      text: result.text,

      // ✅ OBRIGATÓRIO: Identificação do modelo (separação conceitual clara)
      model: {
        infrastructure: metadata.infrastructure,
        modelId: config.model,
        logicalTier: metadata.logicalTier,
        displayName: metadata.displayName,
        description: metadata.description,
        icon: metadata.icon
      },

      // ✅ OBRIGATÓRIO: Métricas de execução
      execution: {
        status: fallbackLevel > 0 ? 'fallback' : 'success',
        fallbackLevel,
        modelExecutionTime,
        totalOrchestrationTime,
        attemptedModels,
        circuitBreakerStates,
        warnings
      },

      // ✅ OBRIGATÓRIO: Contexto de roteamento
      routing: {
        analyzedComplexity: analysis.scores.complexity,
        selectedTier: routing.tier,
        routingReason: options.forceProvider ? 'forced' : 'auto',
        decisionContext: {
          complexityScore: analysis.scores.complexity,
          technicalKeywords: analysis.keywords?.technical || [],
          messageLength: analysis.messageLength || 0,
          forcedProvider: options.forceProvider || null
        },
        cacheHit: false
      },

      // ✅ OBRIGATÓRIO: Informações de uso
      usage: result.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * ✨ NOVO: Build cached response with preserved metadata
   * @private
   */
  _buildCachedResponse(
    cached,
    providerName,
    traceId,
    totalOrchestrationTime,
    analysis,
    routing,
    options
  ) {
    const config = getProviderConfig(providerName);
    const metadata = getModelMetadata(providerName);
    const circuitBreakerStates = this._getCircuitBreakerStates();

    return {
      // ✨ NOVO: Schema metadata
      _meta: {
        schemaVersion: METADATA_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        traceId,
        orchestratorVersion: ORCHESTRATOR_VERSION
      },

      // ✅ OBRIGATÓRIO: Resposta do modelo (do cache)
      text: cached.text,

      // ✅ OBRIGATÓRIO: Identificação do modelo (preservada do cache)
      model: {
        infrastructure: metadata.infrastructure,
        modelId: config.model,
        logicalTier: metadata.logicalTier,
        displayName: metadata.displayName,
        description: metadata.description,
        icon: metadata.icon
      },

      // ✅ OBRIGATÓRIO: Métricas de execução (cache)
      execution: {
        status: 'cached',
        fallbackLevel: 0,
        modelExecutionTime: 0, // Cache não executa modelo
        totalOrchestrationTime,
        attemptedModels: [{
          modelId: config.model,
          status: 'cached',
          executionTime: 0,
          fallbackLevel: 0
        }],
        circuitBreakerStates,
        warnings: []
      },

      // ✅ OBRIGATÓRIO: Contexto de roteamento
      routing: {
        analyzedComplexity: analysis.scores.complexity,
        selectedTier: routing.tier,
        routingReason: options.forceProvider ? 'forced' : 'auto',
        decisionContext: {
          complexityScore: analysis.scores.complexity,
          technicalKeywords: analysis.keywords?.technical || [],
          messageLength: analysis.messageLength || 0,
          forcedProvider: options.forceProvider || null
        },
        cacheHit: true
      },

      // ✅ OBRIGATÓRIO: Informações de uso (preservadas do cache)
      usage: cached.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * ✨ NOVO: Get circuit breaker states for all providers
   * @private
   */
  _getCircuitBreakerStates() {
    const states = {};
    this.circuitBreakers.forEach((breaker, providerName) => {
      states[providerName] = breaker.getState(); // 'closed' | 'open' | 'half-open'
    });
    return states;
  }

  /**
   * Execute request with specific provider
   * @private
   */
  async executeWithProvider(providerName, { message, messages, context, analysis, signal, maxTokens }) {
    const config = getProviderConfig(providerName);
    const breaker = this.circuitBreakers.get(providerName);

    if (!breaker) {
      throw new Error(`Circuit breaker not found for provider: ${providerName}`);
    }

    return breaker.execute(async () => {
      switch (config.type) {
        case 'groq':
          return this.callGroq(config, message, messages, context, signal, maxTokens);
        case 'google':
          return this.callGemini(config, message, messages, context, signal, maxTokens);
        default:
          throw new Error(`Unknown provider type: ${config.type}`);
      }
    });
  }

  /**
   * Generate cache key
   * @private
   */
  getCacheKey(message, provider) {
    // Simple hash - in production, use better hashing
    return `${provider}:${message.substring(0, 100)}`;
  }

  /**
   * Call Groq API (OpenAI-compatible)
   * @private
   */
  async callGroq(config, message, messages, context, signal, maxTokens) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    const formattedMessages = this._limitMessagesForModel(
      this.formatMessages(messages, message, 'openai', context?.systemPrompt),
      config.model
    );

    const RETRYABLE_STATUSES = new Set([429, 503]);
    const MAX_ATTEMPTS = 3;

    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

      let response;
      try {
        response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model,
            messages: formattedMessages,
            ...config.defaultParams,
            ...(maxTokens ? { max_tokens: maxTokens } : {}),
          }),
          ...(signal ? { signal } : {}),
        });
      } catch (fetchError) {
        // Network-level errors (including AbortError) are not retried
        throw fetchError;
      }

      if (!response.ok) {
        if (response.status === 413) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Groq API error: 413 request_too_large ${errorText}`);
        }
        if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS) {
          // Fast backoff: 500ms on first retry, 1000ms on second retry.
          // Vercel maxDuration is 25s — the previous 2s/4s delay consumed the entire budget
          // before the fallback chain could reach Gemini (a different provider with no shared rate limit).
          // Groq rate limit (429) is per-model; failing fast and falling back to Gemini is better
          // than waiting 6s inside the same rate-limited endpoint.
          const delayMs = attempt * 500;
          const errorBody = await response.text().catch(() => '');
          lastError = new Error(`Groq API error: ${response.status} ${errorBody}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        const errorText = await response.text().catch(() => '');
        throw new Error(`Groq API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid Groq response structure');
      }

      return {
        text: data.choices[0].message.content,
        model: config.model,
        usage: data.usage || {},
      };
    }

    // All attempts exhausted on retryable errors
    throw lastError;
  }

  /**
   * Call Google Gemini API (REST, no SDK)
   * @private
   */
  async callGemini(config, message, messages, context, signal, maxTokens) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    // Build contents array from history + current message
    const contents = [];

    const systemPrompt = context?.systemPrompt;

    for (const msg of messages) {
      if (msg.role === 'system') continue; // handled via systemInstruction
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Models that only work in thinking mode reject thinkingBudget: 0.
    // Omit thinkingConfig for these models so they use native thinking behavior.
    const THINKING_ONLY_MODELS = ['gemini-3.1-pro-preview'];

    const generationConfig = {
      temperature: config.defaultParams.temperature,
      maxOutputTokens: maxTokens || config.defaultParams.maxOutputTokens,
    };

    // Keep PR #372 behavior for models that support non-thinking mode:
    // disable internal thinking to avoid timeout (Gemini 2.5 Pro thinking adds 10-20s).
    if (!THINKING_ONLY_MODELS.includes(config.model)) {
      generationConfig.thinkingConfig = {
        thinkingBudget: 0,
      };
    }

    const requestBody = {
      contents,
      generationConfig,
    };

    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const url = config.endpoint;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text().catch((e) => `(unable to parse: ${e.message})`);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error(`Invalid Gemini response structure: ${JSON.stringify(data)}`);
    }

    return {
      text: data.candidates[0].content.parts[0].text,
      model: config.model,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : {},
    };
  }

  /**
   * Limita o histórico de mensagens antes de enviar ao Groq para evitar erro 413.
   * Usa estimativa simples: ~4 chars = 1 token (aproximação; varia por idioma e tipo de conteúdo).
   * O budget de tokens é lido de providers-config.js (campo inputTokenBudget por provider),
   * eliminando o hardcode anterior que verificava o nome do modelo diretamente.
   * @private
   */
  _limitMessagesForModel(formattedMessages, model) {
    // Resolve inputTokenBudget a partir do providers-config (single source of truth).
    // Busca o provider cujo model === model passado; fallback para 12000 se não encontrado.
    const providerEntry = Object.values(PROVIDERS).find((p) => p.model === model);
    const INPUT_TOKEN_BUDGET = providerEntry?.inputTokenBudget ?? 12000;
    const CHARS_PER_TOKEN = 4; // estimativa simples para cálculo de truncamento

    if (!formattedMessages || formattedMessages.length === 0) {
      return formattedMessages;
    }

    const maxChars = INPUT_TOKEN_BUDGET * CHARS_PER_TOKEN;

    const totalChars = formattedMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalChars <= maxChars) {
      return formattedMessages;
    }

    // Preserva system message (primeiro, se role === 'system') e última mensagem do usuário
    const systemMsg = formattedMessages[0]?.role === 'system' ? formattedMessages[0] : null;
    const lastUserMsg = formattedMessages[formattedMessages.length - 1];

    if (!lastUserMsg) {
      return formattedMessages;
    }

    const middle = formattedMessages.slice(systemMsg ? 1 : 0, -1);

    // Remove mensagens mais antigas até caber no budget
    const reserved = (systemMsg ? systemMsg.content.length : 0) + (lastUserMsg.content?.length || 0);
    let budget = maxChars - reserved;
    const kept = [];
    for (let i = middle.length - 1; i >= 0; i--) {
      const len = middle[i].content?.length || 0;
      if (budget - len >= 0) {
        kept.unshift(middle[i]);
        budget -= len;
      } else {
        break;
      }
    }

    const truncated = [
      ...(systemMsg ? [systemMsg] : []),
      ...kept,
      lastUserMsg,
    ];

    const removed = formattedMessages.length - truncated.length;
    if (removed > 0) {
      console.log(`[Serginho] _limitMessagesForModel: truncou ${removed} mensagem(ns) do histórico para o modelo ${model} (total original: ~${Math.round(totalChars / CHARS_PER_TOKEN)} tokens estimados)`);
    }
    return truncated;
  }

  /**
   * Format messages for different API formats
   * @private
   */
  formatMessages(messages, currentMessage, format, systemPrompt) {
    const allMessages = [
      ...messages,
      { role: 'user', content: currentMessage }
    ];

    // Formato OpenAI/Groq — injeta mensagem de sistema quando fornecida
    if (systemPrompt) {
      const withoutSystem = allMessages.filter(msg => msg.role !== 'system');
      return [{ role: 'system', content: systemPrompt }, ...withoutSystem];
    }
    return allMessages;
  }

  // =========================================================
  // MÓDULO: routeByIntent (migrado de SerginhoContextual v2.0)
  // Roteamento por intenção conversacional (casual/technical/deep)
  // Compatível com Multi-Orch v2.1.0 – sem estado global
  // =========================================================

  /**
   * Detecta intenção conversacional do prompt.
   * @param {string} prompt
   * @returns {'casual'|'technical'|'deep'}
   */
  detectIntentShift(prompt) {
    const casualPatterns = [
      /^(oi|olá|hey|hi|hello|e aí)/i,
      /^(tudo bem|como vai|how are you)/i,
      /^(obrigad|thanks|thank you)/i,
      /^(tchau|bye|até)/i,
    ];
    if (casualPatterns.some((p) => p.test(prompt))) return 'casual';

    const technicalKeywords = [
      'react', 'node', 'javascript', 'python', 'api', 'código',
      'function', 'class', 'component', 'debug', 'error',
      'implementar', 'criar', 'desenvolver',
    ];
    const lower = prompt.toLowerCase();
    if (technicalKeywords.some((k) => lower.includes(k))) return 'technical';

    return 'deep';
  }

  /**
   * Roteia a requisição com base na intenção conversacional.
   * Mapeia intenção → tier do ModelRegistry:
   *   casual    → 'simple'
   *   technical → 'complex'
   *   deep      → 'complex'
   *
   * @param {string} message
   * @param {object} [options={}]
   * @returns {Promise<object>} Resposta estruturada do handleRequest
   */
  async routeByIntent(message, options = {}) {
    const intent = this.detectIntentShift(message);
    const intentToTier = { casual: 'simple', technical: 'complex', deep: 'complex' };
    const tier = intentToTier[intent] || 'complex';

    console.log(`[Serginho] routeByIntent: ${intent} → tier:${tier}`);

    return this.handleRequest({
      message,
      messages: options.messages || [],
      context: { ...options.context, intentTier: tier, intent },
      options: { ...options, _intentRouting: intent },
    });
  }

  // =========================================================
  // MÓDULO: betinhoParallel (migrado de SerginhoContextual v2.0)
  // Execução paralela dos providers disponíveis (Promise.any)
  // Compatível com Multi-Orch v2.1.0 – sem estado global
  // =========================================================

  /**
   * Modo Betinho Hybrid: executa múltiplos providers em paralelo
   * e retorna o primeiro que responder com sucesso.
   *
   * @param {string} message
   * @param {object} [options={}]
   * @returns {Promise<object>} Resposta estruturada do provider mais rápido
   */
  async betinhoParallel(message, options = {}) {
    console.log('[Serginho] betinhoParallel: resolving enabled providers...');

    // Only race providers whose env vars are actually configured, ordered by weight
    const providers = getWeightedProviders();
    if (providers.length === 0) {
      throw new Error('betinhoParallel: nenhum provider configurado');
    }

    // Single-provider safe mode: no unnecessary race
    if (providers.length === 1) {
      console.log(`[Serginho] betinhoParallel: single-provider mode → ${providers[0]}`);
      const result = await this.handleRequest({
        message,
        messages: options.messages || [],
        context: options.context || {},
        options: { ...options, forceProvider: providers[0] },
      });
      return { ...result, _betinhoParallel: true, source: 'single' };
    }

    // Multi-provider parallel mode
    console.log(`[Serginho] betinhoParallel: racing ${providers.length} providers...`);
    const promises = providers.map((provider) =>
      this.handleRequest({
        message,
        messages: options.messages || [],
        context: options.context || {},
        options: { ...options, forceProvider: provider },
      })
    );

    try {
      const result = await Promise.any(promises);
      return { ...result, _betinhoParallel: true, source: 'parallel' };
    } catch {
      throw new Error('betinhoParallel: todos os providers falharam');
    }
  }

  // =========================================================
  // MÓDULO: delegateSpecialists (migrado de Serginho.js v1)
  // Roteamento por capacidade para especialistas registrados
  // Compatível com Multi-Orch v2.1.0 – sem estado global
  // =========================================================

  /**
   * Mapa de palavras-chave → capacidade de especialista.
   * @private
   */
  _getSpecialistIntentMap() {
    return {
      'código|programação|javascript|python|java|typescript|react|node': 'code',
      'design|ui|ux|interface|visual|layout|css': 'design',
      'marketing|vendas|negócio|estratégia|campanha': 'marketing',
      'dados|análise|estatística|gráfico|dashboard|data': 'data-analysis',
      'segurança|vulnerabilidade|criptografia|pentest': 'security',
      'performance|otimização|velocidade|cache|latência': 'performance',
      'acessibilidade|wcag|a11y|aria': 'accessibility',
      'documentação|escrita|conteúdo|artigo|relatório': 'technical-writing',
    };
  }

  /**
   * Analisa o prompt e retorna a capacidade primária do especialista.
   * @param {string} prompt
   * @returns {{ primaryCapability: string, confidence: number }}
   */
  analyzeSpecialistIntent(prompt) {
    const intentMap = this._getSpecialistIntentMap();
    for (const [keywords, capability] of Object.entries(intentMap)) {
      if (new RegExp(keywords, 'i').test(prompt)) {
        return { primaryCapability: capability, confidence: 0.8 };
      }
    }
    return { primaryCapability: 'teaching', confidence: 0.5 };
  }

  /**
   * Delega a requisição para o especialista mais adequado.
   * Recebe um mapa de especialistas no formato:
   *   { [id]: { id, name, category, systemPrompt, capabilities: string[] } }
   *
   * @param {string} message
   * @param {object} specialistsMap - Mapa de especialistas disponíveis
   * @param {object} [options={}]
   * @returns {Promise<object>} Resposta estruturada com metadado do especialista
   */
  async delegateSpecialists(message, specialistsMap = {}, options = {}) {
    const { primaryCapability } = this.analyzeSpecialistIntent(message);

    // Encontrar especialistas com a capacidade necessária
    const candidates = Object.values(specialistsMap).filter(
      (s) => Array.isArray(s.capabilities) && s.capabilities.includes(primaryCapability)
    );

    // Fallback para o primeiro especialista disponível
    const selected = candidates[0] || Object.values(specialistsMap)[0];

    if (!selected) {
      // Sem especialistas → delegar ao orquestrador diretamente
      console.log('[Serginho] delegateSpecialists: sem especialistas, usando orquestrador direto');
      return this.handleRequest({ message, messages: options.messages || [], context: options.context || {}, options });
    }

    console.log(`[Serginho] delegateSpecialists: capability=${primaryCapability} → specialist=${selected.id}`);

    return this.handleRequest({
      message,
      messages: options.messages || [],
      context: { ...options.context, specialistId: selected.id },
      options: {
        ...options,
        systemPrompt: selected.systemPrompt || options.systemPrompt,
        sessionId: `specialist-${selected.id}-${options.sessionId || 'default'}`,
      },
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics.reset();
  }

  /**
   * Reset all circuit breakers (for testing)
   */
  resetCircuitBreakers() {
    this.circuitBreakers.forEach((breaker) => {
      breaker.reset();
    });
  }

  /**
   * Detecta se a mensagem é uma pergunta puramente conceitual/estratégica que não depende
   * de dados GitHub carregados. Quando retorna `true`, o fluxo ignora toda a cadeia de
   * follow-up GitHub e a mensagem vai diretamente para o LLM.
   *
   * Padrões detectados (PT-BR e EN):
   *   - Palavras-chave explícitas de abstração: "conceitualmente", "teoricamente", etc.
   *   - Instruções explícitas de ignorar GitHub: "sem usar github", "sem pedir arquivos"
   *   - Perguntas "o que é / what is" sobre termos conceituais (sem referência a repo/arquivo)
   *   - Mensagens longas (>MIN_CONCEPTUAL_MESSAGE_LENGTH chars) sem nenhuma referência GitHub detectável
   *
   * (reversível: remover este método e o bloco de guarda acima)
   *
   * @param {string} message
   * @returns {boolean}
   */
  _isConceptualPrompt(message) {
    if (!message || typeof message !== 'string') return false;

    const trimmed = message.trim();
    if (!trimmed) return false;

    // Explicit conceptual/abstract language markers (PT-BR)
    if (/\b(conceitualmente|conceptualmente|teoricamente|em teoria|de forma abstrata|abstratamente)\b/i.test(trimmed)) return true;

    // Explicit conceptual/abstract language markers (EN)
    if (/\b(conceptually|theoretically|in theory|abstractly|in abstract terms)\b/i.test(trimmed)) return true;

    // Explicit instruction to skip GitHub context (PT-BR)
    if (/sem\s+usar\s+github/i.test(trimmed)) return true;
    if (/sem\s+pedir\s+arquivos?/i.test(trimmed)) return true;
    if (/sem\s+depender\s+de\s+contexto/i.test(trimmed)) return true;
    if (/sem\s+contexto\s+(carregado|github)/i.test(trimmed)) return true;

    // Explicit instruction to skip GitHub context (EN)
    if (/without\s+(using\s+)?github/i.test(trimmed)) return true;
    if (/without\s+loading\s+(files?|repos?|context)/i.test(trimmed)) return true;
    if (/no\s+github\s+context/i.test(trimmed)) return true;

    // Conceptual explanation requests (PT-BR): "explique a diferença entre X e Y"
    if (/\bexplique\b.{0,150}\bdiferença\b/i.test(trimmed)) return true;

    // Conceptual "what is" questions (PT-BR) — only when no GitHub-specific terms present
    if (/^o que (é|são|representa[m]?)/i.test(trimmed) && !_hasGitHubReference(trimmed)) return true;

    // Conceptual "what is" questions (EN) — only when no GitHub-specific terms present
    if (/^what (is|are|does)\b/i.test(trimmed) && !_hasGitHubReference(trimmed)) return true;

    // Long messages (>MIN_CONCEPTUAL_MESSAGE_LENGTH chars) with no detectable GitHub references are likely conceptual
    if (trimmed.length > MIN_CONCEPTUAL_MESSAGE_LENGTH && !_hasGitHubReference(trimmed)) return true;

    return false;
  }

  /**
   * Classifica a intenção de um prompt antes do fluxo de follow-up GitHub.
   * Thin wrapper sobre o módulo `promptIntentClassifier` para uso externo/teste.
   *
   * Retorna uma das três intenções:
   *   - 'conceptual'    → responde direto, sem pedir contexto GitHub
   *   - 'repo_analysis' → pode exigir contexto de repo
   *   - 'mixed'         → responde parte conceitual; sinaliza que parte factual depende de contexto
   *
   * @param {string} message
   * @returns {{ intent: 'conceptual'|'repo_analysis'|'mixed', confidence: number }}
   */
  classifyPromptIntent(message) {
    return classifyPromptIntent(message);
  }

  /**
   * ✨ NOVO: Get Model Registry snapshot (for debugging)
   * Returns complete performance stats for all models
   * 
   * @returns {object} Registry snapshot with all model stats
   */
  getModelRegistrySnapshot() {
    return this.modelRegistry.getSnapshot();
  }

  /**
   * ✨ NOVO: Get health scores for all models in a tier
   * Useful for debugging adaptive routing decisions
   * 
   * @param {string} tier - Tier name ('simple' | 'complex')
   * @returns {array} Models with health scores
   */
  getModelHealthScores(tier) {
    const models = this.modelRegistry.getModelsByTier(tier);
    return models.map(model => ({
      modelId: model.modelId,
      healthScore: model.healthScore,
      consistency: model.consistency,
      stability: model.stability,
      confidence: model.confidence,
      totalCalls: model.totalCalls,
      successRate: model.totalCalls > 0 ? (model.successCount / model.totalCalls) : 0,
      averageExecutionTime: model.averageExecutionTime,
      circuitBreakerState: this.modelRegistry.getCircuitBreakerState(model.modelId)
    })).sort((a, b) => b.healthScore - a.healthScore);
  }
}

// Export singleton instance
export default new SerginhoOrchestrator();
