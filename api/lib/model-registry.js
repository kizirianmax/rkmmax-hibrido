/**
 * Model Registry - Lean Implementation
 * 
 * Rastreia performance histórica de modelos de IA para roteamento adaptativo.
 * Estratégia: Quality-First com complexidade reduzida (~30% menor).
 * 
 * @version 1.0.0
 * @author Manus
 * @date 2026-02-18
 */

// Constantes
const WARMUP_THRESHOLD = 10;
const MAX_RECENT_EXECUTIONS = 50;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const SIMILARITY_THRESHOLD = 0.05; // Para tiebreaker de custo
const CONFIDENCE_THRESHOLD = 50;

/**
 * ModelRegistry Singleton
 * Mantém estatísticas de performance de modelos em memória.
 */
class ModelRegistry {
  constructor() {
    if (ModelRegistry.instance) {
      return ModelRegistry.instance;
    }

    this.registry = new Map();
    this.circuitBreakers = new Map();
    
    ModelRegistry.instance = this;
  }

  /**
   * Inicializa estatísticas para um modelo
   */
  _initModelStats(modelId, tier, costPerToken = 0) {
    return {
      // Contadores básicos
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      
      // Métricas de performance (janela limitada)
      averageExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
      recentExecutions: [],
      
      // Metadata
      lastUsedAt: null,
      tier,
      costPerToken,
      
      // Scores calculados
      healthScore: 0,
      consistency: 0,
      stability: 0,
      confidence: 0,
      
      // Warm-up
      warmupComplete: false,
      
      // Circuit breaker
      consecutiveFailures: 0
    };
  }

  /**
   * Registra um modelo no registry
   */
  registerModel(modelId, tier, costPerToken = 0) {
    if (!this.registry.has(modelId)) {
      this.registry.set(modelId, this._initModelStats(modelId, tier, costPerToken));
      this.circuitBreakers.set(modelId, { state: 'closed', openedAt: null });
    }
  }

  /**
   * Atualiza estatísticas após uma execução
   */
  recordExecution(modelId, success, executionTime, isTimeout = false) {
    const stats = this.registry.get(modelId);
    if (!stats) {
      console.warn(`[ModelRegistry] Model ${modelId} not registered`);
      return;
    }

    // Atualizar contadores
    stats.totalCalls++;
    stats.lastUsedAt = new Date().toISOString();

    if (success) {
      stats.successCount++;
      stats.consecutiveFailures = 0;
      
      // Fechar circuit breaker se estava aberto
      const cb = this.circuitBreakers.get(modelId);
      if (cb.state === 'half-open') {
        cb.state = 'closed';
        cb.openedAt = null;
      }
    } else {
      stats.failureCount++;
      stats.consecutiveFailures++;
      
      if (isTimeout) {
        stats.timeoutCount++;
      }
      
      // Abrir circuit breaker se muitas falhas consecutivas
      if (stats.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        const cb = this.circuitBreakers.get(modelId);
        cb.state = 'open';
        cb.openedAt = new Date().toISOString();
      }
    }

    // Atualizar janela de execuções (apenas para sucessos)
    if (success && executionTime > 0) {
      this._updateRecentExecutions(stats, executionTime);
    }

    // Marcar warm-up como completo
    if (stats.totalCalls >= WARMUP_THRESHOLD) {
      stats.warmupComplete = true;
    }

    // Recalcular scores
    this._recalculateScores(modelId);
  }

  /**
   * Atualiza janela de execuções recentes (FIFO com limite de 50)
   */
  _updateRecentExecutions(stats, executionTime) {
    // Adicionar nova execução
    stats.recentExecutions.push(executionTime);
    
    // Manter apenas últimas 50
    if (stats.recentExecutions.length > MAX_RECENT_EXECUTIONS) {
      stats.recentExecutions.shift(); // Remove primeira (mais antiga)
    }
    
    // Atualizar min/max/avg baseado na janela
    if (stats.recentExecutions.length > 0) {
      stats.minExecutionTime = Math.min(...stats.recentExecutions);
      stats.maxExecutionTime = Math.max(...stats.recentExecutions);
      stats.averageExecutionTime = 
        stats.recentExecutions.reduce((a, b) => a + b, 0) / 
        stats.recentExecutions.length;
    }
  }

  /**
   * Recalcula scores de qualidade
   */
  _recalculateScores(modelId) {
    const stats = this.registry.get(modelId);
    if (!stats || !stats.warmupComplete) {
      stats.healthScore = 0.5; // Score neutro durante warm-up
      stats.confidence = 0;
      return;
    }

    // 1. Success Rate (45%)
    const successRate = stats.successCount / stats.totalCalls;

    // 2. Consistency (30%) - SIMPLIFICADO
    const consistency = this._calculateConsistency(stats);

    // 3. Normalized Speed (20%) - calculado externamente por tier
    // Aqui apenas guardamos o valor bruto, normalização é feita no roteador
    const normalizedSpeed = 0.5; // Placeholder, será calculado no roteador

    // 4. Stability (5%) - SIMPLIFICADO
    const stability = this._calculateStability(stats);

    // 5. Base Score (sem normalizedSpeed ainda)
    const baseScore = (
      (successRate * 0.45) +
      (consistency * 0.30) +
      (stability * 0.05)
    );

    // 6. Confidence
    const confidence = Math.min(stats.totalCalls / CONFIDENCE_THRESHOLD, 1.0);

    // Guardar scores
    stats.consistency = consistency;
    stats.stability = stability;
    stats.confidence = confidence;
    stats.healthScore = baseScore; // Será ajustado com normalizedSpeed no roteador
  }

  /**
   * Calcula consistência (LEAN)
   * consistency = 1 - (range / avg)
   */
  _calculateConsistency(stats) {
    if (stats.recentExecutions.length < 2) {
      return 1.0; // Consistência perfeita se não há dados suficientes
    }

    const range = stats.maxExecutionTime - stats.minExecutionTime;
    const avg = stats.averageExecutionTime;

    if (avg === 0) return 0;

    const consistency = 1 - (range / avg);
    
    // Clampar entre 0 e 1
    return Math.max(0, Math.min(1, consistency));
  }

  /**
   * Calcula estabilidade (LEAN)
   * stability = successRate - (timeoutRate * 0.5)
   */
  _calculateStability(stats) {
    const successRate = stats.successCount / stats.totalCalls;
    const timeoutRate = stats.timeoutCount / stats.totalCalls;
    
    const stability = successRate - (timeoutRate * 0.5);
    
    // Clampar entre 0 e 1
    return Math.max(0, Math.min(1, stability));
  }

  /**
   * Calcula healthScore final com normalizedSpeed
   * Chamado pelo roteador após calcular normalizedSpeed por tier
   */
  calculateFinalHealthScore(modelId, normalizedSpeed) {
    const stats = this.registry.get(modelId);
    if (!stats || !stats.warmupComplete) {
      return 0.5; // Score neutro durante warm-up
    }

    const successRate = stats.successCount / stats.totalCalls;
    const consistency = stats.consistency;
    const stability = stats.stability;

    // Health score completo
    let healthScore = (
      (successRate * 0.45) +
      (consistency * 0.30) +
      (normalizedSpeed * 0.20) +
      (stability * 0.05)
    );

    // Aplicar confidence
    healthScore *= (0.5 + (stats.confidence * 0.5)); // Min 50%, max 100%

    // Aplicar circuit breaker penalty
    const cb = this.circuitBreakers.get(modelId);
    if (cb.state === 'open') {
      healthScore *= 0.1; // Penalidade severa
    } else if (cb.state === 'half-open') {
      healthScore *= 0.5; // Penalidade moderada
    }

    return healthScore;
  }

  /**
   * Obtém estatísticas de um modelo
   */
  getModelStats(modelId) {
    return this.registry.get(modelId);
  }

  /**
   * Obtém todos os modelos de um tier
   */
  getModelsByTier(tier) {
    const models = [];
    for (const [modelId, stats] of this.registry.entries()) {
      if (stats.tier === tier) {
        models.push({ modelId, ...stats });
      }
    }
    return models;
  }

  /**
   * Ordena modelos por healthScore (com normalizedSpeed calculado)
   */
  sortModelsByHealth(modelIds, tier) {
    // Calcular normalizedSpeed para todos os modelos do tier
    const modelsInTier = this.getModelsByTier(tier);
    const times = modelsInTier
      .map(m => m.averageExecutionTime)
      .filter(t => t > 0);

    if (times.length === 0) {
      // Sem dados suficientes, manter ordem original
      return modelIds;
    }

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Calcular healthScore final para cada modelo
    const modelsWithScores = modelIds.map(modelId => {
      const stats = this.registry.get(modelId);
      if (!stats) {
        return { modelId, healthScore: 0, costPerToken: Infinity };
      }

      // Normalizar velocidade dentro do tier
      let normalizedSpeed = 0.5; // Default
      if (stats.averageExecutionTime > 0 && maxTime > minTime) {
        normalizedSpeed = 1 - (
          (stats.averageExecutionTime - minTime) / (maxTime - minTime)
        );
      }

      const healthScore = this.calculateFinalHealthScore(modelId, normalizedSpeed);

      return {
        modelId,
        healthScore,
        costPerToken: stats.costPerToken || 0
      };
    });

    // Ordenar por healthScore DESC, com custo como tiebreaker
    modelsWithScores.sort((a, b) => {
      const scoreDiff = b.healthScore - a.healthScore;
      
      // Se scores são similares (< 5%), usar custo como desempate
      if (Math.abs(scoreDiff) < SIMILARITY_THRESHOLD) {
        return a.costPerToken - b.costPerToken; // Menor custo primeiro
      }
      
      return scoreDiff; // Maior healthScore primeiro
    });

    return modelsWithScores.map(m => m.modelId);
  }

  /**
   * Obtém estado do circuit breaker
   */
  getCircuitBreakerState(modelId) {
    const cb = this.circuitBreakers.get(modelId);
    return cb ? cb.state : 'closed';
  }

  /**
   * Tenta fechar circuit breaker (half-open)
   */
  attemptCircuitBreakerRecovery(modelId) {
    const cb = this.circuitBreakers.get(modelId);
    if (cb && cb.state === 'open') {
      const openedAt = new Date(cb.openedAt);
      const now = new Date();
      const minutesSinceOpened = (now - openedAt) / 1000 / 60;

      // Tentar recovery após 5 minutos
      if (minutesSinceOpened >= 5) {
        cb.state = 'half-open';
      }
    }
  }

  /**
   * Obtém snapshot completo do registry (para debug)
   */
  getSnapshot() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      totalModels: this.registry.size,
      models: {}
    };

    for (const [modelId, stats] of this.registry.entries()) {
      const cb = this.circuitBreakers.get(modelId);
      snapshot.models[modelId] = {
        ...stats,
        circuitBreakerState: cb.state,
        // Não incluir recentExecutions completo (muito grande)
        recentExecutionsCount: stats.recentExecutions.length
      };
      delete snapshot.models[modelId].recentExecutions;
    }

    return snapshot;
  }

  /**
   * Reset suave (mantém 20% dos dados mais recentes)
   * NÃO IMPLEMENTADO AGORA - reservado para futuro
   */
  softReset() {
    console.warn('[ModelRegistry] softReset() not implemented yet');
  }
}

// Exportar singleton
export default new ModelRegistry();
