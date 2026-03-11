/**
 * api/lib/serginho/analysis/githubExecutionDependencies.js
 * Helper de dependências de execução / bloqueios / pré-requisitos sobre contexto GitHub já carregado.
 *
 * Permite ao Serginho transformar plano/checklist em uma visão estruturada de execução —
 * indicando o que depende do quê, o que bloqueia avanço e o que pode rodar em paralelo —
 * sem re-fetch, usando apenas o contexto in-memory.
 *
 * Funções exportadas:
 *   - isExecutionDependenciesFollowUp(message)               → detecta perguntas de dependências/bloqueios/pré-requisitos/paralelismo
 *   - hasEnoughContextForExecutionDependencies(githubContext) → verifica contexto suficiente (inclui campos anteriores)
 *   - buildExecutionDependenciesPrompt(message, githubContext) → monta prompt estruturado
 *   - formatExecutionDependenciesResponse(rawText, options)   → pós-processa resposta do LLM
 *   - getInsufficientExecutionDependenciesContextMessage()    → mensagem amigável de contexto vazio
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões de dependências de execução / bloqueios / pré-requisitos — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas de dependências, bloqueios,
 * pré-requisitos, ordem de precedência e paralelismo.
 */
const EXECUTION_DEPENDENCIES_PATTERNS = [
  // PT-BR — dependências
  /\bdepende(ncias?|ntes?)?\b.{0,30}\bdo qu[eê]\b/i,
  /\bdepende(ncias?|ntes?)?\b.{0,30}\bdo qu[eê]\?/i,
  /\bdepende do (que|quê)\b/i,
  /\bdepend[eê]ncias? de execução\b/i,
  /\bo que depende (de|do|da)\b/i,
  /\bdo que depende\b/i,
  /\bo que (precisa|preciso) vir (antes|primeiro)\b/i,
  /\bo que (vem|deve vir|tem que vir) antes\b/i,

  // PT-BR — pré-requisitos
  /\bpré-?requisitos?\b/i,
  /\bpre-?requisitos?\b/i,
  /\bpré-condições?\b/i,

  // PT-BR — bloqueios
  /\bbloqueio(s)?\b.{0,30}\b(execução|avanço|desenvolvimento|progresso)\b/i,
  /\bo que (está|esta) (bloqueando|travando|impedindo)\b/i,
  /\bblockers?\b/i,
  /\bo que bloqueia\b/i,

  // PT-BR — paralelismo
  /\bem paralelo\b/i,
  /\bparalelo(s)?\b.{0,40}\b(executar|rodar|trabalhar|fazer)\b/i,
  /\bparalelismo\b/i,
  /\bo que pode(mos)? (rodar|executar|trabalhar|fazer) em paralelo\b/i,
  /\bo que pode(mos)? ser feito (ao mesmo tempo|simultaneamente)\b/i,

  // PT-BR — ordem de precedência / execução
  /\bordem de precedência\b/i,
  /\bordem de execução\b/i,
  /\bordem de dependência\b/i,
  /\bsequência de dependências?\b/i,
  /\bo que vem primeiro\b/i,
  /\bo que precisa (estar pronto|ser feito|ser resolvido) antes\b/i,
  /\briscos? de inverter (a ordem|a sequência)\b/i,

  // EN — dependencies
  /\bwhat depends on what\b/i,
  /\bexecution dependenc(y|ies)\b/i,
  /\bdependenc(y|ies)\b.{0,30}\bexecution\b/i,
  /\bwhat (comes|needs to come) (first|before)\b/i,

  // EN — prerequisites
  /\bprerequisites?\b/i,

  // EN — blockers
  /\bblockers?\b/i,
  /\bwhat('s| is) blocking\b/i,
  /\bwhat (is|are) (blocked|blocking)\b/i,
  /\bwhat (blocks?|is blocking)\b/i,

  // EN — parallel
  /\bcan (this|it|these) run in parallel\b/i,
  /\bparallel (work|execution|tasks)\b/i,
  /\bcan (we|i) (run|do|work on) (this|these|them) in parallel\b/i,
  /\bwhat can (we|i) (run|do|work on) (simultaneously|in parallel|at the same time)\b/i,

  // EN — precedence / execution order
  /\bprecedence order\b/i,
  /\bexecution order\b/i,
  /\bdependency order\b/i,
  /\bsequence of dependencies\b/i,
  /\bwhat needs to be (ready|done|resolved) first\b/i,
  /\brisk(s)? of (reversing|changing) (the order|the sequence)\b/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não follow-up de dependências).
 * Se a mensagem bater num desses, não é follow-up de dependências de execução.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são perguntas de dependências de execução.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta sobre dependências de execução, bloqueios,
 * pré-requisitos, ordem de precedência ou paralelismo.
 *
 * Retorna `true` para perguntas como:
 *   - "o que depende do quê?"
 *   - "depende do que?"
 *   - "quais são os pré-requisitos?"
 *   - "o que está bloqueando?"
 *   - "o que bloqueia o avanço?"
 *   - "pode rodar em paralelo?"
 *   - "o que pode ser feito em paralelo?"
 *   - "o que vem antes?"
 *   - "o que precisa vir primeiro?"
 *   - "ordem de execução"
 *   - "ordem de dependência"
 *   - "blockers"
 *   - EN: "what depends on what?", "what are the prerequisites?", "what's blocking?",
 *     "can this run in parallel?", "execution dependencies", "parallel work"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos")
 *   - perguntas analíticas puras sem pedido de dependência ("analise isso")
 *   - comparações puras ("compare isso com o README")
 *   - recomendações puras ("o que melhorar primeiro?")
 *   - plano puro sem pedido de dependência ("me dê um plano de ação")
 *   - checklist puro ("me dê um checklist")
 *   - critérios de aceite ("critérios de aceite", "definition of done")
 *   - prompts casuais
 *   - mensagens com código inline
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isExecutionDependenciesFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not a dependencies request
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not a follow-up
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Messages with inline code are not dependencies requests
  if (_hasInlineCode(trimmed)) return false;

  // Check execution dependencies patterns
  for (const pattern of EXECUTION_DEPENDENCIES_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para sugerir dependências de execução.
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
export function hasEnoughContextForExecutionDependencies(githubContext) {
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
 * Monta um prompt estruturado para análise de dependências de execução com base no contexto GitHub.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForExecutionDependencies` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildExecutionDependenciesPrompt(message, githubContext) {
  if (!hasEnoughContextForExecutionDependencies(githubContext)) return null;

  const parts = ['[Contexto GitHub para análise de dependências de execução]'];

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

  const isPartialContext = !githubContext.lastGitHubSummary && !githubContext.lastFileSnippet &&
    !githubContext.previousGitHubSummary && !githubContext.previousFileSnippet;

  parts.push('');
  parts.push(`Pergunta do usuário: ${message}`);
  parts.push('');
  parts.push(
    'Instruções: Com base APENAS no contexto GitHub acima, analise as dependências, bloqueios e pré-requisitos de execução. ' +
    'Não invente dados. Quando possível, indique:\n' +
    '- Dependências: o que precisa existir/estar pronto antes de cada item\n' +
    '- Bloqueios: o que está impedindo progresso agora\n' +
    '- Pré-requisitos: condições necessárias para iniciar\n' +
    '- Paralelismo: itens que podem ser trabalhados ao mesmo tempo\n' +
    '- Ordem recomendada: sequência sugerida de execução\n' +
    '- Risco de inversão: o que pode dar errado se a ordem for alterada\n' +
    'Responda em PT-BR. Seja objetivo, técnico e útil. ' +
    (isPartialContext ? 'ATENÇÃO: análise baseada em contexto parcial — deixe isso claro na resposta. ' : '') +
    'Se o contexto for insuficiente para análise confiável, diga isso claramente.',
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
 *   - Se não começa com `#`: adiciona header `## Dependências de execução sugeridas`
 *   - Aplica _addFooterIfNeeded
 *
 * @param {string} rawText - Resposta bruta do LLM
 * @param {object} [options] - Opções de formatação
 * @param {number} [options.maxLength] - Tamanho máximo do texto em caracteres
 * @returns {string}
 */
export function formatExecutionDependenciesResponse(rawText, options = {}) {
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
  text = `## Dependências de execução sugeridas\n\n${text}`;

  return _addFooterIfNeeded(text);
}

/**
 * Retorna mensagem amigável em português para quando não há contexto GitHub carregado.
 *
 * @returns {string}
 */
export function getInsufficientExecutionDependenciesContextMessage() {
  return "Ainda não tenho contexto GitHub suficiente para sugerir dependências e bloqueios de execução com confiança. Primeiro abra, analise, compare, peça recomendações, gere um checklist ou critérios de aceite sobre artefatos do repositório. Exemplo: 'mostre o package.json de owner/repo'.";
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
  const footerKeywords = ['baseada', 'baseado', 'based on', 'contexto carregado', 'context loaded', 'parcial', 'partial', 'dependências baseadas', 'dependencies based', 'análise baseada'];
  const hasFooter = footerKeywords.some(kw => text.toLowerCase().includes(kw));
  if (!hasFooter) {
    text += '\n\n---\n*Análise baseada no contexto GitHub carregado nesta conversa.*';
  }
  return text;
}

/**
 * Detecta se a mensagem contém código inline (função, bloco JS/TS, etc.).
 * Mensagens com código inline provavelmente não são perguntas de dependências de execução.
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
