/**
 * AGENT BASE - Classe Base para Todos os Agentes
 * Implementa modo híbrido (Manual/Autônomo) com segurança e cache
 */

import ModelArmor from "../../security/ModelArmor.js";
import IntelligentCache from "../../cache/IntelligentCache.js";

class AgentBase {
  constructor(config) {
    this.id = config.id || "unknown-agent";
    this.name = config.name || "Unknown Agent";
    this.role = config.role || "General Purpose";
    this.mode = config.mode || "MANUAL"; // MANUAL | AUTONOMOUS

    // Componentes de segurança e cache
    this.modelArmor = new ModelArmor();
    this.cache = new IntelligentCache();

    // Histórico de thread (memória volátil)
    this.threadHistory = [];
    this.maxHistorySize = 100; // Retenção zero: máx 100 mensagens

    // Configuração
    this.config = config;
    this.createdAt = Date.now();
  }

  /**
   * Processamento Híbrido: Manual ou Autônomo
   * Fluxo: Validação → Cache → Modo → Histórico
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

      // 2. BUSCA EM CACHE
      const cacheKey = this.cache.generateKey(this.id, prompt, context);
      const cachedResponse = this.cache.get(cacheKey);

      if (cachedResponse) {
        this._addToHistory(prompt, cachedResponse, "CACHE", null);
        return {
          status: "SUCCESS",
          source: "CACHE",
          response: cachedResponse,
          timestamp: Date.now(),
        };
      }

      // 3. MODO MANUAL: Requer consentimento do usuário
      if (this.mode === "MANUAL") {
        return await this._manualMode(prompt, context, securityAnalysis, cacheKey);
      }

      // 4. MODO AUTÔNOMO: Executa automaticamente
      if (this.mode === "AUTONOMOUS") {
        return await this._autonomousMode(prompt, context, securityAnalysis, cacheKey);
      }
    } catch (error) {
      return {
        status: "ERROR",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Modo Manual: Requer Consentimento do Usuário
   */
  async _manualMode(prompt, context, securityAnalysis, cacheKey) {
    const consentRequired = securityAnalysis.recommendation === "REQUIRE_CONSENT";

    if (consentRequired) {
      // Em produção, isso seria uma solicitação real ao usuário
      // Por enquanto, retornamos que consentimento é necessário
      return {
        status: "CONSENT_REQUIRED",
        reason: "User consent required for this operation",
        riskScore: securityAnalysis.riskScore,
        violations: securityAnalysis.violations,
        timestamp: Date.now(),
      };
    }

    // Processar com API
    const response = await this._callAPI(prompt, context);

    // Armazenar em cache
    this.cache.set(cacheKey, response, "specialist-response");

    // Adicionar ao histórico
    this._addToHistory(prompt, response, "MANUAL", null);

    return {
      status: "SUCCESS",
      source: "API",
      response,
      timestamp: Date.now(),
    };
  }

  /**
   * Modo Autônomo: Executa e Cria PR
   */
  async _autonomousMode(prompt, context, securityAnalysis, cacheKey) {
    // Processar com API
    const response = await this._callAPI(prompt, context);

    // Filtrar resposta (redação de dados sensíveis)
    const filtered = this.modelArmor.filterResponse(response);

    // Criar PR no GitHub (simulado por enquanto)
    const pr = await this._createPullRequest({
      agentId: this.id,
      prompt,
      response: filtered.filtered,
      timestamp: Date.now(),
      requiresApproval: filtered.isModified,
    });

    // Armazenar em cache
    this.cache.set(cacheKey, response, "specialist-response");

    // Adicionar ao histórico
    this._addToHistory(prompt, response, "AUTONOMOUS", pr.id);

    return {
      status: "SUCCESS",
      source: "API",
      response,
      prId: pr.id,
      requiresApproval: filtered.isModified,
      timestamp: Date.now(),
    };
  }

  /**
   * Chamar API (implementação específica de cada agente)
   * @param {string} prompt - Prompt do usuário
   * @param {Object} context - Contexto da conversa
   * @returns {Promise<string>} Resposta da API
   */
  async _callAPI(prompt, context) {
    // Implementação específica de cada agente
    throw new Error("_callAPI must be implemented by subclass. Agent: " + this.id);
  }

  /**
   * Criar Pull Request no GitHub (simulado)
   * @param {Object} data - Dados do PR
   * @returns {Promise<Object>} Resultado do PR
   */
  async _createPullRequest(data) {
    // Simulação: em produção, isso integraria com GitHub API
    return {
      id: `PR-${Date.now()}`,
      agentId: data.agentId,
      status: "pending_approval",
      createdAt: Date.now(),
    };
  }

  /**
   * Adicionar ao Histórico de Thread (Memória Volátil)
   * Mantém retenção zero: máx 100 mensagens
   */
  _addToHistory(prompt, response, source, prId = null) {
    this.threadHistory.push({
      timestamp: Date.now(),
      prompt,
      response,
      source, // CACHE, MANUAL, AUTONOMOUS
      prId,
    });

    // Manter apenas últimas 100 mensagens (retenção zero)
    if (this.threadHistory.length > this.maxHistorySize) {
      this.threadHistory.shift();
    }
  }

  /**
   * Obter Histórico de Thread
   */
  getThreadHistory() {
    return this.threadHistory;
  }

  /**
   * Limpar Histórico (Retenção Zero)
   */
  clearHistory() {
    this.threadHistory = [];
  }

  /**
   * Obter Estatísticas do Agente
   */
  getStats() {
    const cacheStats = this.cache.getStats();

    return {
      agentId: this.id,
      agentName: this.name,
      mode: this.mode,
      createdAt: this.createdAt,
      uptime: Date.now() - this.createdAt,
      historySize: this.threadHistory.length,
      cache: cacheStats,
    };
  }

  /**
   * Gerar Relatório Completo
   */
  generateReport() {
    const stats = this.getStats();
    const modelArmorReport = this.modelArmor.generateReport({
      isClean: true,
      violations: [],
      riskScore: 0,
      recommendation: "ALLOW",
      timestamp: Date.now(),
    });
    const cacheReport = this.cache.generateReport();

    return `
╔════════════════════════════════════════╗
║        AGENT REPORT - ${this.id}
╚════════════════════════════════════════╝

Agent: ${this.name}
Role: ${this.role}
Mode: ${this.mode}
Uptime: ${(stats.uptime / 1000 / 60).toFixed(2)} minutes

History Size: ${stats.historySize}/${this.maxHistorySize}

${cacheReport}

${modelArmorReport}

Timestamp: ${new Date().toISOString()}
`;
  }

  /**
   * Mudar Modo (MANUAL ↔ AUTONOMOUS)
   */
  setMode(mode) {
    if (!["MANUAL", "AUTONOMOUS"].includes(mode)) {
      throw new Error("Invalid mode. Must be MANUAL or AUTONOMOUS");
    }
    this.mode = mode;
  }

  /**
   * Obter Modo Atual
   */
  getMode() {
    return this.mode;
  }
}

export default AgentBase;
