/**
 * SPECIALIST SELECTOR
 * Seleção inteligente de especialista baseada no tipo de tarefa
 * Mapeia tarefas para os 54+ especialistas do RKMMAX
 */

class SpecialistSelector {
  constructor() {
    // Mapeamento de especialistas por categoria
    this.specialists = {
      // Desenvolvimento
      Dev: {
        name: "Dev",
        category: "DEVELOPMENT",
        skills: ["código", "programação", "função", "refatorar", "bug", "feature"],
        models: ["llama-70b", "llama-8b"],
      },
      Frontend: {
        name: "Frontend",
        category: "DEVELOPMENT",
        skills: ["react", "vue", "angular", "componente", "ui", "interface", "estilo"],
        models: ["llama-8b"],
      },
      Backend: {
        name: "Backend",
        category: "DEVELOPMENT",
        skills: ["api", "banco de dados", "servidor", "node", "python", "java"],
        models: ["llama-70b"],
      },
      Mobile: {
        name: "Mobile",
        category: "DEVELOPMENT",
        skills: ["react native", "flutter", "ios", "android", "app"],
        models: ["llama-8b"],
      },
      DevOps: {
        name: "DevOps",
        category: "INFRASTRUCTURE",
        skills: ["deploy", "ci/cd", "docker", "kubernetes", "vercel", "github"],
        models: ["llama-70b"],
      },

      // Design
      Designer: {
        name: "Designer",
        category: "DESIGN",
        skills: ["design", "ui", "ux", "visual", "layout", "cores", "tipografia"],
        models: ["llama-8b"],
      },
      UX: {
        name: "UX",
        category: "DESIGN",
        skills: ["experiência", "usuário", "usabilidade", "acessibilidade", "fluxo"],
        models: ["llama-8b"],
      },

      // Dados
      Pesquisador: {
        name: "Pesquisador",
        category: "RESEARCH",
        skills: ["pesquisa", "análise", "dados", "estatística", "investigação"],
        models: ["llama-70b"],
      },
      DataAnalyst: {
        name: "DataAnalyst",
        category: "DATA",
        skills: ["dados", "análise", "gráfico", "visualização", "sql", "python"],
        models: ["llama-70b"],
      },

      // Conteúdo
      Escritor: {
        name: "Escritor",
        category: "CONTENT",
        skills: ["conteúdo", "documentação", "escrita", "artigo", "blog", "readme"],
        models: ["llama-8b"],
      },
      Copywriter: {
        name: "Copywriter",
        category: "CONTENT",
        skills: ["copy", "marketing", "venda", "persuasão", "anúncio"],
        models: ["llama-8b"],
      },

      // Qualidade
      QA: {
        name: "QA",
        category: "QUALITY",
        skills: ["teste", "qualidade", "bug", "validação", "verificação"],
        models: ["llama-8b"],
      },
      SecurityExpert: {
        name: "SecurityExpert",
        category: "SECURITY",
        skills: ["segurança", "vulnerabilidade", "criptografia", "autenticação"],
        models: ["llama-70b"],
      },

      // Serginho (orquestrador)
      Serginho: {
        name: "Serginho",
        category: "ORCHESTRATION",
        skills: ["orquestração", "coordenação", "delegação", "geral"],
        models: ["llama-8b"],
      },
    };

    // Mapeamento de tipos de tarefa para especialistas
    this.taskTypeMapping = {
      COMPONENT: ["Frontend", "Designer", "UX"],
      FUNCTION: ["Dev", "Backend"],
      TEST: ["QA", "Dev"],
      STYLE: ["Designer", "Frontend", "UX"],
      DOCUMENTATION: ["Escritor", "Dev"],
      REFACTOR: ["Dev", "Backend", "Frontend"],
      ANALYSIS: ["Pesquisador", "DataAnalyst"],
      SECURITY: ["SecurityExpert", "Backend", "DevOps"],
      DEPLOYMENT: ["DevOps", "Backend"],
      GENERAL: ["Serginho", "Dev"],
    };
  }

  /**
   * Selecionar especialista baseado em tipo de tarefa
   */
  async selectSpecialist(taskType, keywords = []) {
    console.log(`🎯 Selecionando especialista para: ${taskType}`);

    // Obter especialistas recomendados para o tipo de tarefa
    let candidates = this.taskTypeMapping[taskType] || this.taskTypeMapping["GENERAL"];

    // Se houver keywords, refinar a seleção
    if (keywords && keywords.length > 0) {
      candidates = this.refineByKeywords(candidates, keywords);
    }

    // Selecionar o primeiro (mais recomendado)
    const selected = candidates[0] || "Serginho";

    console.log(`✅ Especialista selecionado: ${selected}`);

    return selected;
  }

  /**
   * Refinar candidatos por keywords
   */
  refineByKeywords(candidates, keywords) {
    const scored = candidates.map((name) => {
      const specialist = this.specialists[name];
      const matches = keywords.filter((kw) =>
        specialist.skills.some(
          (skill) => skill.includes(kw.toLowerCase()) || kw.toLowerCase().includes(skill)
        )
      ).length;

      return { name, score: matches };
    });

    // Ordenar por score (descendente)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.name);
  }

  /**
   * Obter informações de um especialista
   */
  getSpecialistInfo(name) {
    return this.specialists[name] || null;
  }

  /**
   * Listar todos os especialistas
   */
  listAllSpecialists() {
    return Object.values(this.specialists);
  }

  /**
   * Listar especialistas por categoria
   */
  listByCategory(category) {
    return Object.values(this.specialists).filter((s) => s.category === category);
  }

  /**
   * Obter modelo de IA recomendado para especialista
   */
  getRecommendedModel(specialistName) {
    const specialist = this.specialists[specialistName];
    if (!specialist) return "llama-8b";

    // Retornar o primeiro modelo recomendado
    return specialist.models[0] || "llama-8b";
  }

  /**
   * Buscar especialista por skill
   */
  findBySkill(skill) {
    const results = [];

    for (const [name, specialist] of Object.entries(this.specialists)) {
      if (specialist.skills.some((s) => s.includes(skill.toLowerCase()))) {
        results.push(name);
      }
    }

    return results;
  }

  /**
   * Sugerir especialistas para uma tarefa complexa
   */
  suggestTeam(taskType, keywords = []) {
    let candidates = this.taskTypeMapping[taskType] || this.taskTypeMapping["GENERAL"];

    if (keywords && keywords.length > 0) {
      candidates = this.refineByKeywords(candidates, keywords);
    }

    // Retornar top 3 especialistas
    return candidates.slice(0, 3);
  }

  /**
   * Validar se especialista existe
   */
  exists(name) {
    return name in this.specialists;
  }

  /**
   * Adicionar novo especialista (para extensibilidade)
   */
  addSpecialist(name, config) {
    this.specialists[name] = {
      name,
      category: config.category || "CUSTOM",
      skills: config.skills || [],
      models: config.models || ["llama-8b"],
    };

    return true;
  }

  /**
   * Remover especialista
   */
  removeSpecialist(name) {
    if (name === "Serginho") {
      throw new Error("Não é possível remover Serginho (orquestrador)");
    }

    delete this.specialists[name];
    return true;
  }

  /**
   * Obter estatísticas
   */
  getStatistics() {
    const categories = {};
    const totalSkills = new Set();

    for (const specialist of Object.values(this.specialists)) {
      categories[specialist.category] = (categories[specialist.category] || 0) + 1;
      specialist.skills.forEach((skill) => totalSkills.add(skill));
    }

    return {
      totalSpecialists: Object.keys(this.specialists).length,
      categories,
      totalSkills: totalSkills.size,
      uniqueSkills: Array.from(totalSkills),
    };
  }
}

export default SpecialistSelector;
