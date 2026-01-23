/**
 * SPECIALIST FACTORY - Gerador Dinâmico de Especialistas
 * Cria especialistas sob demanda sem código duplicado
 * Suporta número ilimitado de especialistas
 * Otimizado para Vercel FREE
 */

const AgentBase = require("./AgentBase");

class SpecialistFactory {
  /**
   * Criar Especialista Dinamicamente
   */
  static createSpecialist(specialistConfig) {
    const {
      id,
      name,
      role,
      description,
      capabilities,
      category,
      mode = "MANUAL",
      apiEndpoint,
      systemPrompt,
    } = specialistConfig;

    // Validar configuração
    if (!id || !name || !role) {
      throw new Error("Missing required specialist configuration: id, name, role");
    }

    // Criar classe dinâmica que herda de AgentBase
    class DynamicSpecialist extends AgentBase {
      constructor() {
        super({
          id,
          name,
          role,
          mode,
        });

        this.description = description || "";
        this.capabilities = capabilities || [];
        this.category = category || "general";
        this.apiEndpoint = apiEndpoint || null;
        this.systemPrompt = systemPrompt || this._generateDefaultSystemPrompt();
      }

      /**
       * Implementação de _callAPI específica do especialista
       */
      async _callAPI(prompt, context) {
        // Se tiver endpoint customizado, usar
        if (this.apiEndpoint) {
          return await this._callCustomAPI(prompt, context);
        }

        // Caso contrário, usar simulação
        return await this._callSimulatedAPI(prompt, context);
      }

      /**
       * Chamar API Customizada
       */
      async _callCustomAPI(prompt, context) {
        try {
          // Simular chamada HTTP
          // Em produção, isso seria um fetch/axios real
          return {
            status: "success",
            response: `Response from ${this.name}: ${prompt.substring(0, 50)}...`,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.error(`Error calling API for ${this.id}:`, error);
          throw error;
        }
      }

      /**
       * Simular API (Para Testes)
       */
      async _callSimulatedAPI(prompt, context) {
        // Simular latência
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

        return {
          status: "success",
          response: `[${this.name}] ${prompt.substring(0, 100)}...`,
          timestamp: Date.now(),
        };
      }

      /**
       * Gerar System Prompt Padrão
       */
      _generateDefaultSystemPrompt() {
        return `You are ${this.name}, a specialist in ${this.role}.
Your capabilities: ${this.capabilities.join(", ")}.
Category: ${this.category}.
Always provide accurate, helpful, and safe responses.`;
      }

      /**
       * Obter Informações do Especialista
       */
      getInfo() {
        return {
          id: this.id,
          name: this.name,
          role: this.role,
          description: this.description,
          capabilities: this.capabilities,
          category: this.category,
          mode: this.mode,
          systemPrompt: this.systemPrompt,
          createdAt: this.createdAt,
        };
      }
    }

    // Retornar instância do especialista
    return new DynamicSpecialist();
  }

  /**
   * Criar Múltiplos Especialistas em Lote
   */
  static createSpecialists(specialistConfigs) {
    return specialistConfigs.map((config) => this.createSpecialist(config));
  }

  /**
   * Criar Especialistas Padrão (54 especialistas iniciais)
   */
  static createDefaultSpecialists() {
    const defaultConfigs = [
      {
        id: "didak",
        name: "Didak",
        role: "Especialista em Didática",
        description: "Ensino e metodologias de aprendizado",
        capabilities: ["teaching", "curriculum-design", "assessment"],
        category: "education",
      },
      {
        id: "code",
        name: "Code Master",
        role: "Especialista em Programação",
        description: "Desenvolvimento de software e coding",
        capabilities: ["code", "debugging", "architecture"],
        category: "technical",
      },
      {
        id: "design",
        name: "Design Pro",
        role: "Especialista em Design",
        description: "UI/UX e design visual",
        capabilities: ["design", "ui", "ux"],
        category: "creative",
      },
      {
        id: "marketing",
        name: "Marketing Guru",
        role: "Especialista em Marketing",
        description: "Estratégia e tática de marketing",
        capabilities: ["marketing", "sales", "strategy"],
        category: "business",
      },
      {
        id: "data",
        name: "Data Analyst",
        role: "Especialista em Análise de Dados",
        description: "Análise, visualização e insights de dados",
        capabilities: ["data-analysis", "statistics", "visualization"],
        category: "technical",
      },
      {
        id: "security",
        name: "Security Expert",
        role: "Especialista em Segurança",
        description: "Segurança da informação e criptografia",
        capabilities: ["security", "encryption", "compliance"],
        category: "technical",
      },
      {
        id: "performance",
        name: "Performance Tuner",
        role: "Especialista em Performance",
        description: "Otimização e benchmarking",
        capabilities: ["performance", "optimization", "profiling"],
        category: "technical",
      },
      {
        id: "accessibility",
        name: "A11y Specialist",
        role: "Especialista em Acessibilidade",
        description: "WCAG e design acessível",
        capabilities: ["accessibility", "wcag", "inclusive-design"],
        category: "technical",
      },
      {
        id: "writing",
        name: "Tech Writer",
        role: "Especialista em Escrita Técnica",
        description: "Documentação e conteúdo técnico",
        capabilities: ["technical-writing", "documentation", "content"],
        category: "creative",
      },
      {
        id: "business",
        name: "Business Analyst",
        role: "Especialista em Negócios",
        description: "Análise de negócios e estratégia",
        capabilities: ["business", "analysis", "strategy"],
        category: "business",
      },
    ];

    return this.createSpecialists(defaultConfigs);
  }

  /**
   * Validar Configuração de Especialista
   */
  static validateConfig(config) {
    const required = ["id", "name", "role"];
    const missing = required.filter((field) => !config[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missing.join(", ")}`],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  }
}

module.exports = SpecialistFactory;
