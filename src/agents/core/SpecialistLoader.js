/**
 * SPECIALIST LOADER - Carregador de Especialistas do JSON
 * Carrega configurações de especialistas sem código duplicado
 * Suporta número ilimitado de especialistas
 */

const SpecialistFactory = require("./SpecialistFactory");
const SpecialistRegistry = require("./SpecialistRegistry");

class SpecialistLoader {
  constructor() {
    this.registry = new SpecialistRegistry();
    this.loadedConfigs = null;
  }

  /**
   * Carregar Configurações de Especialistas do JSON
   */
  async loadConfigsFromFile(filePath) {
    try {
      // Em ambiente Node.js
      if (typeof require !== "undefined") {
        const configs = require(filePath);
        this.loadedConfigs = configs;
        return configs;
      }

      // Em ambiente browser (fetch)
      const response = await fetch(filePath);
      const configs = await response.json();
      this.loadedConfigs = configs;
      return configs;
    } catch (error) {
      console.error(`Error loading specialist configs from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Registrar Todos os Especialistas do JSON
   */
  async registerAllFromConfig(configData) {
    if (!configData || !configData.specialists) {
      throw new Error("Invalid config data: missing specialists array");
    }

    const registered = [];

    for (const specialistConfig of configData.specialists) {
      try {
        // Validar configuração
        const validation = SpecialistFactory.validateConfig(specialistConfig);
        if (!validation.valid) {
          console.warn(`Invalid specialist config for ${specialistConfig.id}:`, validation.errors);
          continue;
        }

        // Registrar no registry (apenas metadados)
        this.registry.registerSpecialist(specialistConfig.id, specialistConfig);
        registered.push(specialistConfig.id);
      } catch (error) {
        console.error(`Error registering specialist ${specialistConfig.id}:`, error);
      }
    }

    return {
      total: configData.specialists.length,
      registered: registered.length,
      failed: configData.specialists.length - registered.length,
      registeredIds: registered,
    };
  }

  /**
   * Criar Especialista Sob Demanda
   */
  async createSpecialist(specialistId) {
    try {
      // Obter configuração do registry
      const metadata = this.registry.getSpecialistMetadata(specialistId);

      if (!metadata) {
        throw new Error(`Specialist ${specialistId} not found in registry`);
      }

      // Criar usando factory
      const specialist = SpecialistFactory.createSpecialist(metadata);

      return specialist;
    } catch (error) {
      console.error(`Error creating specialist ${specialistId}:`, error);
      return null;
    }
  }

  /**
   * Criar Múltiplos Especialistas
   */
  async createSpecialists(specialistIds) {
    const specialists = [];

    for (const id of specialistIds) {
      const specialist = await this.createSpecialist(id);
      if (specialist) {
        specialists.push(specialist);
      }
    }

    return specialists;
  }

  /**
   * Obter Especialistas por Capacidade
   */
  getSpecialistsByCapability(capability) {
    return this.registry.findByCapability(capability);
  }

  /**
   * Obter Especialistas por Categoria
   */
  getSpecialistsByCategory(category) {
    return this.registry.findByCategory(category);
  }

  /**
   * Obter Especialistas por Modo
   */
  getSpecialistsByMode(mode) {
    return this.registry.findByMode(mode);
  }

  /**
   * Listar Todos os Especialistas Disponíveis
   */
  listAllSpecialists() {
    return this.registry.listAllSpecialists();
  }

  /**
   * Contar Total de Especialistas
   */
  countSpecialists() {
    return this.registry.count();
  }

  /**
   * Obter Estatísticas do Loader
   */
  getStats() {
    return {
      registry: this.registry.getStats(),
      configLoaded: this.loadedConfigs !== null,
      totalSpecialists: this.registry.count(),
    };
  }

  /**
   * Gerar Relatório
   */
  generateReport() {
    const stats = this.getStats();
    const specialists = this.listAllSpecialists();

    let report = `
╔════════════════════════════════════════╗
║    SPECIALIST LOADER - REPORT          ║
╚════════════════════════════════════════╝

Total Specialists: ${stats.totalSpecialists}
Config Loaded: ${stats.configLoaded ? "Yes" : "No"}

Specialists by Category:
`;

    // Agrupar por categoria
    const byCategory = {};
    for (const specialist of specialists) {
      if (!byCategory[specialist.category]) {
        byCategory[specialist.category] = [];
      }
      byCategory[specialist.category].push(specialist.name);
    }

    for (const [category, names] of Object.entries(byCategory)) {
      report += `\n  ${category}:\n`;
      names.forEach((name) => {
        report += `    - ${name}\n`;
      });
    }

    report += `\n${this.registry.generateReport()}`;

    return report;
  }

  /**
   * Exportar Índice para GitHub
   */
  exportIndexForGitHub() {
    return this.registry.exportIndex();
  }

  /**
   * Importar Índice do GitHub
   */
  importIndexFromGitHub(indexData) {
    this.registry.importIndex(indexData);
  }
}

module.exports = SpecialistLoader;
