/**
 * INTELLIGENT ROUTER - RKMMAX
 * Sistema de roteamento inteligente para Serginho
 * Analisa complexidade e roteia para a IA ideal
 *
 * Providers:
 * - Gemini Flash Lite: Conversas simples, rápidas e baratas
 * - GROQ: Processamento turbo, respostas instantâneas
 * - Gemini Pro 2.5: Tarefas complexas, raciocínio profundo
 */

/**
 * Palavras-chave por categoria
 */
const KEYWORDS = {
  // Tarefas que exigem Gemini Pro (complexo)
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
    "api rest",
    "machine learning",
    "inteligência artificial",
    "algoritmo",
    "estrutura de dados",
    "design pattern",
  ],

  // Tarefas que exigem GROQ (turbo)
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

  // Tarefas simples (Gemini Flash)
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
  Object.entries(CODE_PATTERNS).forEach(([key, pattern]) => {
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
 * @param {object} analysis - Resultado de analyzeComplexity()
 * @returns {string} Provider escolhido
 */
export function routeToProvider(analysis) {
  const { scores, hasCode, analysis: details } = analysis;

  // REGRA 1: Código sempre vai para Gemini Pro
  if (hasCode) {
    return {
      provider: "gemini-pro",
      reason: "Mensagem contém código - requer análise profunda",
      confidence: 0.95,
    };
  }

  // REGRA 2: Complexidade alta = Gemini Pro
  if (scores.complexity >= 5) {
    return {
      provider: "gemini-pro",
      reason: "Alta complexidade detectada",
      confidence: 0.9,
    };
  }

  // REGRA 3: GROQ é apenas fallback, nunca primeira escolha
  // (removido roteamento direto para GROQ)

  // REGRA 4: Mensagens longas com termos técnicos = Gemini Pro
  if (details.isLong && details.hasTechnicalTerms) {
    return {
      provider: "gemini-pro",
      reason: "Mensagem longa com contexto técnico",
      confidence: 0.8,
    };
  }

  // REGRA 5: Múltiplas perguntas complexas = Gemini Pro
  if (details.hasMultipleQuestions && scores.complexity > 2) {
    return {
      provider: "gemini-pro",
      reason: "Múltiplas perguntas complexas",
      confidence: 0.85,
    };
  }

  // REGRA 6: Mensagens muito curtas = Gemini Flash (rápido e barato)
  if (details.isVeryShort) {
    return {
      provider: "gemini-flash",
      reason: "Mensagem curta - usando Flash",
      confidence: 0.8,
    };
  }

  // REGRA 7: Padrão = Gemini Flash (custo-benefício)
  return {
    provider: "gemini-flash",
    reason: "Conversa padrão - otimizando custo",
    confidence: 0.7,
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
 * Fallback chain: GROQ é sempre fallback
 * Gemini Flash e Pro se ajudam mutuamente, GROQ é último recurso
 */
export const FALLBACK_CHAIN = {
  "gemini-pro": ["gemini-flash", "groq"],
  "gemini-flash": ["groq"],
  groq: [], // GROQ nunca tem fallback (é o último recurso)
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
