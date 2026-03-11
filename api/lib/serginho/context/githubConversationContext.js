/**
 * api/lib/serginho/context/githubConversationContext.js
 * Contexto de conversa GitHub temporário (por requisição, em memória).
 *
 * Regra do projeto: NADA executa fora do Serginho.
 * Este módulo provê um contexto leve e in-memory para que o Serginho possa
 * reutilizar dados já lidos do GitHub em perguntas de acompanhamento, sem
 * re-buscar informações.
 *
 * Funções exportadas:
 *   - createGitHubContext()                             → contexto vazio inicial
 *   - updateContextFromToolResult(ctx, tool, params, result) → atualiza após tool call
 *   - resolveParamsFromContext(ctx, detectedParams)     → preenche owner/repo faltantes
 *   - getContextSummary(ctx)                           → resumo truncado para injeção no LLM
 *   - clearGitHubContext(ctx)                          → limpa todos os campos
 *
 * Segurança:
 *   - NUNCA persiste em disco ou banco de dados
 *   - NUNCA vaza token, stacktrace ou headers
 *   - Conteúdo de arquivo truncado em MAX_SNIPPET_CHARS (2000)
 *   - Resumo truncado em MAX_SUMMARY_CHARS (500)
 *   - path de arquivo NÃO é auto-preenchido do contexto (evita reutilização incorreta)
 */

/** Limite de caracteres para snippet de arquivo armazenado no contexto. */
const MAX_SNIPPET_CHARS = 2000;

/** Limite de caracteres para o resumo (lastGitHubSummary). */
const MAX_SUMMARY_CHARS = 500;

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Cria um novo contexto GitHub vazio.
 * Deve ser criado por chamada (per-request) — nunca como singleton global.
 *
 * @returns {{
 *   lastOwner: string|null,
 *   lastRepo: string|null,
 *   lastBranch: string|null,
 *   lastFilePath: string|null,
 *   lastGitHubResultType: 'repos'|'branches'|'file'|null,
 *   lastGitHubSummary: string|null,
 *   lastFileSnippet: string|null,
 *   previousGitHubResultType: 'repos'|'branches'|'file'|null,
 *   previousGitHubSummary: string|null,
 *   previousFileSnippet: string|null,
 *   previousFilePath: string|null,
 * }}
 */
export function createGitHubContext() {
  return {
    lastOwner: null,
    lastRepo: null,
    /** Reservado para uso futuro: branch selecionada explicitamente pelo usuário. */
    lastBranch: null,
    lastFilePath: null,
    lastGitHubResultType: null,
    lastGitHubSummary: null,
    lastFileSnippet: null,
    // Campos para comparação (N8) — contexto anterior
    previousGitHubResultType: null,
    previousGitHubSummary: null,
    previousFileSnippet: null,
    previousFilePath: null,
  };
}

/**
 * Atualiza o contexto após a execução de uma tool GitHub.
 * Chamado APENAS quando a tool retornou sucesso.
 *
 * @param {object} context - Contexto criado por createGitHubContext()
 * @param {string} toolName - Nome da tool executada
 * @param {{ owner?: string, repo?: string, path?: string }} params - Parâmetros usados
 * @param {{ success: boolean, data?: object }} result - Resultado da tool
 */
export function updateContextFromToolResult(context, toolName, params, result) {
  if (!context || !result || !result.success) return;

  // Shift: mover estado atual para previous* antes de sobrescrever (N8 — comparação)
  context.previousGitHubResultType = context.lastGitHubResultType;
  context.previousGitHubSummary = context.lastGitHubSummary;
  context.previousFileSnippet = context.lastFileSnippet;
  context.previousFilePath = context.lastFilePath;

  if (toolName === 'github_list_repos') {
    context.lastGitHubResultType = 'repos';
    const repos = result.data?.repos ?? [];
    const names = repos
      .slice(0, 5)
      .map((r) => r.fullName || r.name)
      .filter(Boolean)
      .join(', ');
    const suffix = repos.length > 5 ? `… (+${repos.length - 5} mais)` : '';
    context.lastGitHubSummary = _truncate(
      repos.length > 0
        ? `Repositórios listados (${repos.length} total): ${names}${suffix}`
        : 'Nenhum repositório encontrado.',
      MAX_SUMMARY_CHARS,
    );
    return;
  }

  if (toolName === 'github_list_branches') {
    if (params?.owner) context.lastOwner = params.owner;
    if (params?.repo) context.lastRepo = params.repo;
    context.lastGitHubResultType = 'branches';
    const branches = result.data?.branches ?? [];
    const repoLabel =
      params?.owner && params?.repo
        ? `${params.owner}/${params.repo}`
        : params?.repo ?? 'repositório';
    const branchNames = branches
      .slice(0, 10)
      .map((b) => b.name)
      .filter(Boolean)
      .join(', ');
    const suffix = branches.length > 10 ? `… (+${branches.length - 10} mais)` : '';
    context.lastGitHubSummary = _truncate(
      `Branches de ${repoLabel} (${branches.length} total): ${branchNames}${suffix}`,
      MAX_SUMMARY_CHARS,
    );
    return;
  }

  if (toolName === 'github_get_file') {
    if (params?.owner) context.lastOwner = params.owner;
    if (params?.repo) context.lastRepo = params.repo;
    if (params?.path) context.lastFilePath = params.path;
    context.lastGitHubResultType = 'file';

    const file = result.data?.file ?? {};
    const rawContent = _decodeFileContent(file);

    context.lastFileSnippet = _truncate(rawContent, MAX_SNIPPET_CHARS);

    const repoLabel =
      params?.owner && params?.repo
        ? `${params.owner}/${params.repo}`
        : params?.repo ?? 'repositório';
    const preview = rawContent ? rawContent.slice(0, 150).replace(/\n/g, ' ') : '';
    context.lastGitHubSummary = _truncate(
      `Arquivo lido: ${params?.path ?? 'arquivo'} em ${repoLabel}.${preview ? ` Início: ${preview}` : ''}`,
      MAX_SUMMARY_CHARS,
    );
    return;
  }
}

/**
 * Resolve parâmetros faltantes usando o contexto de conversa.
 *
 * - Preenche owner e repo ausentes a partir de lastOwner/lastRepo.
 * - NÃO preenche path automaticamente (evita reutilização incorreta de caminhos).
 *
 * @param {object} context - Contexto de conversa
 * @param {{ owner?: string, repo?: string, path?: string }} detectedParams
 * @returns {{ owner?: string, repo?: string, path?: string }}
 */
export function resolveParamsFromContext(context, detectedParams) {
  if (!context) return { ...detectedParams };

  const resolved = { ...detectedParams };

  // Preenche owner apenas se ausente nos params detectados
  if (!resolved.owner && context.lastOwner) {
    resolved.owner = context.lastOwner;
  }

  // Preenche repo apenas se ausente nos params detectados
  if (!resolved.repo && context.lastRepo) {
    resolved.repo = context.lastRepo;
  }

  // path NÃO é preenchido automaticamente do contexto

  return resolved;
}

/**
 * Retorna um resumo seguro e truncado do contexto para injeção no prompt do LLM.
 * Retorna null se não houver contexto GitHub relevante.
 *
 * O resumo inclui o sumário da última operação e, se disponível, o snippet do
 * último arquivo lido. O total é truncado de forma segura.
 *
 * @param {object} context
 * @returns {string|null}
 */
export function getContextSummary(context) {
  if (!context || !context.lastGitHubResultType) return null;

  const parts = [];

  if (context.lastGitHubSummary) {
    parts.push(context.lastGitHubSummary);
  }

  if (context.lastFileSnippet) {
    parts.push(`Conteúdo do arquivo (trecho):\n${context.lastFileSnippet}`);
  }

  if (parts.length === 0) return null;

  const combined = parts.join('\n\n');
  // Trunca o total para MAX_SUMMARY_CHARS + MAX_SNIPPET_CHARS
  return _truncate(combined, MAX_SUMMARY_CHARS + MAX_SNIPPET_CHARS);
}

/**
 * Limpa todos os campos do contexto, restaurando ao estado inicial.
 *
 * @param {object} context
 */
export function clearGitHubContext(context) {
  if (!context) return;
  context.lastOwner = null;
  context.lastRepo = null;
  context.lastBranch = null;
  context.lastFilePath = null;
  context.lastGitHubResultType = null;
  context.lastGitHubSummary = null;
  context.lastFileSnippet = null;
  // Campos N8
  context.previousGitHubResultType = null;
  context.previousGitHubSummary = null;
  context.previousFileSnippet = null;
  context.previousFilePath = null;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Trunca string de forma segura.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function _truncate(str, max) {
  if (!str || typeof str !== 'string') return str;
  if (str.length <= max) return str;
  return str.slice(0, max);
}

/**
 * Decodifica conteúdo de arquivo de base64 ou retorna como está.
 * Nunca vaza erros para o chamador.
 *
 * @param {{ content?: string, encoding?: string }} file
 * @returns {string}
 */
function _decodeFileContent(file) {
  if (!file || !file.content) return '';

  if (file.encoding === 'base64') {
    try {
      return Buffer.from(file.content, 'base64').toString('utf-8');
    } catch {
      return '';
    }
  }

  if (typeof file.content === 'string') {
    return file.content;
  }

  return '';
}
