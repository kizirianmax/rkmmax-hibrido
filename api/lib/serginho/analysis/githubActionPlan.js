/**
 * api/lib/serginho/analysis/githubActionPlan.js
 * Helper de plano de ação sequencial sobre contexto GitHub já carregado.
 *
 * Permite ao Serginho transformar análise/recomendação em um mini-roadmap prático
 * e ordenado, sem re-fetch, usando apenas o contexto in-memory da conversa.
 *
 * Funções exportadas:
 *   - isActionPlanFollowUp(message)                  → detecta pergunta de plano/roadmap/sequência
 *   - hasEnoughContextForActionPlan(githubContext)    → verifica contexto suficiente
 *   - buildActionPlanPrompt(message, githubContext)   → monta prompt estruturado
 *   - formatActionPlanResponse(rawText, options)      → pós-processa resposta do LLM
 *   - getInsufficientActionPlanContextMessage()       → mensagem amigável de contexto vazio
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões de plano de ação / roadmap / sequência — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas de plano de ação, roadmap ou sequência.
 */
const ACTION_PLAN_PATTERNS = [
  // PT-BR
  /\bplano de ação\b/i,
  /\bmini.?roadmap\b/i,
  /\broadmap\b/i,
  /\bsequência ideal\b/i,
  /\bsequência de (execução|passos|ações|implementação)\b/i,
  /\bordem de execução\b/i,
  /\b(organize|organizar|organiza) em etapas\b/i,
  /\bpassos (que |que eu |eu )?(devo|deveria|preciso) seguir\b/i,
  /\bplano curto\b/i,
  /\bplano rápido\b/i,
  /\bmonte (um|o) (plano|roadmap|mini-roadmap)\b/i,
  /\bme (dê|dá|dê um|dá um) (um plano|um roadmap|um mini-roadmap)\b/i,
  /\bpor ordem de (impacto|esforço|prioridade|risco)\b/i,
  /\bordene (isso|as etapas|os passos|as ações) por (impacto|esforço|prioridade|risco)\b/i,
  /\bquais etapas\b/i,
  /\bsequência de trabalho\b/i,
  /\bsequência prática\b/i,
  /\bplano de melhoria\b/i,
  /\bplano de implementação\b/i,

  // EN
  /\baction plan\b/i,
  /\broad.?map\b/i,
  /\bshort roadmap\b/i,
  /\bsequence (to follow|of steps|of actions|of execution)\b/i,
  /\bexecution order\b/i,
  /\bordered steps\b/i,
  /\bwhat (plan|sequence) would you suggest\b/i,
  /\bgive me (a short|a mini|a|the) road.?map\b/i,
  /\bgive me (a|the) plan\b/i,
  /\bwhat sequence should (i|we) follow\b/i,
  /\bstep.by.step plan\b/i,
  /\bimplementation plan\b/i,
  /\bprioritize (these|the|by) (steps|actions|items)\b/i,
  /\bwhat (steps|actions) should (i|we) take\b/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não plano de ação de follow-up).
 * Se a mensagem bater num desses, não é follow-up de plano de ação.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são planos de ação.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta de plano de ação, roadmap ou sequência.
 *
 * Retorna `true` para perguntas como:
 *   - "me dê um plano de ação"
 *   - "qual seria a sequência ideal?"
 *   - "monte um mini roadmap"
 *   - EN: "give me a short roadmap", "what steps should we take?"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos de owner")
 *   - prompts casuais ("oi", "olá", "tudo bem")
 *   - perguntas analíticas puras ("o que você conclui?", "analise isso")
 *   - perguntas comparativas puras ("compare isso com o README")
 *   - recomendações puras sem sequência ("o que melhorar primeiro?")
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isActionPlanFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not an action plan request
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not a follow-up
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Messages with inline code are not action plan requests
  if (_hasInlineCode(trimmed)) return false;

  // Check action plan patterns
  for (const pattern of ACTION_PLAN_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para montar um plano de ação.
 *
 * Retorna `true` se pelo menos um dos campos abaixo for não-nulo/não-falsy:
 *   - `lastGitHubSummary`
 *   - `lastFileSnippet`
 *   - `lastGitHubResultType`
 *
 * @param {object|null|undefined} githubContext
 * @returns {boolean}
 */
export function hasEnoughContextForActionPlan(githubContext) {
  if (!githubContext) return false;

  return Boolean(
    githubContext.lastGitHubSummary ||
    githubContext.lastFileSnippet ||
    githubContext.lastGitHubResultType,
  );
}

/**
 * Monta um prompt estruturado para plano de ação sequencial com base no contexto GitHub.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForActionPlan` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildActionPlanPrompt(message, githubContext) {
  if (!hasEnoughContextForActionPlan(githubContext)) return null;

  const parts = ['[Contexto GitHub para plano de ação]'];

  if (githubContext.lastGitHubSummary) {
    parts.push(githubContext.lastGitHubSummary);
  }

  if (githubContext.lastFileSnippet) {
    parts.push(`Conteúdo do arquivo (trecho):\n${githubContext.lastFileSnippet}`);
  }

  if (githubContext.previousGitHubSummary) {
    parts.push('');
    parts.push('Contexto anterior:');
    parts.push(githubContext.previousGitHubSummary);

    if (githubContext.previousFileSnippet) {
      parts.push(`Conteúdo anterior (trecho):\n${githubContext.previousFileSnippet}`);
    }
  }

  const isPartialContext = !githubContext.lastGitHubSummary && !githubContext.lastFileSnippet;

  parts.push('');
  parts.push(`Pergunta do usuário: ${message}`);
  parts.push('');
  parts.push(
    'Instruções: Com base APENAS no contexto GitHub acima, monte um plano de ação sequencial curto e prático. ' +
    'Não invente dados. Apresente as etapas em ordem lógica de execução. ' +
    'Quando possível, para cada etapa indique: prioridade (Alta/Média/Baixa), impacto (Alto/Médio/Baixo), ' +
    'esforço (Alto/Médio/Baixo) e risco (Alto/Médio/Baixo). ' +
    'Explique brevemente o motivo de cada etapa. Responda em PT-BR. ' +
    'Seja objetivo, técnico e acionável. ' +
    (isPartialContext ? 'ATENÇÃO: o plano está sendo gerado com contexto parcial — deixe isso claro na resposta. ' : '') +
    'Se o contexto for insuficiente para montar um plano confiável, diga isso claramente.',
  );

  return parts.join('\n');
}

/**
 * Pós-processa a resposta do LLM para um formato Markdown mais estruturado.
 *
 * Regras:
 *   - Não inventa seções
 *   - Texto curto (< 80 chars) retorna quase intacto
 *   - Truncamento seguro se `options.maxLength` for fornecido
 *   - Nunca vaza token, stacktrace ou headers
 *   - Adiciona cabeçalho `## Plano de ação sugerido` se o texto não começar com `#`
 *   - Adiciona rodapé se não houver rodapé similar
 *   - Se o texto já contiver `##` ou `#`, não adiciona cabeçalho (já estruturado pelo LLM)
 *
 * @param {string} rawText - Resposta bruta do LLM
 * @param {object} [options] - Opções de formatação
 * @param {number} [options.maxLength] - Tamanho máximo do texto em caracteres
 * @returns {string}
 */
export function formatActionPlanResponse(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();
  if (!text) return '';

  // Sanitize: remove potential token leaks
  text = text.replace(/\b(sk-[a-zA-Z0-9]{20,}|Bearer\s+\S+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{22,})\b/g, '[REDACTED]');

  // Truncate if maxLength provided
  if (options.maxLength && text.length > options.maxLength) {
    text = text.slice(0, options.maxLength).trimEnd() + '\n\n[resposta truncada]';
  }

  // Short text fallback
  if (text.length < 80) return text;

  // If text already has markdown headers, preserve structure
  if (text.startsWith('#')) return _addFooterIfNeeded(text);

  // Add header if not present
  text = `## Plano de ação sugerido\n\n${text}`;

  return _addFooterIfNeeded(text);
}

/**
 * Retorna mensagem amigável em português para quando não há contexto GitHub carregado.
 *
 * @returns {string}
 */
export function getInsufficientActionPlanContextMessage() {
  return "Ainda não tenho contexto GitHub suficiente para montar um plano de ação confiável. Primeiro abra, analise, compare ou peça recomendações sobre artefatos do repositório. Exemplo: 'mostre o package.json de owner/repo'.";
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Adiciona rodapé ao texto se ainda não houver um.
 *
 * @param {string} text
 * @returns {string}
 */
function _addFooterIfNeeded(text) {
  const footerKeywords = ['baseada', 'baseado', 'based on', 'contexto carregado', 'context loaded', 'parcial', 'partial'];
  const hasFooter = footerKeywords.some(kw => text.toLowerCase().includes(kw));
  if (!hasFooter) {
    text += '\n\n---\n*Plano baseado no contexto GitHub carregado nesta conversa.*';
  }
  return text;
}

/**
 * Detecta se a mensagem contém código inline (função, bloco JS/TS, etc.).
 * Mensagens com código inline provavelmente não são perguntas de plano de ação.
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
