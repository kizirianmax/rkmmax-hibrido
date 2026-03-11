/**
 * api/lib/serginho/analysis/githubExecutionChecklist.js
 * Helper de checklist executável de curto prazo sobre contexto GitHub já carregado.
 *
 * Permite ao Serginho transformar análise/recomendação/plano em uma lista prática
 * de execução com itens objetivos, sem re-fetch, usando apenas o contexto in-memory.
 *
 * Funções exportadas:
 *   - isExecutionChecklistFollowUp(message)            → detecta pergunta de checklist/tarefas/lista executável
 *   - hasEnoughContextForChecklist(githubContext)       → verifica contexto suficiente
 *   - buildChecklistPrompt(message, githubContext)      → monta prompt estruturado
 *   - formatChecklistResponse(rawText, options)         → pós-processa resposta do LLM
 *   - getInsufficientChecklistContextMessage()          → mensagem amigável de contexto vazio
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões de checklist executável / tarefas / lista prática — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas de checklist, tarefas ou lista executável.
 */
const EXECUTION_CHECKLIST_PATTERNS = [
  // PT-BR
  /\bchecklist\b/i,
  /\blista de tarefas\b/i,
  /\blista (de |de execução |de itens |de ações |prática )?(executável|executáveis|prática|práticos)?\b/i,
  /\bquebra (isso |em )?(em )?tarefas\b/i,
  /\btransforma (isso |em )?em (itens|passos|tarefas) executáveis\b/i,
  /\bpassos executáveis\b/i,
  /\bitens (práticos|executáveis|acionáveis)\b/i,
  /\borganize (isso |em )?em checklist\b/i,
  /\bo que (eu |a gente )?(devo |posso |preciso )?execut(ar|o|amos) (agora|hoje|nessa sprint|neste sprint)?\b/i,
  /\bquais (itens|tarefas) (eu |devo |eu devo )?executar\b/i,
  /\bme (dê|dá|dê um|dá uma) (uma? )?lista (prática|executável|de tarefas|de itens|de passos)\b/i,
  /\bme (dê|dá) (um )?checklist\b/i,
  /\btarefas (curtas|práticas|de curto prazo)\b/i,
  /\bitens (de execução|de curto prazo)\b/i,

  // EN
  /\b(actionable )?checklist\b/i,
  /\bbreak (this |it )?(down )?into (tasks|items|steps)\b/i,
  /\bturn (this |it )?into actionable items\b/i,
  /\bpractical (steps|items|tasks)\b/i,
  /\btask list\b/i,
  /\bexecution checklist\b/i,
  /\bwhat (checklist|items|tasks) would you suggest\b/i,
  /\bwhat (should |do )?(i|we) execute (now|today|next|first)?\b/i,
  /\bgive me (a |an )?actionable (list|checklist)\b/i,
  /\bgive me (a )?task list\b/i,
  /\bbreak (this |the )?(down )?into executable (steps|tasks|items)\b/i,
  /\bshort.?term (tasks|checklist|items)\b/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não checklist de follow-up).
 * Se a mensagem bater num desses, não é follow-up de checklist.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são checklist executável.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta de checklist executável, lista de tarefas ou
 * passos práticos.
 *
 * Retorna `true` para perguntas como:
 *   - "me dê um checklist"
 *   - "lista de tarefas"
 *   - "quebra isso em tarefas"
 *   - "passos executáveis"
 *   - EN: "give me an actionable checklist", "break this into tasks"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos de owner")
 *   - prompts casuais ("oi", "olá", "tudo bem")
 *   - perguntas analíticas puras ("o que você conclui?", "analise isso")
 *   - perguntas comparativas puras ("compare isso com o README")
 *   - recomendações puras sem pedido de checklist ("o que melhorar primeiro?")
 *   - planos puros sem pedido de checklist ("me dê um plano de ação", "roadmap")
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isExecutionChecklistFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not a checklist request
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not a follow-up
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Messages with inline code are not checklist requests
  if (_hasInlineCode(trimmed)) return false;

  // Check execution checklist patterns
  for (const pattern of EXECUTION_CHECKLIST_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para montar um checklist executável.
 *
 * Retorna `true` se pelo menos um dos campos abaixo for não-nulo/não-falsy:
 *   - `lastGitHubSummary`
 *   - `lastFileSnippet`
 *   - `lastGitHubResultType`
 *
 * @param {object|null|undefined} githubContext
 * @returns {boolean}
 */
export function hasEnoughContextForChecklist(githubContext) {
  if (!githubContext) return false;

  return Boolean(
    githubContext.lastGitHubSummary ||
    githubContext.lastFileSnippet ||
    githubContext.lastGitHubResultType,
  );
}

/**
 * Monta um prompt estruturado para checklist executável de curto prazo com base no contexto GitHub.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForChecklist` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildChecklistPrompt(message, githubContext) {
  if (!hasEnoughContextForChecklist(githubContext)) return null;

  const parts = ['[Contexto GitHub para checklist executável]'];

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
    'Instruções: Com base APENAS no contexto GitHub acima, crie um checklist executável de curto prazo. ' +
    'Não invente dados. Quebre em itens curtos, claros e acionáveis. ' +
    'Para cada item, quando possível, indique: prioridade (Alta/Média/Baixa), ' +
    'dependência (qual item precede este, ou "Nenhuma") e critério de conclusão (como saber que o item está feito). ' +
    'Responda em PT-BR. Seja objetivo, técnico e acionável. ' +
    (isPartialContext ? 'ATENÇÃO: o checklist está sendo gerado com contexto parcial — deixe isso claro na resposta. ' : '') +
    'Se o contexto for insuficiente para montar um checklist confiável, diga isso claramente.',
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
 *   - Adiciona cabeçalho `## Checklist sugerido` se o texto não começar com `#`
 *   - Adiciona rodapé se não houver rodapé similar
 *   - Se o texto já contiver `##` ou `#`, não adiciona cabeçalho (já estruturado pelo LLM)
 *   - Adiciona indicador de contexto parcial no rodapé quando detectado
 *
 * @param {string} rawText - Resposta bruta do LLM
 * @param {object} [options] - Opções de formatação
 * @param {number} [options.maxLength] - Tamanho máximo do texto em caracteres
 * @returns {string}
 */
export function formatChecklistResponse(rawText, options = {}) {
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
  text = `## Checklist sugerido\n\n${text}`;

  return _addFooterIfNeeded(text);
}

/**
 * Retorna mensagem amigável em português para quando não há contexto GitHub carregado.
 *
 * @returns {string}
 */
export function getInsufficientChecklistContextMessage() {
  return "Ainda não tenho contexto GitHub suficiente para montar um checklist executável confiável. Primeiro abra, analise, compare ou peça recomendações sobre artefatos do repositório. Exemplo: 'mostre o package.json de owner/repo'.";
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Adiciona rodapé ao texto se ainda não houver um.
 * Também adiciona indicador de contexto parcial quando detectado.
 *
 * @param {string} text
 * @returns {string}
 */
function _addFooterIfNeeded(text) {
  const footerKeywords = ['baseada', 'baseado', 'based on', 'contexto carregado', 'context loaded', 'parcial', 'partial'];
  const hasFooter = footerKeywords.some(kw => text.toLowerCase().includes(kw));
  if (!hasFooter) {
    text += '\n\n---\n*Checklist baseado no contexto GitHub carregado nesta conversa.*';
  }
  return text;
}

/**
 * Detecta se a mensagem contém código inline (função, bloco JS/TS, etc.).
 * Mensagens com código inline provavelmente não são perguntas de checklist.
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
