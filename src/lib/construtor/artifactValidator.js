/**
 * Validador de artefatos do Construtor/Híbrido — Fase 2B
 *
 * Responsabilidade: validar o artefato retornado por packageArtifact(),
 * retornando um resultado estruturado com separação clara entre erros
 * críticos e avisos não críticos.
 *
 * Retorno: { valid: boolean, errors: string[], warnings: string[] }
 *
 * - errors:   lista de erros críticos; se não vazia, valid = false
 * - warnings: avisos não críticos; o artefato ainda é considerado válido
 *
 * Este módulo NÃO altera o fluxo do Serginho Orchestrator nem do /api/ai.
 * Opera exclusivamente sobre o objeto retornado por packageArtifact() (Fase 2A).
 */

import AdmZip from 'adm-zip';

// Bytes mágicos do formato ZIP: PK\x03\x04
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/** UUID v4 canônico (case-insensitive). */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Checksum no formato "sha256:<64 hex chars>". */
const CHECKSUM_REGEX = /^sha256:[a-f0-9]{64}$/;

/** Timestamp ISO-8601 mínimo (data + hora). */
const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/** Extensões de arquivo JavaScript/TypeScript. */
const JS_EXTS = new Set(['.js', '.ts', '.mjs', '.cjs', '.tsx', '.jsx']);

/**
 * Conta ocorrências de um caractere em uma string, respeitando escapes simples.
 * Usado internamente por validateFileContent.
 * @param {string} str
 * @param {string} ch - caractere único a contar
 * @returns {number}
 */
function countChar(str, ch) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') { i++; continue; }
    if (str[i] === ch) count++;
  }
  return count;
}

/**
 * Valida o conteúdo de um arquivo individual quanto a sinais de truncamento
 * ou incompletude semântica.
 *
 * @param {string} filename - nome do arquivo (com extensão)
 * @param {string} content  - conteúdo textual do arquivo
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateFileContent(filename, content) {
  const errors = [];
  const warnings = [];

  // ── conteúdo vazio ou muito curto ─────────────────────────────────────────
  if (!content || content.trim() === '') {
    warnings.push(`${filename}: conteúdo vazio ou apenas whitespace`);
    return { errors, warnings };
  }

  if (content.trim().length < 10) {
    warnings.push(`${filename}: conteúdo suspeitamente curto (${content.trim().length} chars)`);
  }

  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : '';

  // ── .json ─────────────────────────────────────────────────────────────────
  if (ext === '.json') {
    try {
      JSON.parse(content);
    } catch {
      errors.push(`${filename}: JSON inválido ou truncado`);
    }
    return { errors, warnings };
  }

  // ── .js / .ts / .mjs / .cjs / .tsx / .jsx ────────────────────────────────
  if (JS_EXTS.has(ext)) {
    const opens = countChar(content, '{');
    const closes = countChar(content, '}');
    if (opens > closes) {
      warnings.push(`${filename}: possível truncamento — ${opens - closes} chave(s) "{" não fechada(s)`);
    }

    const arrOpens = countChar(content, '[');
    const arrCloses = countChar(content, ']');
    if (arrOpens > arrCloses) {
      warnings.push(`${filename}: possível truncamento — ${arrOpens - arrCloses} colchete(s) "[" não fechado(s)`);
    }

    const parenOpens = countChar(content, '(');
    const parenCloses = countChar(content, ')');
    if (parenOpens > parenCloses) {
      warnings.push(`${filename}: possível truncamento — ${parenOpens - parenCloses} parêntese(s) "(" não fechado(s)`);
    }

    const lastLine = content.trimEnd().split('\n').pop() ?? '';
    const trimmedLast = lastLine.trim();

    // string aberta na última linha (aspas simples ou duplas ímpares)
    const singleQuotes = (lastLine.match(/(?<!\\)'/g) || []).length;
    const doubleQuotes = (lastLine.match(/(?<!\\)"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      warnings.push(`${filename}: possível truncamento — última linha com string não fechada`);
    }

    // padrão de corte abrupto
    if (/[{,]$/.test(trimmedLast) || /=>$/.test(trimmedLast)) {
      warnings.push(`${filename}: possível truncamento — última linha termina em "${trimmedLast.slice(-2)}" (padrão de corte abrupto)`);
    }

    return { errors, warnings };
  }

  // ── .html ─────────────────────────────────────────────────────────────────
  if (ext === '.html' || ext === '.htm') {
    if (/<html[\s>]/i.test(content) && !/<\/html>/i.test(content)) {
      warnings.push(`${filename}: possível truncamento — <html> encontrado mas </html> ausente`);
    }
    if (/<body[\s>]/i.test(content) && !/<\/body>/i.test(content)) {
      warnings.push(`${filename}: possível truncamento — <body> encontrado mas </body> ausente`);
    }
    if (/<head[\s>]/i.test(content) && !/<\/head>/i.test(content)) {
      warnings.push(`${filename}: possível truncamento — <head> encontrado mas </head> ausente`);
    }
    return { errors, warnings };
  }

  // ── .md ───────────────────────────────────────────────────────────────────
  if (ext === '.md' || ext === '.markdown') {
    const trimmed = content.trimEnd();
    const lastLine = trimmed.split('\n').pop() ?? '';
    const trimmedLast = lastLine.trim();

    // heading vazio (# ou ## etc sem texto depois)
    if (/^#{1,6}\s*$/.test(trimmedLast)) {
      warnings.push(`${filename}: possível truncamento — termina com heading Markdown vazio ("${trimmedLast}")`);
    }

    // item de lista sem conteúdo
    if (/^(-|\d+\.)\s*$/.test(trimmedLast)) {
      warnings.push(`${filename}: possível truncamento — termina com item de lista Markdown vazio ("${trimmedLast}")`);
    }

    // bloco de código aberto (``` sem fechamento par)
    const fenceCount = (content.match(/^```/gm) || []).length;
    if (fenceCount % 2 !== 0) {
      warnings.push(`${filename}: possível truncamento — bloco de código Markdown (\`\`\`) sem fechamento`);
    }

    return { errors, warnings };
  }

  return { errors, warnings };
}

/**
 * Valida um array de arquivos parseados (saída de parseMultiFileContent),
 * executando validateFileContent em cada um e adicionando verificação especial
 * para o último arquivo (heurística de corte abrupto).
 *
 * @param {Array<{name: string, content: string}>} files
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateMultiFileCompleteness(files) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(files) || files.length === 0) {
    return { errors, warnings };
  }

  for (const file of files) {
    const result = validateFileContent(file.name, file.content ?? '');
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // heurística adicional: últimos 50 chars do último arquivo indicam corte
  const lastFile = files[files.length - 1];
  const lastContent = (lastFile.content ?? '').trimEnd();
  const tail = lastContent.slice(-50);
  if (tail && /[{,(\[=>\\]$/.test(tail.trim())) {
    warnings.push(
      `${lastFile.name}: possível truncamento no último arquivo — termina em padrão de corte abrupto`,
    );
  }

  return { errors, warnings };
}

/**
 * Valida o artefato retornado por packageArtifact().
 *
 * @param {object} artifact - objeto retornado por packageArtifact()
 * @param {string} artifact.id - UUID v4 do artefato
 * @param {object} artifact.manifest - manifest.json gerado pela Fase 2A
 * @param {Buffer} artifact.zipBuffer - buffer ZIP do artefato
 * @param {string} artifact.zipBase64 - conteúdo ZIP em Base64
 *
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateArtifact(artifact) {
  const errors = [];
  const warnings = [];

  if (!artifact || typeof artifact !== 'object') {
    errors.push('artifact must be a non-null object');
    return { valid: false, errors, warnings };
  }

  const { id, manifest, zipBuffer, zipBase64 } = artifact;

  // ── id ────────────────────────────────────────────────────────────────────
  if (!id || typeof id !== 'string') {
    errors.push('artifact.id is required and must be a string');
  } else if (!UUID_V4_REGEX.test(id)) {
    errors.push(`artifact.id "${id}" is not a valid UUID v4`);
  }

  // ── zipBuffer ─────────────────────────────────────────────────────────────
  if (!zipBuffer) {
    errors.push('artifact.zipBuffer is required');
  } else if (!Buffer.isBuffer(zipBuffer)) {
    errors.push('artifact.zipBuffer must be a Buffer');
  } else if (zipBuffer.length === 0) {
    errors.push('artifact.zipBuffer must not be empty');
  } else if (zipBuffer.length < 4 || !zipBuffer.subarray(0, 4).equals(ZIP_MAGIC)) {
    errors.push('artifact.zipBuffer does not start with ZIP magic bytes (PK\\x03\\x04)');
  }

  // ── zipBase64 ─────────────────────────────────────────────────────────────
  if (!zipBase64 || typeof zipBase64 !== 'string') {
    errors.push('artifact.zipBase64 is required and must be a string');
  }

  // ── manifest ──────────────────────────────────────────────────────────────
  if (!manifest || typeof manifest !== 'object') {
    errors.push('artifact.manifest is required and must be an object');
  } else {
    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('manifest.id is required');
    } else if (id && manifest.id !== id) {
      errors.push(`manifest.id "${manifest.id}" does not match artifact.id "${id}"`);
    }

    if (!manifest.version) {
      errors.push('manifest.version is required');
    }

    if (!manifest.timestamp) {
      errors.push('manifest.timestamp is required');
    } else if (!ISO8601_REGEX.test(manifest.timestamp)) {
      errors.push(`manifest.timestamp "${manifest.timestamp}" is not a valid ISO-8601 timestamp`);
    }

    if (!manifest.origin || typeof manifest.origin !== 'object') {
      errors.push('manifest.origin is required and must be an object');
    } else {
      if (!manifest.origin.specialist) {
        errors.push('manifest.origin.specialist is required');
      }

      if (!manifest.origin.model) {
        errors.push('manifest.origin.model is required');
      } else if (manifest.origin.model === 'unknown') {
        warnings.push('manifest.origin.model is "unknown" — no model info available');
      }

      if (!manifest.origin.promptId) {
        errors.push('manifest.origin.promptId is required');
      }
    }

    if (!manifest.checksum) {
      errors.push('manifest.checksum is required');
    } else if (!CHECKSUM_REGEX.test(manifest.checksum)) {
      errors.push(`manifest.checksum "${manifest.checksum}" is not in the expected format sha256:<hex>`);
    }

    // ── validação de conteúdo dos arquivos (PASSO 2) ────────────────────────
    if (manifest.contentType === 'multi-file' && Array.isArray(manifest.contents) && Buffer.isBuffer(zipBuffer)) {
      try {
        const zip = new AdmZip(zipBuffer);
        const contentFiles = manifest.contents
          .filter((c) => c.path && c.path !== 'manifest.json' && !c.path.startsWith('logs/'))
          .map((c) => {
            const entry = zip.getEntry(c.path);
            if (!entry) return null;
            try {
              return { name: c.path, content: entry.getData().toString('utf-8') };
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        if (contentFiles.length > 0) {
          const contentResult = validateMultiFileCompleteness(contentFiles);
          errors.push(...contentResult.errors);
          warnings.push(...contentResult.warnings);
        }
      } catch {
        // leitura do ZIP falhou — pular silenciosamente (não quebrar validação existente)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
