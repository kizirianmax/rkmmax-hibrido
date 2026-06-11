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

// ── Validação segura de nomes de arquivo ─────────────────────────────────────

/**
 * Valida se um nome de arquivo extraído de artefato multi-file é seguro para
 * empacotamento. Rejeita nomes que podem causar path traversal ou escrita fora
 * do diretório alvo. Permite subpastas relativas legítimas (ex.: src/App.jsx).
 *
 * Esta função é isomórfica (sem dependências Node-only) e pode ser chamada
 * tanto no backend quanto no frontend.
 *
 * @param {string} name - nome do arquivo a validar
 * @returns {{ valid: boolean, reason: string | null }}
 */
export function validateArtifactFileName(name) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { valid: false, reason: 'nome de arquivo vazio' };
  }

  // Rejeitar byte nulo
  if (name.includes('\0')) {
    return { valid: false, reason: 'nome de arquivo contém byte nulo' };
  }

  // Rejeitar caminho absoluto Unix (começa com /)
  if (name.startsWith('/')) {
    return { valid: false, reason: 'caminho absoluto Unix não permitido' };
  }

  // Rejeitar caminho UNC Windows (começa com \\ ou //) — verificar antes do check de \ simples
  if (name.startsWith('\\\\') || name.startsWith('//')) {
    return { valid: false, reason: 'caminho UNC não permitido' };
  }

  // Rejeitar caminho absoluto Windows com backslash simples (ex.: \tmp\evil.js)
  if (name.startsWith('\\')) {
    return { valid: false, reason: 'caminho absoluto Windows com backslash não permitido' };
  }

  // Rejeitar drive letter Windows (ex.: C:\ ou C:/)
  if (/^[a-zA-Z]:[/\\]/.test(name)) {
    return { valid: false, reason: 'drive letter Windows não permitido' };
  }

  // Normalizar separadores para verificação de segmentos
  const normalized = name.replace(/\\/g, '/');

  // Rejeitar segmentos de traversal (..)
  const segments = normalized.split('/');
  for (const seg of segments) {
    if (seg === '..') {
      return { valid: false, reason: 'segmento de traversal ".." não permitido' };
    }
  }

  return { valid: true, reason: null };
}

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
      const trimmed = content.trim();
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Tentar limpeza conservadora de trailing commas antes de desistir
      try {
        const sanitized = content.trim()
          .replace(/,\s*([\]}])/g, '$1');  // remove trailing commas
        const parsed = JSON.parse(sanitized);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
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

    // 1. Garante que `} catch`, `} else`, `} finally` tenham espaço se colados
    //    (deve rodar antes das heurísticas de quebra de linha para não conflitar)
    out = out.replace(/\}(?!\s)(catch|else|finally)/g, '} $1');

    // 2. Garante quebra de linha após `;` quando seguido diretamente por keyword de statement
    out = out.replace(
      /;(?=(const |let |var |function |class |return |if |else |while |do |for |switch |try |throw |import |export |new |console\.|process\.|module\.|require\())/g,
      ';\n',
    );

    // 3. Garante quebra após `}` seguido diretamente por keyword de declaração/bloco
    //    Exemplos: `}function`, `}const`, `}class`, `}if`, `}try`
    out = out.replace(
      /\}(?=(function |class |const |let |var |if |while |for |switch |try |return |throw |import |export |async ))/g,
      '}\n\n',
    );

    // 4. Garante quebra após `});` ou `})` seguido por keyword
    out = out.replace(
      /\}\);?\s*(?=(const |let |var |function |class |return |if |else |while |for |switch |try |throw |import |export |new |console\.|process\.|module\.|require\())/g,
      (match) => {
        const trimmed = match.trimEnd();
        return trimmed + '\n';
      },
    );

    // 5. Garante linha em branco entre blocos function/class/const colados
    //    (quando já em linhas separadas, mas sem linha em branco entre eles)
    out = out.replace(
      /\}\n(?=(function |async function |class |const \w+ = (?:function|\())|export (?:default )?(?:function|class|const))/g,
      '}\n\n',
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

  if (matches.length === 0) {
    const normalized = tryNormalizeAlternativeFormat(content);
    if (normalized) {
      return parseMultiFileContent(normalized);
    }
    return null;
  }

  const trimmedStart = content.trimStart();
  const startsWithExplicitDelimiter = /^---\s*FILE:\s*.+?\s*---/.test(trimmedStart);

  // Hardening: promoção de arquivo único só é permitida quando o bloco explícito
  // aparece no início efetivo do conteúdo (ignora apenas whitespace inicial).
  if (matches.length === 1 && !startsWithExplicitDelimiter) {
    return null;
  }

  const files = [];
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();

    // Barreira 1: rejeitar nomes inseguros antes de qualquer processamento
    const nameCheck = validateArtifactFileName(name);
    if (!nameCheck.valid) {
      throw new Error(`artifactNormalizer: nome de arquivo inválido "${name}" — ${nameCheck.reason}`);
    }

    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    let fileContent = content.slice(start, end).trim();
    fileContent = stripMarkdownFences(fileContent, name);

    if (!fileContent) return null;

    fileContent = prettyFormatByExtension(name, fileContent);
    files.push({ name, content: fileContent, type: resolveMime(name) });
  }

  return files.length > 0 ? files : null;
}

/**
 * Parseia conteúdo para exibição no chat, aceitando 1 ou mais blocos --- FILE: ---.
 *
 * Ao contrário de parseMultiFileContent (que exige MIN_MULTI_FILE_COUNT = 2 para ZIP),
 * esta função é usada exclusivamente para normalização visível e aceita arquivo único.
 * Arquivos com conteúdo vazio após strip são ignorados (não abortam o parse).
 *
 * @param {string} content
 * @returns {Array<{name: string, content: string}> | null}
 */
function parseDisplayFiles(content) {
  const FILE_DELIMITER = /^---\s*FILE:\s*(.+?)\s*---\s*$/gm;
  const matches = [...content.matchAll(FILE_DELIMITER)];

  if (matches.length === 0) {
    // Tentar formato alternativo (### headers) — requer >= 2 para essa heurística
    const normalized = tryNormalizeAlternativeFormat(content);
    if (normalized) return parseDisplayFiles(normalized);
    return null;
  }

  const files = [];
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    let fileContent = content.slice(start, end).trim();
    fileContent = stripMarkdownFences(fileContent, name);
    if (!fileContent) continue; // pula arquivo vazio — não aborta para fins de exibição
    fileContent = prettyFormatByExtension(name, fileContent);
    files.push({ name, content: fileContent });
  }

  return files.length > 0 ? files : null;
}

/**
 * Normaliza o conteúdo visível de uma resposta do Construtor para exibição no chat.
 *
 * Se o conteúdo contiver delimitadores --- FILE: --- (1 ou mais), aplica:
 * - remoção de fences markdown residuais por arquivo
 * - formatação leve por extensão (pretty-print JSON, quebras em .js/.md)
 * mantendo os delimitadores --- FILE: --- visíveis.
 *
 * Se não houver nenhum delimitador, retorna o conteúdo sem alteração.
 *
 * Usa parseDisplayFiles (aceita >= 1 arquivo) em vez de parseMultiFileContent
 * (que exige >= 2 para fins de ZIP). O pipeline de ZIP não é afetado.
 *
 * @param {string} content - resposta bruta do LLM
 * @returns {string} - conteúdo normalizado para exibição
 */
export function normalizeVisibleContent(content) {
  if (!content || typeof content !== 'string') return content;
  const files = parseDisplayFiles(content);
  if (!files) return content;
  return files.map((f) => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n');
}
