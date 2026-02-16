/**
 * SERGINHO - Orquestrador Principal
 * Coordena 55+ especialistas
 * Roteamento inteligente de tarefas
 * Gerenciamento de cache global
 * 
 * Uses aiAdapter for provider-agnostic AI operations
 */

import AgentBase from "../core/AgentBase.js";
import SpecialistRegistry from "../core/SpecialistRegistry.js";
import IntelligentCache from "../../cache/IntelligentCache.js";
import { askAI, analyzeCode, complexTask, simpleQuery } from "../../utils/aiAdapter.js";

class Serginho extends AgentBase {
  constructor(config = {}) {
    super({
      id: "serginho",
      name: "Serginho",
      role: "Orquestrador Principal",
      mode: "AUTONOMOUS",
      ...config,
    });

    // Registro de especialistas (escalável)
    this.registry = new SpecialistRegistry();

    // Cache global compartilhado
    this.globalCache = new IntelligentCache({ maxMemory: 1024 });

    // Fila de tarefas
    this.taskQueue = [];
    this.maxConcurrentTasks = 10;
    this.activeTasks = new Map();

    // Roteador de especialistas
    this.router = new TaskRouter();

    // Configuração
    this.config = {
      taskTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Processar Requisição (Sobrescreve AgentBase)
   * Roteador inteligente para especialistas
   */
  async process(prompt, context = {}) {
    try {
      // 1. VALIDAÇÃO DE SEGURANÇA
      const securityAnalysis = this.modelArmor.analyzePrompt(prompt);

      if (securityAnalysis.recommendation === "BLOCK") {
        return {
          status: "BLOCKED",
          reason: "Prompt violates security policies",
          violations: securityAnalysis.violations,
          timestamp: Date.now(),
        };
      }

      // 2. BUSCA EM CACHE GLOBAL
      const cacheKey = this.cache.generateKey(this.id, prompt, context);
      const cachedResponse = this.cache.get(cacheKey);

      if (cachedResponse) {
        this._addToHistory(prompt, cachedResponse, "CACHE", null);
        return {
          status: "SUCCESS",
          source: "CACHE",
          response: cachedResponse,
          agent: "serginho",
          timestamp: Date.now(),
        };
      }

      // 3. ROTEAMENTO INTELIGENTE
      const selectedSpecialist = await this._routeToSpecialist(prompt, context);

      if (!selectedSpecialist) {
        return {
          status: "ERROR",
          reason: "No suitable specialist found",
          timestamp: Date.now(),
        };
      }

      // 4. DELEGAÇÃO PARA ESPECIALISTA
      const result = await this._delegateToSpecialist(selectedSpecialist, prompt, context);

      // 5. ARMAZENAR EM CACHE GLOBAL
      this.globalCache.set(cacheKey, result.response, "specialist-response");

      // 6. ADICIONAR AO HISTÓRICO
      this._addToHistory(prompt, result.response, "AUTONOMOUS", null);

      return {
        status: "SUCCESS",
        source: "SPECIALIST",
        response: result.response,
        agent: selectedSpecialist.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: "ERROR",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Roteamento Inteligente para Especialista
   */
  async _routeToSpecialist(prompt, context) {
    // Análise de prompt para determinar especialista ideal
    const analysis = this._analyzePromptIntent(prompt);

    // Buscar especialistas por capacidade
    const candidates = this.registry.findByCapability(analysis.primaryCapability);

    if (candidates.length === 0) {
      // Fallback: usar especialista genérico
      return this.registry.getSpecialistMetadata("didak");
    }

    // Selecionar melhor candidato baseado em:
    // 1. Modo (AUTONOMOUS preferido)
    // 2. Cache hit rate
    // 3. Disponibilidade
    const selected = candidates.sort((a, b) => {
      const aScore = this._calculateSpecialistScore(a);
      const bScore = this._calculateSpecialistScore(b);
      return bScore - aScore;
    })[0];

    return selected;
  }

  /**
   * Analisar Intenção do Prompt
   */
  _analyzePromptIntent(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Mapeamento simples de intenção → capacidade
    const intentMap = {
      "código|programação|javascript|python|java": "code",
      "design|ui|ux|interface|visual": "design",
      "marketing|vendas|negócio|estratégia": "marketing",
      "dados|análise|estatística|gráfico": "data-analysis",
      "segurança|vulnerabilidade|criptografia": "security",
      "performance|otimização|velocidade": "performance",
      "acessibilidade|wcag|a11y": "accessibility",
      "documentação|escrita|conteúdo": "technical-writing",
    };

    for (const [keywords, capability] of Object.entries(intentMap)) {
      const regex = new RegExp(keywords, "i");
      if (regex.test(lowerPrompt)) {
        return {
          primaryCapability: capability,
          confidence: 0.8,
        };
      }
    }

    // Default: didática (ensino)
    return {
      primaryCapability: "teaching",
      confidence: 0.5,
    };
  }

  /**
   * Calcular Score do Especialista
   */
  _calculateSpecialistScore(specialist) {
    let score = 0;

    // Modo AUTONOMOUS é preferido
    if (specialist.mode === "AUTONOMOUS") {
      score += 50;
    }

    // Especialistas carregados têm prioridade
    const loaded = this.registry.getSpecialist(specialist.id);
    if (loaded) {
      score += 30;
    }

    // Menos recentemente usado tem prioridade
    // (para balancear carga)
    score += Math.random() * 20;

    return score;
  }

  /**
   * Delegar para Especialista
   */
  async _delegateToSpecialist(specialist, prompt, context) {
    try {
      // Carregar especialista (lazy loading)
      const loaded = await this.registry.loadSpecialist(specialist.id);

      // Simular chamada de API do especialista
      const response = await this._callSpecialistAPI(loaded, prompt, context);

      return {
        response,
        specialist: specialist.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error delegating to ${specialist.id}:`, error);
      throw error;
    }
  }

  /**
   * Chamar API do Especialista (Implementação)
   * Uses aiAdapter for provider-agnostic AI operations
   */
  async _callSpecialistAPI(specialist, prompt, context) {
    // Determine task type from prompt and context
    const taskType = this._determineTaskType(prompt, context);
    
    let result;
    
    try {
      // Execute using appropriate aiAdapter method
      switch (taskType) {
        case 'code':
          result = await analyzeCode(prompt, context.language || 'javascript');
          break;
        case 'complex':
          result = await complexTask(prompt, context.requirements || {});
          break;
        case 'simple':
          result = await simpleQuery(prompt);
          break;
        default:
          result = await askAI(prompt, context);
      }
      
      // Return the AI response
      return result.answer || result.response || `Response from ${specialist.name}: ${prompt.substring(0, 50)}...`;
    } catch (error) {
      return this._handleAIError(error, specialist);
    }
  }

  /**
   * Determine task type from prompt analysis
   * @private
   */
  _determineTaskType(prompt, context) {
    if (context.type) {
      return context.type;
    }
    
    // Detect code
    if (this._isCodeQuery(prompt)) {
      return 'code';
    }
    
    // Detect complex task
    if (this._isComplexTask(prompt)) {
      return 'complex';
    }
    
    // Detect simple query
    if (this._isSimpleQuery(prompt)) {
      return 'simple';
    }
    
    return 'general';
  }

  /**
   * Check if prompt is a code query
   * @private
   */
  _isCodeQuery(prompt) {
    const codePatterns = [
      /```[\s\S]*```/,
      /function\s+\w+/,
      /class\s+\w+/,
      /import\s+.*from/,
      /const\s+\w+\s*=/,
      /def\s+\w+/,
      /public\s+class/,
    ];
    
    return codePatterns.some(pattern => pattern.test(prompt));
  }

  /**
   * Check if prompt is a complex task
   * @private
   */
  _isComplexTask(prompt) {
    const complexKeywords = [
      'arquitetura',
      'architecture',
      'design pattern',
      'implementar',
      'implement',
      'sistema',
      'system',
      'refatorar',
      'refactor',
      'otimizar',
      'optimize',
      'análise',
      'analysis',
      'resolver',
      'solve',
      'microservices',
      'cqrs',
      'event sourcing',
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    return complexKeywords.some(keyword => lowerPrompt.includes(keyword)) 
           || prompt.length > 200;
  }

  /**
   * Check if prompt is a simple query
   * @private
   */
  _isSimpleQuery(prompt) {
    return prompt.length < 30;
  }

  /**
   * Handle AI errors uniformly
   * @private
   */
  _handleAIError(error, specialist) {
    console.error('Serginho AI error:', error);
    
    if (error.message.includes('Circuit breaker')) {
      throw new Error('Service temporarily unavailable. AI service is recovering. Please try again.');
    }
    
    if (error.message.includes('Timeout')) {
      throw new Error('Request timeout. Request took too long. Try a simpler query.');
    }
    
    // Fallback to basic response
    return `Response from ${specialist.name}: I encountered an error processing your request.`;
  }

  /**
   * Chamar API (Implementação do AgentBase)
   */
  async _callAPI(prompt, context) {
    // Serginho delega para especialistas, não chama API diretamente
    throw new Error("Serginho does not call API directly. Use process() instead.");
  }

  /**
   * Registrar Especialista
   */
  registerSpecialist(specialistId, metadata) {
    this.registry.registerSpecialist(specialistId, metadata);
  }

  /**
   * Registrar Múltiplos Especialistas
   */
  registerSpecialists(specialists) {
    for (const specialist of specialists) {
      this.registerSpecialist(specialist.id, specialist);
    }
  }

  /**
   * Obter Estatísticas Globais
   */
  getGlobalStats() {
    const registryStats = this.registry.getStats();
    const cacheStats = this.globalCache.getStats();

    return {
      serginho: {
        uptime: Date.now() - this.createdAt,
        mode: this.mode,
      },
      registry: registryStats,
      cache: cacheStats,
      activeTasks: this.activeTasks.size,
      taskQueue: this.taskQueue.length,
    };
  }

  /**
   * Gerar Relatório Global
   */
  generateGlobalReport() {
    const stats = this.getGlobalStats();

    return `
╔════════════════════════════════════════╗
║     SERGINHO - GLOBAL REPORT           ║
╚════════════════════════════════════════╝

Serginho Status:
- Mode: ${stats.serginho.mode}
- Uptime: ${(stats.serginho.uptime / 1000 / 60).toFixed(2)} minutes

Specialists Registry:
- Total: ${stats.registry.totalSpecialists}
- Loaded: ${stats.registry.loadedSpecialists}
- Memory: ${stats.registry.memoryUsage}

Global Cache:
- Hit Rate: ${stats.cache.hitRate}
- Hits: ${stats.cache.hits}
- Misses: ${stats.cache.misses}
- Estimated Savings: ${stats.cache.estimatedSavings}

Task Management:
- Active Tasks: ${stats.activeTasks}
- Queue Size: ${stats.taskQueue}

Timestamp: ${new Date().toISOString()}
`;
  }
}

/**
 * TASK ROUTER - Roteador de Tarefas
 */
class TaskRouter {
  constructor() {
    this.routes = new Map();
  }

  registerRoute(pattern, specialistId) {
    this.routes.set(pattern, specialistId);
  }

  findRoute(prompt) {
    for (const [pattern, specialistId] of this.routes) {
      if (pattern.test(prompt)) {
        return specialistId;
      }
    }
    return null;
  }
}

export default Serginho;
