/**
 * INTELLIGENT ROUTER - RKMMAX
 * Sistema de roteamento inteligente para Serginho
 * 
 * ⚠️ INTERNAL USE ONLY
 * This file contains provider implementation details.
 * External code should use aiAdapter.js interfaces instead.
 * 
 * Provider names (llama-70b, llama-8b, etc.) are implementation details
 * and should NOT be used directly in business logic or tests.
 *
 * Providers with Strict Intelligence-Tier Isolation:
 * - Gemini 2.5 Pro: Análise profunda, estratégia, raciocínio abstrato, contexto longo (Tier 1 — Google)
 * - Llama 3.3 120B: Código complexo, lógica estrita, análise técnica profunda (Tier 1 — Groq)
 * - Llama 3.3 70B: Tarefas técnicas cotidianas, suporte a programação (Tier 2)
 * - Llama 3.1 8B: Conversas simples, rápidas (Tier 3)
 * - GROQ Fallback: Último recurso para alta disponibilidade
 *
 * Routing Policy (calibrado):
 * - Alta complexidade SEM código → gemini-pro (janela maior, melhor para análise/estratégia)
 * - Alta complexidade COM código → llama-120b (velocidade + lógica estrita)
 * - Complexidade média → llama-70b
 * - Simples/curto → llama-8b
 *
 * Critical Rules:
 * - NEVER downgrade complex tasks to llama-8b
 * - NEVER mix intelligence tiers in fallback chains
 * - Maintain strict quality boundaries
 * - gemini-pro is only routed organically when GEMINI_API_KEY is configured
 */

/**
 * Palavras-chave por categoria
 */
const KEYWORDS = {
  // Tarefas que exigem Llama 70B (complexo)
  complex: [
    "analisar",
    "análise",
    "debugar",
    "debug",
    "arquitetura",
    "refatorar",
    "otimizar",
    "planejar",
    "estratégia",
    "complexo",
    "avançado",
    "profundo",
    "detalhado",
    "explicar detalhadamente",
    "como funciona",
    "por que",
    "resolver problema",
    "solução",
    "implementar",
    "código completo",
    "sistema",
    "aplicação",
    "banco de dados",
    "segurança",
    "performance",
    "escalabilidade",
    "microserviços",
    "microsserviços",  // variante com ss
    "api rest",
    "machine learning",
    "inteligência artificial",
    "algoritmo",
    "estrutura de dados",
    "design pattern",
    // Raciocínio estratégico / arquitetural — mensagens que exigem Gemini 2.5 Pro
    "trade-off",
    "trade-offs",
    "distribuído",
    "distribuída",
    "distribuídos",
    "distribuídas",
    "consistência",
    "disponibilidade",
    "monolítico",
    "monolítica",
    "event sourcing",
    "cqrs",
    "projetar",
    "projeto",
    "implicações",
    "implicação",
    "pagamentos",
    "escalar",
    "escalável",
    "startup",
    "startups",
    "produto",
    "estratégia",  // já existe mas reforça o score quando combinada
    "infraestrutura",
    "cloud",
    "kubernetes",
    "docker",
    "ci/cd",
    "devops",
    "monitoramento",
    "observabilidade",
    "latencia",
    "latência",
    "throughput",
    "resiliência",
    "tolerancia",
    "tolerância",
    "particionamento",
    "sharding",
    "replicação",
    "replicaçao",
    "cache",
    "filas",
    "mensageria",
    "kafka",
    "rabbitmq",
    "redis",
    "postgresql",
    "mongodb",
    // Tarefas de criação de conteúdo — exigem modelo capaz, não somente conversa rápida
    "criar",
    "crie",
    "cria",
    "escrever",
    "escreva",
    "escreve",
    "redigir",
    "redija",
    "elaborar",
    "elabore",
    "desenvolver",
    "desenvolva",
    "prompt",
    "prompet",  // variante de digitação frequente de 'prompt'
    "prompts",
    "redação",
    "artigo",
    "relatório",
    "documento",
    "proposta",
    "roteiro",
    "script",
    "apresentação",
  ],

  // Tarefas que exigem processamento rápido (turbo)
  fast: [
    "rápido",
    "urgente",
    "agora",
    "já",
    "sugestão",
    "sugerir",
    "ideia",
    "dica",
    "traduzir",
    "tradução",
    "converter",
    "resumir",
    "resumo",
    "sintetizar",
    "listar",
    "lista",
    "enumerar",
    "exemplo",
    "exemplos",
    "amostra",
    "autocompletar",
    "completar",
    "continuar",
    "corrigir",
    "correção",
    "erro",
    "snippet",
    "trecho",
    "pedaço",
  ],

  // Tarefas simples (Llama 8B)
  simple: [
    "olá",
    "oi",
    "hey",
    "e aí",
    "como",
    "o que é",
    "qual",
    "me conte",
    "fale sobre",
    "explique",
    "defina",
    "definição",
    "diferença",
    "comparar",
    "versus",
  ],
};

/**
 * Padrões de código que indicam complexidade
 */
const CODE_PATTERNS = {
  hasCodeBlock: /```[\s\S]*```/,
  hasMultipleLines: /\n.*\n.*\n/,
  hasFunction: /function\s+\w+|const\s+\w+\s*=\s*\(|=>/,
  hasClass: /class\s+\w+/,
  hasImport: /import\s+.*from|require\(/,
  hasAsync: /async|await|Promise/,
  hasRegex: /\/.*\//,
  hasSQL: /SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER/i,
};

/**
 * Analisa a complexidade de uma mensagem
 * @param {string} message - Mensagem do usuário
 * @returns {object} Análise completa
 */
export function analyzeComplexity(message) {
  const text = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  const charCount = message.length;
  const lineCount = message.split("\n").length;

  // Scores
  let complexityScore = 0;
  let speedScore = 0;
  let simpleScore = 0;

  // 1. Análise de palavras-chave
  KEYWORDS.complex.forEach((keyword) => {
    if (text.includes(keyword)) complexityScore += 2;
  });

  KEYWORDS.fast.forEach((keyword) => {
    if (text.includes(keyword)) speedScore += 1.5;
  });

  KEYWORDS.simple.forEach((keyword) => {
    if (text.includes(keyword)) simpleScore += 1;
  });

  // 2. Análise de código
  let hasCode = false;
  Object.entries(CODE_PATTERNS).forEach(([, pattern]) => {
    if (pattern.test(message)) {
      complexityScore += 3;
      hasCode = true;
    }
  });

  // 3. Análise de tamanho
  if (wordCount > 100) complexityScore += 2;
  if (wordCount > 200) complexityScore += 3;
  if (lineCount > 10) complexityScore += 2;
  if (charCount > 500) complexityScore += 2;

  // 4. Análise de perguntas
  const questionMarks = (message.match(/\?/g) || []).length;
  if (questionMarks > 2) complexityScore += 1;

  // 5. Análise de contexto técnico
  const technicalTerms = [
    "api",
    "endpoint",
    "request",
    "response",
    "json",
    "database",
    "query",
    "schema",
    "model",
    "controller",
    "frontend",
    "backend",
    "fullstack",
    "deploy",
    "server",
  ];

  technicalTerms.forEach((term) => {
    if (text.includes(term)) complexityScore += 1;
  });

  // 6. Mensagens muito curtas = simples ou rápidas
  if (wordCount < 10) {
    simpleScore += 2;
    speedScore += 1;
  }

  return {
    message,
    wordCount,
    charCount,
    lineCount,
    hasCode,
    scores: {
      complexity: complexityScore,
      speed: speedScore,
      simple: simpleScore,
    },
    analysis: {
      isVeryShort: wordCount < 10,
      isShort: wordCount < 30,
      isMedium: wordCount >= 30 && wordCount < 100,
      isLong: wordCount >= 100,
      hasMultipleQuestions: questionMarks > 2,
      hasTechnicalTerms: complexityScore > 0,
    },
  };
}

/**
 * Decide qual provider usar baseado na análise
 * Implementa isolamento estrito de níveis de inteligência
 *
 * @param {object} analysis - Resultado de analyzeComplexity()
 * @param {object} [options={}] - Opções de roteamento
 * @param {string[]} [options.enabledProviders] - Lista de providers habilitados (env vars configuradas).
 *   Se não fornecida, o Gemini é considerado disponível (o orchestrator filtra providers desabilitados).
 * @returns {object} { provider, reason, confidence, tier }
 */
export function routeToProvider(analysis, options = {}) {
  const { scores, hasCode, analysis: details } = analysis;

  // Determina se o Gemini está disponível para roteamento orgânico.
  // Se enabledProviders não for fornecido (chamada sem contexto de env), assume disponível
  // para não acoplar o router ao ambiente. O orchestrator filtra providers desabilitados.
  const enabledProviders = options.enabledProviders || null;
  const geminiAvailable = enabledProviders
    ? enabledProviders.includes('gemini-pro')
    : true;

  // TIER 1: Tarefas MUITO COMPLEXAS
  // REGRA 1: Código sempre vai para Llama 120B (velocidade + lógica estrita, sem latência do Gemini)
  if (hasCode) {
    return {
      provider: "llama-120b",
      reason: "Mensagem contém código — Llama 120B: velocidade + lógica estrita",
      confidence: 0.95,
      tier: "complex",
    };
  }

  // REGRA 2: Complexidade muito alta SEM código → Gemini 2.5 Pro
  // Gemini tem janela de contexto massiva (8192 tokens output vs 2048 Groq) e é superior
  // para análise estratégica, raciocínio abstrato e tarefas que exigem profundidade analítica.
  // Fallback automático para llama-120b se Gemini não estiver disponível.
  if (scores.complexity >= 8 && geminiAvailable) {
    return {
      provider: "gemini-pro",
      reason: "Complexidade muito alta sem código — Gemini 2.5 Pro: análise profunda e contexto longo",
      confidence: 0.93,
      tier: "complex",
    };
  }

  // REGRA 2b: Complexidade muito alta, Gemini indisponível → Llama 120B
  if (scores.complexity >= 8) {
    return {
      provider: "llama-120b",
      reason: "Complexidade muito alta detectada (Gemini indisponível, usando Llama 120B)",
      confidence: 0.92,
      tier: "complex",
    };
  }

  // REGRA 3: Mensagens longas com múltiplos termos técnicos SEM código → Gemini 2.5 Pro
  // Contexto longo + análise técnica não-código é o ponto forte do Gemini.
  if (details.isLong && details.hasTechnicalTerms && scores.complexity >= 5 && !hasCode && geminiAvailable) {
    return {
      provider: "gemini-pro",
      reason: "Mensagem longa e complexa sem código — Gemini 2.5 Pro: contexto longo e análise técnica",
      confidence: 0.88,
      tier: "complex",
    };
  }

  // REGRA 3b: Mensagens longas com termos técnicos, Gemini indisponível → Llama 120B
  if (details.isLong && details.hasTechnicalTerms && scores.complexity >= 5) {
    return {
      provider: "llama-120b",
      reason: "Mensagem longa e complexa com contexto técnico profundo",
      confidence: 0.9,
      tier: "complex",
    };
  }

  // REGRA 3.5: Alta complexidade analítica (score >= 6) sem código → Gemini 2.5 Pro
  // Cobre perguntas estratégicas/analíticas complexas mas não longas o suficiente para REGRA 3.
  if (scores.complexity >= 6 && !hasCode && geminiAvailable) {
    return {
      provider: "gemini-pro",
      reason: "Alta complexidade analítica sem código — Gemini 2.5 Pro: raciocínio e estratégia",
      confidence: 0.85,
      tier: "complex",
    };
  }

  // TIER 2: Tarefas MÉDIAS/COMPLEXAS → llama-70b
  // REGRA 4: Complexidade alta = Llama 70B
  if (scores.complexity >= 5) {
    return {
      provider: "llama-70b",
      reason: "Complexidade alta detectada",
      confidence: 0.9,
      tier: "medium",
    };
  }

  // REGRA 5: Mensagens longas com termos técnicos = Llama 70B
  if (details.isLong && details.hasTechnicalTerms) {
    return {
      provider: "llama-70b",
      reason: "Mensagem longa com contexto técnico",
      confidence: 0.8,
      tier: "medium",
    };
  }

  // REGRA 6: Múltiplas perguntas complexas = Llama 70B
  if (details.hasMultipleQuestions && scores.complexity > 2) {
    return {
      provider: "llama-70b",
      reason: "Múltiplas perguntas complexas",
      confidence: 0.85,
      tier: "medium",
    };
  }

  // REGRA 7: Tarefas médias = Llama 70B
  if (details.isMedium && scores.complexity > 1) {
    return {
      provider: "llama-70b",
      reason: "Tarefa de complexidade média",
      confidence: 0.75,
      tier: "medium",
    };
  }

  // TIER 3: Tarefas SIMPLES → llama-8b
  // REGRA 8: Mensagens muito curtas = Llama 8B (rápido e eficiente)
  // EXCEPÇÃO: se a mensagem curta contém keywords de criação de conteúdo (score >= 2),
  // usa 70B — "Faz um prompt" é curto mas exige modelo capaz, não apenas conversação.
  if (details.isVeryShort) {
    if (scores.complexity >= 2) {
      return {
        provider: "llama-70b",
        reason: "Mensagem curta com tarefa de criação/elaboração — Llama 70B: qualidade mínima para conteúdo",
        confidence: 0.75,
        tier: "medium",
      };
    }
    return {
      provider: "llama-8b",
      reason: "Mensagem curta - usando modelo rápido",
      confidence: 0.8,
      tier: "simple",
    };
  }

  // REGRA 9: Padrão = Llama 8B (custo-benefício)
  return {
    provider: "llama-8b",
    reason: "Conversa padrão - otimizando velocidade",
    confidence: 0.7,
    tier: "simple",
  };
}

/**
 * Função principal: analisa e roteia
 * @param {string} message - Mensagem do usuário
 * @returns {object} Provider e detalhes
 */
export function intelligentRoute(message) {
  const analysis = analyzeComplexity(message);
  const routing = routeToProvider(analysis);

  return {
    ...routing,
    analysis,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fallback chain with Strict Intelligence-Tier Isolation
 * NEVER downgrade complex tasks to llama-8b
 * NEVER mix intelligence tiers
 *
 * Política de fallback (calibrada — intercâmbio Groq ↔ Google):
 * - gemini-pro: se falhar → llama-120b → llama-70b → groq-fallback
 *   (Gemini falhou? Cai para o melhor da Groq, nunca para o 8B diretamente)
 * - llama-120b: se falhar → gemini-pro → llama-70b → groq-fallback
 *   (120B falhou? Tenta Gemini antes de degradar para 70B)
 * - llama-70b: se falhar → groq-fallback
 *   (Sem intercâmbio com Gemini: tier médio não justifica latência do Gemini)
 * - llama-8b: se falhar → groq-fallback
 * - groq-fallback: último recurso, sem fallback
 *
 * NOTA: providers desabilitados (sem API key) são automaticamente pulados
 * pelo orchestrator (getEnabledProviders() + while loop no _handleStructured).
 */
export const FALLBACK_CHAIN = {
  // Google tier: Gemini falhou → melhor da Groq, nunca direto para 8B
  "gemini-pro": ["llama-120b", "llama-70b", "groq-fallback"],
  // Complex tier Groq: 120B falhou → tenta Gemini antes de degradar
  "llama-120b": ["gemini-pro", "llama-70b", "groq-fallback"],
  // Medium tier: 70B falhou → tenta 120B (modelo diferente, evita double-fail no mesmo
  // endpoint) antes do groq-fallback. Gemini é pulado aqui para manter latência aceitável.
  "llama-70b": ["llama-120b", "groq-fallback"],
  // Simple tier: fallback para 70B antes do groq-fallback (evita falha total quando 8B
  // e groq-fallback usam o mesmo modelo llama-3.1-8b-instant e ambos recebem rate limit)
  "llama-8b": ["llama-70b", "groq-fallback"],
  // Último recurso
  "groq-fallback": [],
};

/**
 * Obter próximo provider no fallback
 * @param {string} failedProvider - Provider que falhou
 * @param {array} triedProviders - Providers já tentados
 * @returns {string|null} Próximo provider ou null
 */
export function getNextFallback(failedProvider, triedProviders = []) {
  const chain = FALLBACK_CHAIN[failedProvider] || [];

  for (const provider of chain) {
    if (!triedProviders.includes(provider)) {
      return provider;
    }
  }

  return null;
}

export default {
  analyzeComplexity,
  routeToProvider,
  intelligentRoute,
  getNextFallback,
  FALLBACK_CHAIN,
};
