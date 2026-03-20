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

// Versão do orquestrador (para versionamento de schema)
const ORCHESTRATOR_VERSION = '2.1.0';
const METADATA_SCHEMA_VERSION = '1.0.0';

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
    // Groq models (complex tier)
    this.modelRegistry.registerModel('llama-3.3-70b-versatile', 'complex', 0.00);
    this.modelRegistry.registerModel('llama-3.1-70b-versatile', 'complex', 0.00);
    this.modelRegistry.registerModel('llama-3.1-8b-instant', 'simple', 0.00);
    this.modelRegistry.registerModel('mixtral-8x7b-32768', 'simple', 0.00);
    
    // Gemini models
    this.modelRegistry.registerModel('gemini-2.0-flash-exp', 'complex', 0.0001);
    
    // OpenAI models
    this.modelRegistry.registerModel('gpt-4o-mini', 'simple', 0.0002);
  }

  /**
   * Initialize circuit breakers for all providers
   */
  initializeCircuitBreakers() {
    Object.keys(PROVIDERS).forEach(provider => {
      this.circuitBreakers.set(provider, new CircuitBreaker({
        name: provider,
        timeout: 8000, // 8s per provider (safe for 12s serverless limit)
        failureThreshold: 3,
        resetTimeout: 30000, // 30s cooldown
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
    const isSpecialistRequest = Boolean(context.specialistId || context.source === 'specialist-api');
    if (isSpecialistRequest) {
      // Injeta systemPrompt do especialista via options se presente no contexto
      const specialistOptions = context.specialistSystemPrompt
        ? { ...options, systemPrompt: context.specialistSystemPrompt }
        : options;

      const analysis = analyzeComplexity(message);
      const routing = routeToProvider(analysis);
      const enabledProvidersList = getEnabledProviders();
      let currentProvider = specialistOptions.forceProvider || routing.provider;
      if (specialistOptions.forceProvider && !enabledProvidersList.includes(specialistOptions.forceProvider)) {
        currentProvider = routing.provider;
      }
      const cacheKey = this.getCacheKey(message, currentProvider);
      const cached = this.cache.get(cacheKey);
      if (cached && !specialistOptions.bypassCache) {
        const totalOrchestrationTime = Date.now() - orchestrationStartTime;
        this.metrics.recordRequest(currentProvider, totalOrchestrationTime, true, true);
        return this._buildCachedResponse(cached, currentProvider, traceId, totalOrchestrationTime, analysis, routing, specialistOptions);
      }
      const result = await this.executeWithProvider(currentProvider, {
        message,
        messages,
        context,
        analysis,
        signal,
      });
      const modelExecutionTime = Date.now() - orchestrationStartTime;
      const totalOrchestrationTime = modelExecutionTime;
      this.metrics.recordRequest(currentProvider, totalOrchestrationTime, true, false);
      const modelId = getProviderConfig(currentProvider)?.model || currentProvider;
      this.modelRegistry.recordExecution(modelId, true, modelExecutionTime, false);
      this.cache.set(cacheKey, { text: result.text, usage: result.usage });
      return this._buildSuccessResponse(result, currentProvider, traceId, orchestrationStartTime, modelExecutionTime, totalOrchestrationTime, analysis, routing, [], [], 0, specialistOptions);
    }
    // Fim do specialist bypass

    // GitHub conversation context — per-request, in-memory (reversível: remover bloco abaixo)
    // Cópia rasa é suficiente: todos os campos do contexto são primitivos (strings/null).
    const githubCtx = context.githubContext
      ? { ...context.githubContext }
      : createGitHubContext();

    // GitHub execution dependencies — sem re-fetch (reversível: remover este bloco)
    if (!context._skipExecutionDependenciesCheck && isExecutionDependenciesFollowUp(message)) {
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
    if (!context._skipAcceptanceCriteriaCheck && isAcceptanceCriteriaFollowUp(message)) {
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
    if (!context._skipExecutionChecklistCheck && isExecutionChecklistFollowUp(message)) {
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
    if (!context._skipActionPlanCheck && isActionPlanFollowUp(message)) {
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
    if (!context._skipRecommendationCheck && isActionRecommendationFollowUp(message)) {
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
    if (!context._skipComparisonCheck && isComparativeFollowUp(message)) {
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
    if (!context._skipAnalyticalCheck && isAnalyticalFollowUp(message)) {
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
    const githubIntent = detectGitHubIntent(message);
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
    const githubCtxSummary = getContextSummary(githubCtx);
    const effectiveMessage = githubCtxSummary
      ? `[Contexto GitHub]\n${githubCtxSummary}\n\n${message}`
      : message;

    // 1. Analyze complexity
    const analysisStartTime = Date.now();
    const analysis = analyzeComplexity(message);
    const routing = routeToProvider(analysis);
    const analysisTime = Date.now() - analysisStartTime;

    console.log('[Serginho] Complexity:', analysis.scores.complexity, '→ Provider:', routing.provider);
    console.log('[Serginho] Trace ID:', traceId);

    // 2. Try primary provider (or forced provider)
    let attemptedModels = [];
    let warnings = [];
    let currentProvider = options.forceProvider || routing.provider;
    let fallbackLevel = 0;

    // Phase A5.7: Guard against forcing a disabled provider (e.g., Gemini without GOOGLE_API_KEY)
    const enabledProvidersList = getEnabledProviders();
    if (options.forceProvider && !enabledProvidersList.includes(options.forceProvider)) {
      console.warn(`[Serginho] forceProvider "${options.forceProvider}" is disabled (missing API key). Falling back to auto-route: ${routing.provider}`);
      warnings.push({
        code: 'FORCED_PROVIDER_DISABLED',
        message: `Requested provider "${options.forceProvider}" is disabled. Using ${routing.provider} instead.`,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      currentProvider = routing.provider;
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
  async executeWithProvider(providerName, { message, messages, context, analysis, signal }) {
    const config = getProviderConfig(providerName);
    const breaker = this.circuitBreakers.get(providerName);

    if (!breaker) {
      throw new Error(`Circuit breaker not found for provider: ${providerName}`);
    }

    return breaker.execute(async () => {
      switch (config.type) {
        case 'gemini':
          return this.callGemini(config, message, messages, context, signal);
        case 'groq':
          return this.callGroq(config, message, messages, context, signal);
        case 'openai':
          return this.callOpenAI(config, message, messages, context, signal);
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
   * Call Gemini API
   * @private
   */
  async callGemini(config, message, messages, context, signal) {
    const formattedMessages = this.formatMessages(messages, message, 'gemini');
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: config.generationConfig,
      }),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid Gemini response structure');
    }

    return {
      text: data.candidates[0].content.parts[0].text,
      model: config.model,
      usage: data.usageMetadata || {},
    };
  }

  /**
   * Call Groq API (OpenAI-compatible)
   * @private
   */
  async callGroq(config, message, messages, context, signal) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    const formattedMessages = this.formatMessages(messages, message, 'openai', context?.systemPrompt);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: formattedMessages,
        ...config.defaultParams,
      }),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
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

  /**
   * Call OpenAI API (future support)
   * @private
   */
  async callOpenAI(config, message, messages, context, signal) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const formattedMessages = this.formatMessages(messages, message, 'openai');
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: formattedMessages,
        ...config.defaultParams,
      }),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      model: config.model,
      usage: data.usage || {},
    };
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

    if (format === 'gemini') {
      return allMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }

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
