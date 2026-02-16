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
 * - Llama 3.3 120B: Tarefas muito complexas, análise profunda (Tier 1)
 * - Llama 3.3 70B: Tarefas complexas e médias (Tier 2)
 * - Llama 3.1 8B: Conversas simples, rápidas (Tier 3)
 * - GROQ Fallback: Último recurso para alta disponibilidade
 *
 * Critical Rules:
 * - NEVER downgrade complex tasks to llama-8b
 * - NEVER mix intelligence tiers in fallback chains
 * - Maintain strict quality boundaries
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
    "api rest",
    "machine learning",
    "inteligência artificial",
    "algoritmo",
    "estrutura de dados",
    "design pattern",
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
 * @param {object} analysis - Resultado de analyzeComplexity()
 * @returns {string} Provider escolhido
 */
export function routeToProvider(analysis) {
  const { scores, hasCode, analysis: details } = analysis;

  // TIER 1: Tarefas MUITO COMPLEXAS → llama-120b
  // REGRA 1: Código sempre vai para Llama 120B (máxima capacidade)
  if (hasCode) {
    return {
      provider: "llama-120b",
      reason: "Mensagem contém código - requer análise máxima",
      confidence: 0.95,
      tier: "complex",
    };
  }

  // REGRA 2: Complexidade muito alta = Llama 120B
  if (scores.complexity >= 8) {
    return {
      provider: "llama-120b",
      reason: "Complexidade muito alta detectada",
      confidence: 0.95,
      tier: "complex",
    };
  }

  // REGRA 3: Mensagens longas com múltiplos termos técnicos = Llama 120B
  if (details.isLong && details.hasTechnicalTerms && scores.complexity >= 5) {
    return {
      provider: "llama-120b",
      reason: "Mensagem longa e complexa com contexto técnico profundo",
      confidence: 0.9,
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
  if (details.isVeryShort) {
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
 * Complex tier: llama-120b → llama-70b → groq-fallback (NEVER llama-8b)
 * Medium tier: llama-70b → groq-fallback
 * Simple tier: llama-8b → groq-fallback
 */
export const FALLBACK_CHAIN = {
  "llama-120b": ["llama-70b", "groq-fallback"], // Complex tier: NEVER downgrade to 8b
  "llama-70b": ["groq-fallback"], // Medium tier: Skip 8b, go directly to fallback
  "llama-8b": ["groq-fallback"], // Simple tier: Only fallback to groq
  "groq-fallback": [], // Último recurso
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
