/**
 * AGENT SYSTEM - Inicialização do Sistema Híbrido
 * Ponto de entrada para toda a arquitetura de agentes
 * Otimizado para Vercel FREE
 *
 * MIGRATED: Serginho.js (v1 legado) removido.
 * Orquestração agora via api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)
 * Este módulo mantém apenas o sistema de registro de especialistas (frontend).
 */

import SpecialistLoader from "./core/SpecialistLoader.js";
import SpecialistFactory from "./core/SpecialistFactory.js";
import SpecialistRegistry from "./core/SpecialistRegistry.js";
import AgentBase from "./core/AgentBase.js";

/**
 * Sistema de Agentes Híbrido
 * Gerencia o registro de especialistas para o frontend.
 * A orquestração de IA é delegada ao api/lib/serginho-orchestrator.js.
 */
class HybridAgentSystem {
  constructor() {
    this.loader = new SpecialistLoader();
    this.initialized = false;
  }

  /**
   * Inicializar Sistema
   * Carrega configurações de especialistas
   */
  async initialize(configPath = null) {
    try {
      console.log("🚀 Inicializando Sistema Híbrido de Agentes...");

      // Carregar Configurações de Especialistas
      if (configPath) {
        const configs = await this.loader.loadConfigsFromFile(configPath);
        if (configs) {
          const result = await this.loader.registerAllFromConfig(configs);
          console.log(`✅ ${result.registered}/${result.total} especialistas registrados`);
        }
      } else {
        // Usar configuração padrão
        const defaultConfigs = this._getDefaultConfigs();
        const result = await this.loader.registerAllFromConfig(defaultConfigs);
        console.log(`✅ ${result.registered}/${result.total} especialistas registrados (padrão)`);
      }

      this.initialized = true;
      console.log("✅ Sistema Híbrido inicializado com sucesso!");

      const specialists = this.loader.listAllSpecialists();
      return {
        success: true,
        orchestrator: "api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)",
        specialists: specialists.length,
      };
    } catch (error) {
      console.error("❌ Erro ao inicializar sistema:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obter Configurações Padrão
   */
  _getDefaultConfigs() {
    return {
      version: "1.0.0",
      specialists: [
        {
          id: "didak",
          name: "Didak",
          role: "Especialista em Didática",
          description: "Ensino e metodologias de aprendizado",
          capabilities: ["teaching", "curriculum-design", "assessment"],
          category: "education",
          mode: "MANUAL",
        },
        {
          id: "code",
          name: "Code Master",
          role: "Especialista em Programação",
          description: "Desenvolvimento de software e coding",
          capabilities: ["code", "debugging", "architecture"],
          category: "technical",
          mode: "AUTONOMOUS",
        },
        {
          id: "design",
          name: "Design Pro",
          role: "Especialista em Design",
          description: "UI/UX e design visual",
          capabilities: ["design", "ui", "ux"],
          category: "creative",
          mode: "MANUAL",
        },
        {
          id: "marketing",
          name: "Marketing Guru",
          role: "Especialista em Marketing",
          description: "Estratégia e tática de marketing",
          capabilities: ["marketing", "sales", "strategy"],
          category: "business",
          mode: "AUTONOMOUS",
        },
        {
          id: "data",
          name: "Data Analyst",
          role: "Especialista em Análise de Dados",
          description: "Análise, visualização e insights de dados",
          capabilities: ["data-analysis", "statistics", "visualization"],
          category: "technical",
          mode: "AUTONOMOUS",
        },
      ],
    };
  }

  /**
   * Criar Especialista Sob Demanda
   */
  async createSpecialist(specialistId) {
    return await this.loader.createSpecialist(specialistId);
  }

  /**
   * Obter Estatísticas Globais
   */
  getGlobalStats() {
    if (!this.initialized) {
      return null;
    }

    return {
      system: {
        initialized: this.initialized,
        timestamp: Date.now(),
        orchestrator: "api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)",
      },
      loader: this.loader.getStats(),
    };
  }

  /**
   * Gerar Relatório Global
   */
  generateGlobalReport() {
    if (!this.initialized) {
      return "System not initialized";
    }

    return `
Orchestrator: api/lib/serginho-orchestrator.js (Multi-Orch v2.1.0)

${this.loader.generateReport()}

System Status: INITIALIZED ✅
Timestamp: ${new Date().toISOString()}
`;
  }

  /**
   * Desligar Sistema (Limpeza)
   */
  shutdown() {
    this.loader.registry.unloadAll();
    this.initialized = false;
    console.log("✅ Sistema desligado");
  }
}

/**
 * Exportar Sistema
 */
export {
  HybridAgentSystem,
  SpecialistFactory,
  SpecialistRegistry,
  SpecialistLoader,
  AgentBase,
};

/**
 * Factory para criar sistema pré-inicializado
 */
export async function createSystem(configPath = null) {
  const system = new HybridAgentSystem();
  await system.initialize(configPath);
  return system;
}
