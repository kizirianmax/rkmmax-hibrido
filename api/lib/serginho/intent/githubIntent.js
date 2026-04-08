/**
 * api/lib/serginho/intent/githubIntent.js
 * Detector leve de intenção GitHub por keyword/pattern matching.
 *
 * Regra do projeto: NADA executa fora do Serginho.
 * Este módulo detecta intenções simples relacionadas ao GitHub usando apenas
 * correspondência de palavras-chave e expressões regulares — SEM chamadas LLM.
 *
 * Função exportada:
 *   - detectGitHubIntent(message) → { tool, params, missing? } | null
 *
 * Intenções detectadas:
 *   - github_list_repos    — lista repositórios do usuário
 *   - github_list_branches — lista branches de um repositório
 *   - github_get_file      — lê conteúdo de um arquivo
 *
 * Se a intenção for ambígua ou não relacionada ao GitHub, retorna null
 * e o fluxo normal do Serginho continua sem alterações.
 */

// ---------------------------------------------------------------------------
// Padrões de detecção (case-insensitive, PT-BR e EN)
// ---------------------------------------------------------------------------

/** Padrões para: listar repositórios */
const LIST_REPOS_PATTERNS = [
  // PT: "liste/listar meus repositórios/repos"
  /list(?:e|ar)?\s+(?:meus?\s+)?reposit[oó]rios/i,
  // PT: "quais repositórios/repos eu tenho"
  /quais\s+reposit[oó]rios/i,
  /quais\s+repos?\s+(?:eu\s+)?tenho/i,
  // PT: "mostrar/mostre meus repos" — sem seguir de "de/do/em" (evita falso positivo para branches)
  /mostr(?:ar|e)\s+(?:meus?\s+)?(?:reposit[oó]rios|repos?)\s*$/i,
  // PT: "meus repositórios/repos"
  /meus?\s+reposit[oó]rios/i,
  /meus?\s+repos?\s*$/i,
  // PT: "liste/listar repos" — sem seguir de "de/do/em" (evita falso positivo para branches)
  /list(?:e|ar)?\s+(?:meus?\s+)?repos?\s*$/i,
  // EN: "list/show my repos/repositories"
  /list\s+(?:my\s+)?(?:repos?|repositories)\s*$/i,
  /show\s+(?:my\s+)?(?:repos?|repositories)\s*$/i,
];

/** Padrões para: listar branches */
const LIST_BRANCHES_PATTERNS = [
  // PT: "branches de/do repo ...", "branches existem em ..."
  /branches?\s+(?:de|do\s+(?:repo|reposit[oó]rio)|existem\s+em|em)\b/i,
  // PT: "liste/listar as branches"
  /list(?:e|ar)?\s+(?:as?\s+)?branches?/i,
  // PT: "quais branches existem"
  /quais\s+branches?\s+existem/i,
  // PT: "mostrar branches"
  /mostr(?:ar|e)\s+(?:as?\s+)?branches?/i,
  // EN: "list/show branches of/for/in/from"
  /list\s+branches?\s+(?:of|for|in|from)\b/i,
  /show\s+branches?\s+(?:for|of|in|from)\b/i,
  // EN: "branches of/for/in owner/repo" or just "branches of X"
  /branches?\s+(?:of|for|in|from)\b/i,
];

/** Padrões para: ler arquivo */
const GET_FILE_PATTERNS = [
  // PT: "mostre/abra/leia o arquivo"
  /(?:mostr(?:e|ar)|abr(?:a|ir)|l(?:eia|er))\s+(?:\w+\s+){0,2}arquivo/i,
  // EN: "show/read/open/get (the/a) file"
  /(?:show|read|open|get)\s+(?:the\s+|a\s+)?file/i,
  // PT: "leia/abra <filepath.ext>" — caminho de arquivo direto após ação
  /(?:leia|abra)\s+\S+\.[a-zA-Z]{1,10}/i,
  // EN: "read/show/open <filepath.ext>"
  /(?:read|show|open)\s+\S+\.[a-zA-Z]{1,10}/i,
];

// ---------------------------------------------------------------------------
// Função principal exportada
// ---------------------------------------------------------------------------

/**
 * Analisa uma mensagem do usuário e determina se é uma intenção relacionada ao GitHub.
 * Retorna null se nenhuma intenção GitHub for detectada (segue fluxo normal do Serginho).
 *
 * @param {string} message
 * @returns {{ tool: string, params: object, missing?: string[] } | null}
 */
export function detectGitHubIntent(message) {
  if (!message || typeof message !== 'string') return null;

  // Se a mensagem é um pedido de criação/geração de código sem referência explícita a owner/repo,
  // não é uma intenção GitHub — deve seguir para o fluxo normal de geração de artefatos do LLM.
  // (e.g. "Crie um script Node.js que leia um arquivo JSON local..." NÃO deve pedir owner/repo)
  if (
    /\b(crie|gere|cria|faça|desenvolva|implemente|escreva|construa|create|generate|build|make|write|implement)\b/i.test(message) &&
    !/[\w.-]+\/[\w.-]+/.test(message)
  ) {
    return null;
  }

  // Intenção: listar repositórios
  if (LIST_REPOS_PATTERNS.some((p) => p.test(message))) {
    return { tool: 'github_list_repos', params: {} };
  }

  // Intenção: listar branches
  if (LIST_BRANCHES_PATTERNS.some((p) => p.test(message))) {
    const { owner, repo, missing } = extractOwnerRepo(message);
    const params = {};
    if (owner) params.owner = owner;
    if (repo) params.repo = repo;
    const result = { tool: 'github_list_branches', params };
    if (missing.length > 0) result.missing = missing;
    return result;
  }

  // Intenção: ler arquivo
  if (GET_FILE_PATTERNS.some((p) => p.test(message))) {
    const { owner, repo, missing: ownerRepoMissing } = extractOwnerRepo(message);
    const { path, missing: pathMissing } = extractFilePath(message);
    const params = {};
    if (owner) params.owner = owner;
    if (repo) params.repo = repo;
    if (path) params.path = path;
    const missing = [...ownerRepoMissing, ...pathMissing];
    const result = { tool: 'github_get_file', params };
    if (missing.length > 0) result.missing = missing;
    return result;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Extração de parâmetros
// ---------------------------------------------------------------------------

/**
 * Extrai owner e repo de uma mensagem.
 * Suporta:
 *   - Formato "owner/repo" (ex: "kizirianmax/rkmmax-hibrido")
 *   - Apenas "repo" com contexto (ex: "do repo meu-projeto")
 *
 * @param {string} message
 * @returns {{ owner: string|null, repo: string|null, missing: string[] }}
 */
function extractOwnerRepo(message) {
  // Tenta "owner/repo" — exclui padrões que são caminhos de arquivo (terminam em .ext)
  // O segundo grupo usa apenas hifens e underscores (sem ponto) para que "src/App.jsx"
  // seja capturado como "src/App" (parando antes do "."), e então descartado pela verificação
  // abaixo. Isso significa que repos com ponto no nome (ex: "my.project") não serão extraídos
  // diretamente; nesses casos, o usuário pode usar o formato "owner/my.project" e o nome
  // será detectado via repoContextPattern.
  const ownerRepoRegex = /\b([a-zA-Z0-9][a-zA-Z0-9_.-]*)\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\b/g;
  let match;
  while ((match = ownerRepoRegex.exec(message)) !== null) {
    // Se o próximo caractere após o match for '.', é parte de um caminho de arquivo
    // (ex: "src/App" de "src/App.jsx"). undefined (fim de string) é distinto de '.' e não descarta.
    const nextChar = message[match.index + match[0].length];
    if (nextChar === '.') continue;
    return { owner: match[1], repo: match[2], missing: [] };
  }

  // Tenta extrair apenas repo de padrões contextuais ("do repo X", "in repo X", etc.)
  const repoContextPattern =
    /(?:do\s+repo|do\s+reposit[oó]rio|no\s+repo|in\s+repo|from\s+repo|of\s+repo|for\s+repo|em\s+repo)\s+([a-zA-Z0-9][a-zA-Z0-9_.-]*)/i;
  const repoMatch = message.match(repoContextPattern);
  if (repoMatch) {
    return { owner: null, repo: repoMatch[1], missing: ['owner'] };
  }

  return { owner: null, repo: null, missing: ['owner', 'repo'] };
}

/**
 * Extrai um caminho de arquivo de uma mensagem.
 * Procura por padrões como README.md, src/App.jsx, package.json.
 *
 * @param {string} message
 * @returns {{ path: string|null, missing: string[] }}
 */
function extractFilePath(message) {
  // Encontra padrões com extensão: algo.ext ou pasta/algo.ext
  // Usa regex global para encontrar o primeiro candidato válido
  const filePathRegex = /\b((?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.[a-zA-Z]{1,10})\b/g;
  let match;
  while ((match = filePathRegex.exec(message)) !== null) {
    const candidate = match[1];
    const segments = candidate.split('/');
    const lastSegment = segments[segments.length - 1];
    // Confirma que o último segmento tem extensão de arquivo
    if (/\.[a-zA-Z]{1,10}$/.test(lastSegment)) {
      // Verifica que não é o padrão owner/repo (o segundo grupo de owner/repo não tem extensão
      // no último segmento — mas aqui o último segmento TEM extensão, portanto é arquivo)
      return { path: candidate, missing: [] };
    }
  }

  return { path: null, missing: ['path'] };
}
