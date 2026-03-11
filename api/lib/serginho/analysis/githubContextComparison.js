/**
 * api/lib/serginho/analysis/githubContextComparison.js
 * Helper de comparação entre contextos GitHub já carregados na conversa.
 *
 * Permite ao Serginho comparar dois artefatos já vistos na conversa
 * (README vs package.json, contexto atual vs anterior, branches vs descrição)
 * sem re-fetch, sem UI, sem escrita no GitHub.
 *
 * Funções exportadas:
 *   - isComparativeFollowUp(message)                  → detecta pergunta comparativa
 *   - hasEnoughContextForComparison(githubContext)     → verifica contexto suficiente (atual + anterior)
 *   - buildComparisonPrompt(message, githubContext)    → monta prompt estruturado com os dois artefatos
 *   - getInsufficientComparisonContextMessage()        → mensagem amigável de contexto insuficiente
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões comparativos — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas comparativas de follow-up.
 */
const COMPARATIVE_PATTERNS = [
  // PT-BR — comparação explícita
  /\bcompare\s+(isso\s+com|os\s+dois|ambos|o)\b/i,
  /\bcompara(r)?\s+(isso\s+com|os\s+dois|ambos|o)\b/i,
  /\bcomparando\b/i,

  // PT-BR — alinhamento
  /\bestá\s+alinhado\s+com\b/i,
  /\balinhado\s+com\s+(o\s+)?(readme|package)/i,

  // PT-BR — inconsistências/divergências
  /\bhá\s+inconsistên/i,
  /\binconsistência\s+(entre|com)\b/i,
  /\binconsistências\s+(entre|com)\b/i,
  /\bhá\s+divergên/i,
  /\bdivergência\s+(entre|com)\b/i,
  /\bdivergências\s+(entre|com)\b/i,

  // PT-BR — combina / diferença
  /\bcombina\s+com\b/i,
  /\bo\s+que\s+aparece\s+em\s+um\s+e\s+não\s+no\s+outro\b/i,
  /\breadme\s+e\s+package\.json\s+contam\s+a\s+mesma\s+história\b/i,
  /\bo\s+que\s+difere\b/i,
  /\bo\s+que\s+é\s+diferente\b/i,

  // EN — explicit comparison
  /\bcompare\s+(both|the\s+two|them)\b/i,
  /\bis\s+(this|it)\s+aligned\s+with\b/i,
  /\baligned\s+with\b/i,

  // EN — inconsistencies/divergences
  /\bany\s+inconsistenc/i,
  /\binconsistenc(y|ies)\s+between\b/i,
  /\bany\s+divergen/i,
  /\bdivergence\s+between\b/i,

  // EN — matches/differs
  /\bmatches\s+with\b/i,
  /\bwhat\s+differs\b/i,
  /\bwhat\s+is\s+different\b/i,
  /\bsame\s+story\b/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não comparativos).
 * Se a mensagem bater num desses, não é follow-up comparativo.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são comparativos.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta comparativa de follow-up sobre contextos GitHub.
 *
 * Retorna `true` para perguntas como:
 *   - "compare isso com o README"
 *   - "compare os dois", "compare ambos"
 *   - "está alinhado com o README?"
 *   - "há inconsistências entre esse arquivo e o README?"
 *   - EN: "compare both", "any inconsistency between these two?"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos")
 *   - prompts casuais ("oi", "olá")
 *   - perguntas analíticas simples não comparativas
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isComparativeFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not comparative
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not comparative follow-ups
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Check comparative patterns
  for (const pattern of COMPARATIVE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para comparação.
 *
 * Retorna `true` apenas se houver material em pelo menos dois contextos distintos:
 *   - contexto atual: `lastGitHubSummary` ou `lastFileSnippet`
 *   - contexto anterior: `previousGitHubSummary` ou `previousFileSnippet`
 *
 * @param {object|null|undefined} githubContext
 * @returns {boolean}
 */
export function hasEnoughContextForComparison(githubContext) {
  if (!githubContext) return false;

  const hasCurrent = Boolean(
    githubContext.lastGitHubSummary || githubContext.lastFileSnippet,
  );
  const hasPrevious = Boolean(
    githubContext.previousGitHubSummary || githubContext.previousFileSnippet,
  );

  return hasCurrent && hasPrevious;
}

/**
 * Monta prompt estruturado para comparação entre os dois artefatos GitHub carregados.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForComparison` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildComparisonPrompt(message, githubContext) {
  if (!hasEnoughContextForComparison(githubContext)) return null;

  const parts = ['[Comparação GitHub]', ''];

  // Artefato 1 — contexto anterior
  parts.push('**Artefato 1** (anterior):');
  if (githubContext.previousGitHubSummary) {
    parts.push(githubContext.previousGitHubSummary);
  }
  if (githubContext.previousFileSnippet) {
    parts.push(`Conteúdo (trecho):\n${githubContext.previousFileSnippet}`);
  }

  parts.push('');

  // Artefato 2 — contexto atual
  parts.push('**Artefato 2** (atual):');
  if (githubContext.lastGitHubSummary) {
    parts.push(githubContext.lastGitHubSummary);
  }
  if (githubContext.lastFileSnippet) {
    parts.push(`Conteúdo (trecho):\n${githubContext.lastFileSnippet}`);
  }

  parts.push('');
  parts.push(`Pergunta do usuário: ${message}`);
  parts.push('');
  parts.push(
    'Instruções: Compare os dois artefatos acima. Aponte alinhamentos e divergências com base SOMENTE no que está carregado. ' +
    'Não invente dados. Se o contexto for parcial, diga isso claramente. Responda em PT-BR. Seja conciso, técnico e útil.',
  );

  return parts.join('\n');
}

/**
 * Retorna mensagem amigável em português para quando não há contexto suficiente para comparação.
 *
 * @returns {string}
 */
export function getInsufficientComparisonContextMessage() {
  return 'Ainda não tenho contexto GitHub suficiente para comparar. Primeiro abra ou analise pelo menos dois artefatos relacionados, como README.md e package.json.';
}
