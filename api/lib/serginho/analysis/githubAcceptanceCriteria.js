/**
 * api/lib/serginho/analysis/githubAcceptanceCriteria.js
 * Helper de critérios de aceite/validação sobre contexto GitHub já carregado.
 *
 * Permite ao Serginho transformar checklist/plano em itens verificáveis com
 * definição objetiva de "pronto", sem re-fetch, usando apenas o contexto in-memory.
 *
 * Funções exportadas:
 *   - isAcceptanceCriteriaFollowUp(message)            → detecta pergunta de validação/aceite/definição de pronto
 *   - hasEnoughContextForAcceptanceCriteria(githubContext) → verifica contexto suficiente
 *   - buildAcceptanceCriteriaPrompt(message, githubContext) → monta prompt estruturado
 *   - formatAcceptanceCriteriaResponse(rawText, options) → pós-processa resposta do LLM
 *   - getInsufficientAcceptanceCriteriaContextMessage() → mensagem amigável de contexto vazio
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões de critérios de aceite / validação / definição de pronto — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas de critérios de aceite, validação
 * ou definição de pronto.
 */
const ACCEPTANCE_CRITERIA_PATTERNS = [
  // PT-BR
  /\bcritérios? de aceite\b/i,
  /\bcritérios? de aceitação\b/i,
  /\bcritérios? de validação\b/i,
  /\bcritérios? de conclusão\b/i,
  /\bcomo (eu |a gente )?(posso |devo |pode )?(valido|validar|validamos) (isso|este|esse|a solução|o resultado)?\b/i,
  /\bcomo saber (se |quando )?(está|isso|o item|a tarefa)? pronto\b/i,
  /\bcomo saber (se |quando )?(está|o item)? concluído\b/i,
  /\bdefinição de pronto\b/i,
  /\bdefinição de done\b/i,
  /\bo que precisa (ser|estar) (verdadeiro|válido|correto|feito) para (considerar|marcar|declarar)?\b/i,
  /\bquando (posso|podemos|eu) considerar (isso|este|o item|a tarefa)? (pronto|concluído|concluída|feito|done)\b/i,
  /\bprecondições de (aceite|aceitação|conclusão)\b/i,
  /\bevidência(s)? (de|para|esperada)? (aceite|validação|conclusão)\b/i,
  /\b(condição|condições) de pronto\b/i,
  /\b(condição|condições) de aceite\b/i,
  /\brisco(s)? (de|se) não validar\b/i,

  // EN
  /\bacceptance criteria?\b/i,
  /\bvalidation criteria?\b/i,
  /\bdefinition of done\b/i,
  /\bhow (do i|do we|to) validate (this|it|the solution|the result)?\b/i,
  /\bhow (do i|do we|can i) know (this|it|the item|the task)? is done\b/i,
  /\bhow (do i|do we|can i) know (this|it)? is complete\b/i,
  /\bwhat (needs to be|must be) true (to consider|before marking|to declare)?\b/i,
  /\bwhen can (i|we) consider (this|it|the item)? (done|complete|finished)?\b/i,
  /\bcompletion criteria?\b/i,
  /\bdone criteria?\b/i,
  /\bexpected evidence\b/i,
  /\bpreconditions (of|for) (acceptance|completion)\b/i,
  /\brisk(s)? (of|if) (not validating|skipping validation)\b/i,
  /\bwhat is the (exit criteria|ready criteria)\b/i,
  /\bready condition\b/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não follow-up de critérios).
 * Se a mensagem bater num desses, não é follow-up de critérios de aceite.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são critérios de aceite.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta sobre critérios de aceite, validação
 * ou definição de pronto.
 *
 * Retorna `true` para perguntas como:
 *   - "critérios de aceite"
 *   - "como eu valido isso?"
 *   - "como saber se está pronto?"
 *   - "definição de pronto"
 *   - EN: "acceptance criteria", "definition of done", "how to validate"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos de owner")
 *   - prompts casuais ("oi", "olá", "tudo bem")
 *   - perguntas analíticas puras ("o que você conclui?", "analise isso")
 *   - comparações puras ("compare isso com o README")
 *   - recomendações puras ("o que melhorar primeiro?")
 *   - planos puros sem pedido de validação ("me dê um plano de ação")
 *   - checklists puros sem pedido de validação ("me dê um checklist")
 *   - mensagens com código inline
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isAcceptanceCriteriaFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not an acceptance criteria request
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not a follow-up
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Messages with inline code are not acceptance criteria requests
  if (_hasInlineCode(trimmed)) return false;

  // Check acceptance criteria patterns
  for (const pattern of ACCEPTANCE_CRITERIA_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para propor critérios de aceite.
 *
 * Retorna `true` se pelo menos um dos campos abaixo for não-nulo/não-falsy:
 *   - `lastGitHubSummary`
 *   - `lastFileSnippet`
 *   - `lastGitHubResultType`
 *   - `previousGitHubSummary`
 *   - `previousFileSnippet`
 *
 * @param {object|null|undefined} githubContext
 * @returns {boolean}
 */
export function hasEnoughContextForAcceptanceCriteria(githubContext) {
  if (!githubContext) return false;
  return Boolean(
    githubContext.lastGitHubSummary ||
    githubContext.lastFileSnippet ||
    githubContext.lastGitHubResultType ||
    githubContext.previousGitHubSummary ||
    githubContext.previousFileSnippet,
  );
}

/**
 * Monta um prompt estruturado para critérios de aceite com base no contexto GitHub.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForAcceptanceCriteria` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildAcceptanceCriteriaPrompt(message, githubContext) {
  if (!hasEnoughContextForAcceptanceCriteria(githubContext)) return null;

  const parts = ['[Contexto GitHub para critérios de aceite]'];

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
    'Instruções: Com base APENAS no contexto GitHub acima, proponha critérios de aceite objetivos e verificáveis. ' +
    'Não invente dados. Para cada item relevante, quando possível, indique:\n' +
    '- Condição de pronto: o que precisa ser verdadeiro para considerar o item concluído\n' +
    '- Evidência esperada: como demonstrar que está feito (ex: teste passando, log, saída esperada)\n' +
    '- Risco se não validar: o que pode falhar se esse critério for ignorado\n' +
    'Responda em PT-BR. Seja objetivo, técnico e verificável. ' +
    (isPartialContext ? 'ATENÇÃO: os critérios estão sendo gerados com contexto parcial — deixe isso claro na resposta. ' : '') +
    'Se o contexto for insuficiente para propor critérios confiáveis, diga isso claramente.',
  );

  return parts.join('\n');
}

/**
 * Pós-processa a resposta do LLM para um formato Markdown mais estruturado.
 *
 * Regras:
 *   - Sanitiza tokens (sk-*, Bearer, ghp_*, gho_*, ghs_*, github_pat_*)
 *   - Truncamento seguro se `options.maxLength` for fornecido
 *   - Texto curto (< 80 chars) retorna quase intacto
 *   - Se texto já começa com `#`: aplica _addFooterIfNeeded e retorna
 *   - Se não começa com `#`: adiciona header `## Critérios de aceite sugeridos`
 *   - Aplica _addFooterIfNeeded
 *
 * @param {string} rawText - Resposta bruta do LLM
 * @param {object} [options] - Opções de formatação
 * @param {number} [options.maxLength] - Tamanho máximo do texto em caracteres
 * @returns {string}
 */
export function formatAcceptanceCriteriaResponse(rawText, options = {}) {
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
  text = `## Critérios de aceite sugeridos\n\n${text}`;

  return _addFooterIfNeeded(text);
}

/**
 * Retorna mensagem amigável em português para quando não há contexto GitHub carregado.
 *
 * @returns {string}
 */
export function getInsufficientAcceptanceCriteriaContextMessage() {
  return "Ainda não tenho contexto GitHub suficiente para sugerir critérios de aceite confiáveis. Primeiro abra, analise, compare, peça recomendações ou gere um checklist sobre artefatos do repositório. Exemplo: 'mostre o package.json de owner/repo'.";
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
  const footerKeywords = ['baseada', 'baseado', 'based on', 'contexto carregado', 'context loaded', 'parcial', 'partial', 'critérios baseados', 'criteria based'];
  const hasFooter = footerKeywords.some(kw => text.toLowerCase().includes(kw));
  if (!hasFooter) {
    text += '\n\n---\n*Critérios baseados no contexto GitHub carregado nesta conversa.*';
  }
  return text;
}

/**
 * Detecta se a mensagem contém código inline (função, bloco JS/TS, etc.).
 * Mensagens com código inline provavelmente não são perguntas de critérios de aceite.
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
