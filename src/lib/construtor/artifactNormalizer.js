/**
 * Normalizador de artefatos do Construtor/Híbrido — funções puras de string.
 *
 * Responsabilidade: prover as funções de normalização de formato multi-file
 * que são seguras para uso tanto no backend (Node.js) quanto no frontend (browser).
 * Sem dependências de Node.js ou módulos de empacotamento.
 *
 * Exportado para uso por:
 *   - artifactPackager.js (empacotamento ZIP)
 *   - HybridAgentSimple.jsx (normalização do output visível no chat)
 */

// ── Resolução de MIME por extensão ───────────────────────────────────────────

const MIME_MAP = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

function resolveMime(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

// ── Constante compartilhada ───────────────────────────────────────────────────

const MIN_MULTI_FILE_COUNT = 2;

// ── Formatação leve por extensão ─────────────────────────────────────────────

/**
 * Aplica normalização leve de legibilidade ao conteúdo de um arquivo,
 * de acordo com a sua extensão.
 *
 * - `.json`: pretty-print com 2 espaços se o JSON for válido; caso contrário sem alteração.
 * - `.md`: garante quebras de linha antes de listas numeradas e headings colados.
 * - `.js` / `.ts` / `.mjs`: garante quebra após `;` quando seguido imediatamente por outro
 *   statement, e linha em branco entre blocos de função colados.
 * - Qualquer outra extensão: retorna sem alteração.
 *
 * @param {string} filename - nome do arquivo (usado para determinar a extensão)
 * @param {string} content  - conteúdo já parseado (após stripMarkdownFences)
 * @returns {string}
 */
export function prettyFormatByExtension(filename, content) {
  if (!content || typeof content !== 'string') return content;

  const dotIndex = filename.lastIndexOf('.');
  const ext = dotIndex === -1 ? '' : filename.slice(dotIndex).toLowerCase();

  if (ext === '.json') {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  if (ext === '.md') {
    let out = content;
    // Garante linha em branco antes de heading colado ao parágrafo anterior
    out = out.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
    // Garante quebra de linha antes de item de lista numerada colado ao texto anterior
    out = out.replace(/([^\n])\n(\d+\. )/g, '$1\n\n$2');
    return out;
  }

  if (ext === '.js' || ext === '.ts' || ext === '.mjs') {
    let out = content;
    // Garante quebra de linha após `;` quando seguido diretamente por um início de statement
    // (heurística conservadora: apenas palavras-chave e identificadores comuns)
    out = out.replace(
      /;(?=(const |let |var |function |class |return |if |else |while |do |try |throw |import |export |new |console\.|process\.|module\.|require\())/g,
      ';\n',
    );
    // Garante linha em branco entre blocos function/class/const colados
    out = out.replace(
      /([^\n])\n((?:function |class |const \w+ = ))/g,
      '$1\n\n$2',
    );
    return out;
  }

  return content;
}

// ── Funções de normalização ───────────────────────────────────────────────────

/**
 * Remove fences markdown residuais (```language ... ```) do conteúdo de um arquivo.
 * Para arquivos .md: remove apenas fence envolvente (início + fim) — preserva fences
 * internas que podem ser intencionais em documentação.
 * Para arquivos de código: remove TODOS os fences (abertura e fechamento).
 * Garante contrato de código bruto sem marcação markdown.
 * @param {string} content
 * @param {string} [filename] - nome do arquivo para decisão contextual
 * @returns {string}
 */
export function stripMarkdownFences(content, filename) {
  const isMd = filename && /\.md$/i.test(filename);

  if (isMd) {
    // Para .md: remover apenas fence envolvente (wrapper) se presente
    let cleaned = content.replace(/^```[a-zA-Z0-9_+#-]*\s*\n?/, '');
    cleaned = cleaned.replace(/\n?```\s*$/, '');
    return cleaned.trim();
  }

  // Para código: remover TODOS os fences — opening e closing
  let cleaned = content.replace(/^```[a-zA-Z0-9_+#-]*\s*$/gm, '');
  return cleaned.trim();
}

/**
 * Detecta formato alternativo onde a LLM usou headers markdown (#### ou ### nome.ext)
 * com fences em vez de delimitadores --- FILE: ---. Converte para formato canônico.
 * Retorna o conteúdo normalizado ou null se não detectou o padrão alternativo.
 * @param {string} content
 * @returns {string | null}
 */
export function tryNormalizeAlternativeFormat(content) {
  // Match ### and #### headers only (h3/h4) — these are the levels the LLM uses for filenames
  const ALT_PATTERN = /^#{3,4}\s+(\S+\.\w+)\s*$/gm;
  const matches = [...content.matchAll(ALT_PATTERN)];

  if (matches.length < MIN_MULTI_FILE_COUNT) return null;

  // Extension length capped at 10 chars to reject section headers disguised as filenames
  const fileExtRegex = /\.\w{1,10}$/;
  const validFiles = matches.filter((m) => fileExtRegex.test(m[1].trim()));
  if (validFiles.length < MIN_MULTI_FILE_COUNT) return null;

  let normalized = content;
  for (const m of validFiles) {
    const filename = m[1].trim();
    normalized = normalized.replace(m[0], `--- FILE: ${filename} ---`);
  }

  return normalized;
}

/**
 * Tenta parsear conteúdo no formato multiarquivo com delimitadores --- FILE: <path> ---.
 * Retorna array de { name, content, type } ou null se não for multiarquivo.
 * @param {string} content
 * @returns {Array<{name: string, content: string, type: string}> | null}
 */
export function parseMultiFileContent(content) {
  const FILE_DELIMITER = /^---\s*FILE:\s*(.+?)\s*---\s*$/gm;
  const matches = [...content.matchAll(FILE_DELIMITER)];

  if (matches.length < MIN_MULTI_FILE_COUNT) {
    const normalized = tryNormalizeAlternativeFormat(content);
    if (normalized) {
      return parseMultiFileContent(normalized);
    }
    return null;
  }

  const files = [];
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    let fileContent = content.slice(start, end).trim();
    fileContent = stripMarkdownFences(fileContent, name);

    if (!fileContent) return null;

    fileContent = prettyFormatByExtension(name, fileContent);
    files.push({ name, content: fileContent, type: resolveMime(name) });
  }

  return files.length >= MIN_MULTI_FILE_COUNT ? files : null;
}

/**
 * Normaliza o conteúdo visível de uma resposta do Construtor para exibição no chat.
 *
 * Se o conteúdo for multi-file (contém delimitadores --- FILE: ---), remove fences
 * residuais dos blocos de cada arquivo, mantendo os delimitadores --- FILE: --- visíveis.
 * Se não for multi-file, retorna o conteúdo sem alteração.
 *
 * Esta função é o ponto de sincronização entre o que o pipeline de artefatos entende
 * internamente e o que o usuário vê no chat.
 *
 * @param {string} content - resposta bruta do LLM
 * @returns {string} - conteúdo normalizado para exibição
 */
export function normalizeVisibleContent(content) {
  if (!content || typeof content !== 'string') return content;
  const files = parseMultiFileContent(content);
  if (!files) return content;
  return files.map((f) => `--- FILE: ${f.name} ---\n${prettyFormatByExtension(f.name, f.content)}`).join('\n\n');
}
