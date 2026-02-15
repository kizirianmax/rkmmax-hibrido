/**
 * STATE MANAGER - Gerenciador de Estado com GitHub como SSOT
 * Sincroniza estado global de todos os 55 agentes
 */

class StateManager {
  constructor(githubClient) {
    this.github = githubClient;
    this.repo = "kizirianmax/Rkmmax-app";
    this.configPath = ".github/agent-config";

    // Cache local de configurações
    this.configCache = new Map();
    this.lastSync = null;
  }

  /**
   * Carregar Estado Global de Todos os Agentes
   */
  async loadGlobalState() {
    try {
      const manifest = await this.github.getFile(
        this.repo,
        `${this.configPath}/cache-manifest.json`
      );

      const parsed = JSON.parse(manifest);
      this.lastSync = Date.now();

      return parsed;
    } catch (error) {
      console.error("Error loading global state:", error);
      return null;
    }
  }

  /**
   * Carregar Configuração de um Agente Específico
   */
  async loadAgentConfig(agentId) {
    // Verificar cache local
    if (this.configCache.has(agentId)) {
      return this.configCache.get(agentId);
    }

    try {
      const config = await this.github.getFile(this.repo, `${this.configPath}/${agentId}.json`);

      const parsed = JSON.parse(config);
      this.configCache.set(agentId, parsed);

      return parsed;
    } catch (error) {
      console.error(`Error loading config for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Carregar Configuração de Todos os Especialistas
   */
  async loadAllSpecialists() {
    try {
      const specialists = [];

      // Em produção, isso buscaria a lista de arquivos do GitHub
      // Por enquanto, retornamos array vazio
      return specialists;
    } catch (error) {
      console.error("Error loading specialists:", error);
      return [];
    }
  }

  /**
   * Atualizar Estado de um Agente
   */
  async updateAgentState(agentId, state) {
    try {
      const current = await this.loadAgentConfig(agentId);
      const updated = {
        ...current,
        ...state,
        lastUpdated: Date.now(),
      };

      await this.github.updateFile(
        this.repo,
        `${this.configPath}/${agentId}.json`,
        JSON.stringify(updated, null, 2),
        `Update ${agentId} state`
      );

      // Atualizar cache local
      this.configCache.set(agentId, updated);

      return updated;
    } catch (error) {
      console.error(`Error updating agent state for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Sincronizar Cache Global com Estatísticas de Todos os Agentes
   */
  async syncCacheManifest(cacheStats) {
    try {
      const manifest = {
        lastSync: Date.now(),
        agents: cacheStats,
        globalHitRate: this._calculateGlobalHitRate(cacheStats),
        estimatedSavings: this._calculateSavings(cacheStats),
        totalAgents: Object.keys(cacheStats).length,
      };

      await this.github.updateFile(
        this.repo,
        `${this.configPath}/cache-manifest.json`,
        JSON.stringify(manifest, null, 2),
        "Sync cache manifest with latest statistics"
      );

      this.lastSync = Date.now();
      return manifest;
    } catch (error) {
      console.error("Error syncing cache manifest:", error);
      return null;
    }
  }

  /**
   * Criar Configuração de Novo Agente
   */
  async createAgentConfig(agentId, config) {
    try {
      const newConfig = {
        id: agentId,
        name: config.name || agentId,
        role: config.role || "Specialist",
        mode: config.mode || "MANUAL",
        version: "1.0.0",
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        cacheStats: {
          hits: 0,
          misses: 0,
          hitRate: "0%",
          apiCallsSaved: 0,
        },
        capabilities: config.capabilities || [],
      };

      await this.github.createFile(
        this.repo,
        `${this.configPath}/${agentId}.json`,
        JSON.stringify(newConfig, null, 2),
        `Create config for agent ${agentId}`
      );

      this.configCache.set(agentId, newConfig);
      return newConfig;
    } catch (error) {
      console.error(`Error creating config for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Atualizar Estatísticas de Cache de um Agente
   */
  async updateCacheStats(agentId, stats) {
    try {
      const config = await this.loadAgentConfig(agentId);

      const updated = {
        ...config,
        cacheStats: {
          hits: stats.hits || 0,
          misses: stats.misses || 0,
          hitRate: stats.hitRate || "0%",
          apiCallsSaved: stats.apiCallsSaved || 0,
          memoryUsage: stats.memoryUsage || "0%",
        },
        lastUpdated: Date.now(),
      };

      await this.github.updateFile(
        this.repo,
        `${this.configPath}/${agentId}.json`,
        JSON.stringify(updated, null, 2),
        `Update cache stats for ${agentId}`
      );

      this.configCache.set(agentId, updated);
      return updated;
    } catch (error) {
      console.error(`Error updating cache stats for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Mudar Modo de um Agente (MANUAL ↔ AUTONOMOUS)
   */
  async setAgentMode(agentId, mode) {
    if (!["MANUAL", "AUTONOMOUS"].includes(mode)) {
      throw new Error("Invalid mode. Must be MANUAL or AUTONOMOUS");
    }

    try {
      const config = await this.loadAgentConfig(agentId);
      const updated = {
        ...config,
        mode,
        lastUpdated: Date.now(),
      };

      await this.github.updateFile(
        this.repo,
        `${this.configPath}/${agentId}.json`,
        JSON.stringify(updated, null, 2),
        `Set ${agentId} mode to ${mode}`
      );

      this.configCache.set(agentId, updated);
      return updated;
    } catch (error) {
      console.error(`Error setting mode for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Obter Modo Atual de um Agente
   */
  async getAgentMode(agentId) {
    const config = await this.loadAgentConfig(agentId);
    return config ? config.mode : null;
  }

  /**
   * Calcular Hit Rate Global
   */
  _calculateGlobalHitRate(cacheStats) {
    let totalHits = 0;
    let totalRequests = 0;

    for (const stats of Object.values(cacheStats)) {
      totalHits += stats.hits || 0;
      totalRequests += (stats.hits || 0) + (stats.misses || 0);
    }

    if (totalRequests === 0) return "0%";
    return ((totalHits / totalRequests) * 100).toFixed(2) + "%";
  }

  /**
   * Calcular Economia Total de API
   */
  _calculateSavings(cacheStats) {
    return Object.values(cacheStats).reduce((sum, stats) => {
      return sum + (stats.apiCallsSaved || 0) * 0.01; // $0.01 por chamada
    }, 0);
  }

  /**
   * Gerar Relatório de Estado Global
   */
  async generateGlobalReport() {
    try {
      const globalState = await this.loadGlobalState();

      if (!globalState) {
        return "Unable to generate report: Global state not available";
      }

      const report = `
╔════════════════════════════════════════╗
║     GLOBAL STATE REPORT - RKMMAX       ║
╚════════════════════════════════════════╝

Total Agents: ${globalState.totalAgents}
Global Hit Rate: ${globalState.globalHitRate}
Estimated Savings: $${globalState.estimatedSavings.toFixed(2)}

Last Sync: ${new Date(globalState.lastSync).toISOString()}

Top Agents by Hit Rate:
`;

      // Ordenar agentes por hit rate
      const sorted = Object.entries(globalState.agents)
        .sort(([, a], [, b]) => {
          const aRate = parseFloat(a.hitRate || "0");
          const bRate = parseFloat(b.hitRate || "0");
          return bRate - aRate;
        })
        .slice(0, 10);

      sorted.forEach(([agentId, stats]) => {
        report += `  - ${agentId}: ${stats.hitRate} (Saved: $${(stats.apiCallsSaved * 0.01).toFixed(2)})\n`;
      });

      report += `\nTimestamp: ${new Date().toISOString()}`;

      return report;
    } catch (error) {
      console.error("Error generating global report:", error);
      return null;
    }
  }

  /**
   * Limpar Cache Local
   */
  clearLocalCache() {
    this.configCache.clear();
  }

  /**
   * Obter Informações de Sincronização
   */
  getSyncInfo() {
    return {
      lastSync: this.lastSync,
      cachedAgents: this.configCache.size,
      timestamp: Date.now(),
    };
  }
}

export default StateManager;
