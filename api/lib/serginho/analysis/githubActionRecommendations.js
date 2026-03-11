/**
 * api/lib/serginho/analysis/githubActionRecommendations.js
 * Helper de recomendações acionáveis sobre contexto GitHub já carregado.
 *
 * Permite ao Serginho responder perguntas de priorização e próximos passos (PT-BR e EN)
 * sem re-fetch, usando apenas o contexto in-memory da conversa.
 *
 * Funções exportadas:
 *   - isActionRecommendationFollowUp(message)              → detecta pergunta de recomendação/priorização
 *   - hasEnoughContextForRecommendations(githubContext)     → verifica contexto suficiente
 *   - buildRecommendationPrompt(message, githubContext)     → monta prompt estruturado
 *   - formatRecommendationResponse(rawText, options)        → pós-processa resposta do LLM
 *   - getInsufficientRecommendationContextMessage()         → mensagem amigável de contexto vazio
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões de recomendação/priorização — PT-BR e EN
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para detectar perguntas de recomendação, priorização ou próximos passos.
 */
const ACTION_RECOMMENDATION_PATTERNS = [
  // PT-BR — o que fazer / próximos passos / prioridades
  /o que (eu|a gente|nos) (deveria|deve|devo|devemos|poderia|pode|posso|podemos) fazer (agora|primeiro|para melhorar)/i,
  /próximos? passos?/i,
  /qual (é |a )?(a )?prioridade/i,
  /o que melhorar primeiro/i,
  /o que (é|seria) mais urgente/i,
  /(maior|mais) impacto/i,
  /\brecomend(a|ação|ações|e|o|amos)\b/i,
  /plano (curto|rápido|de melhoria|de ação)/i,
  /quais (correções|melhorias|mudanças) (são |seriam )?(mais )?(urgentes?|prioritárias?|importantes?)/i,
  /por onde (eu )?(começo|começar|devo começar)/i,
  /o que (esse|este|o) (projeto|repositório|repo|código) precisa/i,
  /me (dê|dê um|dá|dá um|sugira) (um plano|uma lista|recomendações|sugestões|próximos passos)/i,
  /o que (está|esta) faltando (aqui|nesse|neste|no)/i,
  /o que deveria ser (melhorado|corrigido|adicionado|implementado) (primeiro|antes)/i,
  /\bpróximo (passo|item|objetivo)\b/i,

  // EN — what to do / next steps / priorities / recommendations
  /what should (i|we|the team) do (next|now|first)/i,
  /what are (the )?priorities/i,
  /what improvements? would have (the )?(biggest|most|highest) impact/i,
  /what('s| is) (most|the most) urgent/i,
  /\brecommendations?\b/i,
  /\baction items?\b/i,
  /short.?term (plan|roadmap|improvements?)/i,
  /what (does|do) (this|the) (project|repo|codebase) need/i,
  /where (do|should) (i|we) start/i,
  /what (needs?|should) (to )?(be )?(fixed|improved|added|implemented) first/i,
  /give me (a plan|recommendations?|priorities|next steps)/i,
  /what (is|are) (the )?(most critical|high priority|top priority)/i,
];

/**
 * Padrões que indicam NOVOS comandos GitHub (não recomendações de follow-up).
 * Se a mensagem bater num desses, não é follow-up de recomendação.
 */
const GITHUB_COMMAND_PATTERNS = [
  /\b(abra|abre|abrir|open)\b.{0,50}(package\.json|readme|\.js|\.ts|\.json|\.md|arquivo)/i,
  /\b(liste|lista|listar|list)\b.{0,40}(repo|branch)/i,
  /\b(mostre|mostra|mostrar|show)\b.{0,40}(branch|repo)/i,
  /\b(busque|busca|buscar|search|fetch)\b.{0,40}(repo|branch|arquivo|file)/i,
  /de\s+[\w-]+\/[\w-]+/i, // "de owner/repo" pattern — explicit new fetch
];

/**
 * Padrões casuais que não são recomendações.
 */
const CASUAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello|tudo bem|tudo bom|bom dia|boa tarde|boa noite)[!?.]?$/i,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem é uma pergunta de recomendação/priorização/próximos passos.
 *
 * Retorna `true` para perguntas como:
 *   - "o que eu deveria fazer agora?"
 *   - "quais são os próximos passos?"
 *   - "qual a prioridade?"
 *   - EN: "what should I do next?", "give me recommendations"
 *
 * Retorna `false` para:
 *   - novos comandos GitHub ("abra package.json de owner/repo", "liste repos de owner")
 *   - prompts casuais ("oi", "olá", "tudo bem")
 *   - perguntas analíticas puras ("o que você conclui?")
 *   - perguntas comparativas puras ("compare isso com o README")
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isActionRecommendationFollowUp(message) {
  if (!message || typeof message !== 'string') return false;

  const trimmed = message.trim();
  if (!trimmed) return false;

  // Casual greetings — not a recommendation request
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Explicit new GitHub commands — not a follow-up
  for (const pattern of GITHUB_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Messages with inline code are not recommendation requests
  if (_hasInlineCode(trimmed)) return false;

  // Check recommendation patterns
  for (const pattern of ACTION_RECOMMENDATION_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Verifica se o contexto GitHub tem dados suficientes para recomendações.
 *
 * Retorna `true` se pelo menos um dos campos abaixo for não-nulo/não-falsy:
 *   - `lastGitHubSummary`
 *   - `lastFileSnippet`
 *   - `lastGitHubResultType`
 *
 * @param {object|null|undefined} githubContext
 * @returns {boolean}
 */
export function hasEnoughContextForRecommendations(githubContext) {
  if (!githubContext) return false;

  return Boolean(
    githubContext.lastGitHubSummary ||
    githubContext.lastFileSnippet ||
    githubContext.lastGitHubResultType,
  );
}

/**
 * Monta um prompt estruturado para recomendações acionáveis com base no contexto GitHub.
 *
 * Retorna `null` se não houver contexto suficiente (`hasEnoughContextForRecommendations` = false).
 *
 * @param {string} message - Pergunta original do usuário
 * @param {object|null|undefined} githubContext - Contexto GitHub da conversa
 * @returns {string|null}
 */
export function buildRecommendationPrompt(message, githubContext) {
  if (!hasEnoughContextForRecommendations(githubContext)) return null;

  const parts = ['[Contexto GitHub para recomendações]'];

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

  parts.push('');
  parts.push(`Pergunta do usuário: ${message}`);
  parts.push('');
  parts.push(
    'Instruções: Com base APENAS no contexto GitHub acima, forneça recomendações práticas e acionáveis. ' +
    'Não invente dados. Quando possível, classifique as recomendações em Alta prioridade, Média prioridade e Baixa prioridade. ' +
    'Para cada recomendação, explique brevemente o motivo. Responda em PT-BR. ' +
    'Seja objetivo, útil e conciso. Se o contexto for parcial ou insuficiente para recomendar com precisão, diga isso claramente.',
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
 *   - Adiciona cabeçalho `## Recomendações` se o texto não começar com `#`
 *   - Adiciona rodapé se não houver rodapé similar
 *   - Se o texto já contiver `##` ou `#`, não adiciona cabeçalho (já estruturado pelo LLM)
 *
 * @param {string} rawText - Resposta bruta do LLM
 * @param {object} [options] - Opções de formatação
 * @param {number} [options.maxLength] - Tamanho máximo do texto em caracteres
 * @returns {string}
 */
export function formatRecommendationResponse(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();
  if (!text) return '';

  // Sanitize: remove potential token leaks or stack traces
  text = text.replace(/\b(sk-[a-zA-Z0-9]{20,}|Bearer\s+\S+)\b/g, '[REDACTED]');

  // Truncate if maxLength provided
  if (options.maxLength && text.length > options.maxLength) {
    text = text.slice(0, options.maxLength).trimEnd() + '\n\n[resposta truncada]';
  }

  // Short text fallback
  if (text.length < 80) return text;

  // If text already has markdown headers, preserve structure
  if (text.startsWith('#')) return text;

  // Add header if not present
  text = `## Recomendações\n\n${text}`;

  // Add footer if not already present
  const footerKeywords = ['baseada', 'baseado', 'based on', 'contexto carregado', 'context loaded'];
  const hasFooter = footerKeywords.some(kw => text.toLowerCase().includes(kw));
  if (!hasFooter) {
    text += '\n\n---\n*Recomendações baseadas no contexto GitHub carregado nesta conversa.*';
  }

  return text;
}

/**
 * Retorna mensagem amigável em português para quando não há contexto GitHub carregado.
 *
 * @returns {string}
 */
export function getInsufficientRecommendationContextMessage() {
  return "Ainda não tenho contexto GitHub suficiente para recomendar próximos passos com segurança. Primeiro abra, analise ou compare artefatos do repositório. Exemplo: 'mostre o package.json de owner/repo'.";
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem contém código inline (função, bloco JS/TS, etc.).
 * Mensagens com código inline provavelmente não são perguntas de recomendação.
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
