/**
 * SPECIALIST REGISTRY - Registro Dinâmico e Escalável
 * Suporta número ilimitado de especialistas
 * Lazy loading para otimizar Vercel FREE
 * Sem pré-carregamento desnecessário
 */

class SpecialistRegistry {
  constructor() {
    // Mapa de especialistas carregados (lazy loading)
    this.loadedSpecialists = new Map();

    // Índice de especialistas disponíveis (metadados leves)
    this.specialistIndex = new Map();

    // Cache de configurações
    this.configCache = new Map();

    // Estatísticas de uso
    this.stats = {
      totalLoaded: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Registrar Especialista (Apenas Metadados)
   * Não carrega o código até ser necessário
   */
  registerSpecialist(specialistId, metadata) {
    this.specialistIndex.set(specialistId, {
      id: specialistId,
      name: metadata.name || specialistId,
      role: metadata.role || "Specialist",
      description: metadata.description || "",
      capabilities: metadata.capabilities || [],
      category: metadata.category || "general",
      mode: metadata.mode || "MANUAL",
      createdAt: Date.now(),
      loaded: false,
    });
  }

  /**
   * Carregar Especialista (Lazy Loading)
   * Apenas carrega quando necessário
   */
  async loadSpecialist(specialistId) {
    // Verificar se já está carregado
    if (this.loadedSpecialists.has(specialistId)) {
      this.stats.cacheHits++;
      return this.loadedSpecialists.get(specialistId);
    }

    // Verificar se existe no índice
    if (!this.specialistIndex.has(specialistId)) {
      throw new Error(`Specialist ${specialistId} not found in registry`);
    }

    this.stats.cacheMisses++;
    this.stats.totalRequests++;

    try {
      // Carregar dinamicamente (em produção)
      // Por enquanto, retornamos um especialista genérico
      const metadata = this.specialistIndex.get(specialistId);

      // Simular carregamento dinâmico
      const specialist = {
        id: specialistId,
        ...metadata,
        loaded: true,
        loadedAt: Date.now(),
      };

      // Armazenar em cache
      this.loadedSpecialists.set(specialistId, specialist);
      this.stats.totalLoaded++;

      // Limpar cache se exceder limite (evitar memory leak no Vercel)
      this._enforceMemoryLimit();

      return specialist;
    } catch (error) {
      console.error(`Error loading specialist ${specialistId}:`, error);
      throw error;
    }
  }

  /**
   * Obter Especialista Carregado
   */
  getSpecialist(specialistId) {
    return this.loadedSpecialists.get(specialistId) || null;
  }

  /**
   * Obter Metadados do Especialista (Sem Carregar)
   */
  getSpecialistMetadata(specialistId) {
    return this.specialistIndex.get(specialistId) || null;
  }

  /**
   * Listar Todos os Especialistas Disponíveis (Apenas Metadados)
   */
  listAllSpecialists() {
    return Array.from(this.specialistIndex.values());
  }

  /**
   * Listar Especialistas Carregados
   */
  listLoadedSpecialists() {
    return Array.from(this.loadedSpecialists.values());
  }

  /**
   * Buscar Especialistas por Capacidade
   */
  findByCapability(capability) {
    return Array.from(this.specialistIndex.values()).filter((specialist) =>
      specialist.capabilities.includes(capability)
    );
  }

  /**
   * Buscar Especialistas por Categoria
   */
  findByCategory(category) {
    return Array.from(this.specialistIndex.values()).filter(
      (specialist) => specialist.category === category
    );
  }

  /**
   * Buscar Especialistas por Modo
   */
  findByMode(mode) {
    return Array.from(this.specialistIndex.values()).filter(
      (specialist) => specialist.mode === mode
    );
  }

  /**
   * Descarregar Especialista (Liberar Memória)
   */
  unloadSpecialist(specialistId) {
    if (this.loadedSpecialists.has(specialistId)) {
      this.loadedSpecialists.delete(specialistId);
      return true;
    }
    return false;
  }

  /**
   * Descarregar Todos os Especialistas
   */
  unloadAll() {
    this.loadedSpecialists.clear();
  }

  /**
   * Forçar Limite de Memória
   * Descarrega especialistas menos usados se necessário
   */
  _enforceMemoryLimit() {
    const maxLoaded = 20; // Máximo de especialistas carregados simultaneamente

    if (this.loadedSpecialists.size > maxLoaded) {
      // Descarregar os 5 menos recentemente usados
      const toUnload = Array.from(this.loadedSpecialists.entries())
        .sort(([, a], [, b]) => (a.lastUsed || 0) - (b.lastUsed || 0))
        .slice(0, 5)
        .map(([id]) => id);

      toUnload.forEach((id) => this.unloadSpecialist(id));
    }
  }

  /**
   * Atualizar Metadados de Especialista
   */
  updateSpecialistMetadata(specialistId, updates) {
    const current = this.specialistIndex.get(specialistId);
    if (!current) {
      throw new Error(`Specialist ${specialistId} not found`);
    }

    const updated = {
      ...current,
      ...updates,
      lastUpdated: Date.now(),
    };

    this.specialistIndex.set(specialistId, updated);

    // Atualizar também se estiver carregado
    if (this.loadedSpecialists.has(specialistId)) {
      this.loadedSpecialists.set(specialistId, {
        ...this.loadedSpecialists.get(specialistId),
        ...updated,
      });
    }

    return updated;
  }

  /**
   * Contar Especialistas
   */
  count() {
    return this.specialistIndex.size;
  }

  /**
   * Contar Carregados
   */
  countLoaded() {
    return this.loadedSpecialists.size;
  }

  /**
   * Obter Estatísticas
   */
  getStats() {
    return {
      totalSpecialists: this.specialistIndex.size,
      loadedSpecialists: this.loadedSpecialists.size,
      totalLoaded: this.stats.totalLoaded,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      hitRate:
        this.stats.totalRequests > 0
          ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(2) + "%"
          : "0%",
      memoryUsage: this._estimateMemoryUsage(),
    };
  }

  /**
   * Estimar Uso de Memória
   */
  _estimateMemoryUsage() {
    let totalSize = 0;
    for (const specialist of this.loadedSpecialists.values()) {
      totalSize += JSON.stringify(specialist).length / 1024; // KB
    }
    return (totalSize / 1024).toFixed(2) + " MB"; // MB
  }

  /**
   * Gerar Relatório
   */
  generateReport() {
    const stats = this.getStats();

    return `
╔════════════════════════════════════════╗
║    SPECIALIST REGISTRY - REPORT        ║
╚════════════════════════════════════════╝

Total Specialists: ${stats.totalSpecialists}
Loaded Specialists: ${stats.loadedSpecialists}
Memory Usage: ${stats.memoryUsage}

Cache Performance:
- Hits: ${stats.cacheHits}
- Misses: ${stats.cacheMisses}
- Hit Rate: ${stats.hitRate}

Total Requests: ${stats.totalRequests}

Timestamp: ${new Date().toISOString()}
`;
  }

  /**
   * Exportar Índice (Para GitHub SSOT)
   */
  exportIndex() {
    return {
      version: "1.0.0",
      timestamp: Date.now(),
      totalSpecialists: this.specialistIndex.size,
      specialists: Array.from(this.specialistIndex.values()),
    };
  }

  /**
   * Importar Índice (Do GitHub SSOT)
   */
  importIndex(indexData) {
    if (!indexData.specialists || !Array.isArray(indexData.specialists)) {
      throw new Error("Invalid index data");
    }

    for (const specialist of indexData.specialists) {
      this.registerSpecialist(specialist.id, specialist);
    }
  }
}

module.exports = SpecialistRegistry;
