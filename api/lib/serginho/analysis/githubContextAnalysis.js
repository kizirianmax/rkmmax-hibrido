/**
 * api/lib/serginho/analysis/githubContextAnalysis.js
 * Helper de análise incremental sobre contexto GitHub já carregado.
 *
 * Permite ao Serginho responder perguntas analíticas de follow-up (PT-BR e EN)
 * sem re-fetch, usando apenas o contexto in-memory da conversa.
 *
 * Funções exportadas:
 *   - isAnalyticalFollowUp(message)              → detecta pergunta analítica
 *   - hasEnoughContextForAnalysis(githubContext)  → verifica contexto suficiente
 *   - buildAnalysisPrompt(message, githubContext) → monta prompt estruturado
 *   - getInsufficientContextMessage()             → mensagem amigável de contexto vazio
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões analíticos — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas analíticas de follow-up.
 * Cada padrão cobre variações comuns sem ser excessivamente permissivo.
 */
const ANALYTICAL_PATTERNS = [
  // PT-BR — conclusão / análise com referência deítica a dados já carregados
  /o que (você|vc) conclui/i,
  /quais dependên/i,
  /que stack (esse|este|o) projeto/i,
  /há (algum|alguma) risco/i,
  /o que falta para (esse|este) repo/i,
  // "analise isso/esse/este" — exige referência deítica ou é standalone
  /\banalise\s+(isso|esse|este|aqui|o arquivo|o projeto|o repo|essa|esses|estes)/i,
  /^analise[.!?]*$/i,
  /compare isso com/i,
  /o que (esse|este) (package\.json|readme|arquivo)/i,
  /qual parece mais maduro/i,
  /o que (você|vc) acha/i,
  /sua opinião sobre/i,
  /ponto(s)? (fraco|forte)/i,
  /risco(s)? ou ponto/i,

  // PT-BR — outros padrões analíticos (com contexto implícito)
  /\bresuma\b/i,
  /\bconclusão\b/i,
  /\bconclui\b/i,
  /\bopinião\b/i,

  // EN — analytical follow-up com referência deítica ou implícita a dados carregados
  /what do you conclude/i,
  /\bsumm(ary|arize)s?\b/i,
  // "analyze this" exige "this" como pronome deítico, não como parte de "this code function..."
  /\banalyze\s+this(\s+(file|project|repo|code|package|readme|dependencies|output|result))?\s*[.!?]*$/i,
  /\banalyse\s+this(\s+(file|project|repo|code|package|readme|dependencies|output|result))?\s*[.!?]*$/i,
  /what do you think/i,
  /your opinion/i,
  /what stack (does|do) (this|the) project/i,
  /\bany risks?\s+here\b/i,
  /\bwhat risks?\b/i,
  /what.{0,20}(weakness|weaknesses)/i,
  /\b(any|some).{0,20}(weakness|weaknesses)\b/i,
  /what.{0,20}(missing|lacks?)/i,
  /\bconclusion\b/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não analíticos).
 * Se a mensagem bater num desses, não é follow-up analítico.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são analíticos.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta analítica de follow-up sobre contexto GitHub.
 *
 * Retorna `true` para perguntas analíticas como:
 *   - "o que você conclui desse projeto?"
 *   - "quais dependências chamam atenção?"
 *   - "analise isso", "o que você acha?", "sua opinião sobre isso"
 *   - EN: "what do you conclude", "summarize", "analyze this", "what do you think"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos de owner")
 *   - prompts casuais ("oi", "olá", "tudo bem")
 *   - perguntas não relacionadas a GitHub/análise
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isAnalyticalFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not analytical
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not analytical follow-ups
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Messages with inline code (function definitions, code blocks) are not follow-up questions
  if (_hasInlineCode(trimmed)) return false;

  // Check analytical patterns
  for (const pattern of ANALYTICAL_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para análise.
 *
 * Retorna `true` se pelo menos um dos campos abaixo for não-nulo/não-falsy:
 *   - `lastGitHubSummary`
 *   - `lastFileSnippet`
 *   - `lastGitHubResultType`
 *
 * @param {object|null|undefined} githubContext
 * @returns {boolean}
 */
export function hasEnoughContextForAnalysis(githubContext) {
  if (!githubContext) return false;

  return Boolean(
    githubContext.lastGitHubSummary ||
    githubContext.lastFileSnippet ||
    githubContext.lastGitHubResultType,
  );
}

/**
 * Monta um prompt estruturado para análise incremental com base no contexto GitHub.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForAnalysis` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildAnalysisPrompt(message, githubContext) {
  if (!hasEnoughContextForAnalysis(githubContext)) return null;

  const parts = ['[Contexto GitHub para análise]'];

  if (githubContext.lastGitHubSummary) {
    parts.push(githubContext.lastGitHubSummary);
  }

  if (githubContext.lastFileSnippet) {
    parts.push(`Conteúdo do arquivo (trecho):\n${githubContext.lastFileSnippet}`);
  }

  parts.push('');
  parts.push(`Pergunta do usuário: ${message}`);
  parts.push('');
  parts.push(
    'Instruções: Responda SOMENTE com base no contexto GitHub acima. Não invente dados. ' +
    'Se o contexto for insuficiente para responder com precisão, diga isso claramente. ' +
    'Responda em PT-BR. Seja conciso e analítico.',
  );

  return parts.join('\n');
}

/**
 * Retorna mensagem amigável em português para quando não há contexto GitHub carregado.
 *
 * @returns {string}
 */
export function getInsufficientContextMessage() {
  return "Ainda não tenho dados GitHub carregados nesta conversa. Primeiro peça para listar repositórios, branches ou abrir um arquivo. Exemplo: 'mostre o package.json de owner/repo'.";
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem contém código inline (função, bloco JS/TS, etc.).
 * Mensagens com código inline provavelmente não são perguntas analíticas de follow-up
 * sobre dados GitHub já carregados.
 *
 * @param {string} message
 * @returns {boolean}
 */
function _hasInlineCode(message) {
  // Presença de chaves + pelo menos uma palavra-chave de código
  const hasCodeBraces = message.includes('{') && message.includes('}');
  const hasCodeKeyword = /\b(function|const|let|var|class|return|import|export|if\s*\(|for\s*\(|while\s*\()\b/.test(message);
  return hasCodeBraces && hasCodeKeyword;
}
