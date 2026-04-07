/**
 * Preview e Refinamento de Artefatos do Construtor/Híbrido — Fase 2D
 *
 * Responsabilidade: receber um artefato empacotado (Fase 2A) junto com os
 * resultados de validação (Fase 2B) e execução (Fase 2C) e produzir um
 * objeto de preview estruturado para inspeção humana, aprovação/rejeição
 * e registro de feedback mínimo de refinamento.
 *
 * Este módulo NÃO altera o Serginho Orchestrator, Especialistas, ABNT,
 * nem qualquer arquivo das Fases 2A, 2B ou 2C.
 */

import AdmZip from 'adm-zip';

/** Número máximo de caracteres exibidos no preview de conteúdo. */
const MAX_CONTENT_PREVIEW_LENGTH = 500;

const MIME_MAP = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.log': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
};

/**
 * Resolve o tipo MIME a partir do caminho do arquivo.
 * @param {string} filePath
 * @returns {string}
 */
function resolveMime(filePath) {
  const dot = filePath.lastIndexOf('.');
  const ext = dot !== -1 ? filePath.slice(dot).toLowerCase() : '';
  return MIME_MAP[ext] || 'application/octet-stream';
}

// ── Extração de arquivos e conteúdo do ZIP ────────────────────────────────────

/**
 * Extrai a lista de arquivos e o preview do conteúdo principal do zipBuffer.
 * Suporta tanto a estrutura nova (arquivos na raiz) quanto a legada (content/).
 *
 * @param {Buffer} zipBuffer
 * @param {string} [contentFilename] - nome do arquivo de conteúdo principal
 * @returns {{ files: Array<{path, size, type}>, contentPreview: string }}
 */
function extractZipInfo(zipBuffer, contentFilename = 'content.md') {
  let files = [];
  let contentPreview = '';

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      files.push({
        path: entry.entryName,
        size: entry.header.size,
        type: resolveMime(entry.entryName),
      });
    }

    // Extrair preview do conteúdo principal
    // Prioridade: nova estrutura (raiz) → estrutura legada (content/)
    const contentEntry =
      entries.find((e) => !e.isDirectory && e.entryName === contentFilename) ||
      entries.find((e) => !e.isDirectory && (e.entryName === 'index.html' || e.entryName === 'content.md')) ||
      entries.find(
        (e) =>
          !e.isDirectory &&
          e.entryName.startsWith('content/') &&
          e.entryName.endsWith(contentFilename),
      ) ||
      entries.find((e) => !e.isDirectory && e.entryName.startsWith('content/'));

    if (contentEntry) {
      const raw = contentEntry.getData().toString('utf-8');
      contentPreview = raw.slice(0, MAX_CONTENT_PREVIEW_LENGTH);
    }
  } catch {
    // ZIP ilegível — retornar listas vazias
  }

  return { files, contentPreview };
}

// ── Funções públicas ──────────────────────────────────────────────────────────

/**
 * Gera o objeto de preview estruturado a partir do artefato e dos resultados
 * das fases anteriores.
 *
 * @param {object} artifact - saída de packageArtifact() (Fase 2A)
 * @param {string} artifact.id
 * @param {object} artifact.manifest
 * @param {Buffer} artifact.zipBuffer
 * @param {object|null} [validationResult] - saída de validateArtifact() (Fase 2B)
 * @param {boolean} validationResult.valid
 * @param {string[]} validationResult.errors
 * @param {string[]} validationResult.warnings
 * @param {object|null} [executionResult] - saída de executeArtifact() (Fase 2C), ou null
 * @param {boolean} executionResult.executed
 * @param {boolean} executionResult.success
 * @param {boolean} executionResult.timedOut
 * @param {number} executionResult.durationMs
 *
 * @returns {{
 *   previewAvailable: boolean,
 *   summary: object,
 *   decision: string,
 *   feedback: string|null,
 *   decisionTimestamp: string|null
 * }}
 */
export function generatePreview(artifact, validationResult = null, executionResult = null) {
  if (!artifact || typeof artifact !== 'object') {
    return {
      previewAvailable: false,
      summary: null,
      decision: 'pending',
      feedback: null,
      decisionTimestamp: null,
    };
  }

  const { id, manifest, zipBuffer } = artifact;

  const { files, contentPreview } = zipBuffer
    ? extractZipInfo(zipBuffer, manifest?.files?.[0]?.path?.split('/').pop())
    : { files: [], contentPreview: '' };

  // Normalizar resultado de validação
  const validErrors = validationResult ? (validationResult.errors || []) : [];
  const validWarnings = validationResult ? (validationResult.warnings || []) : [];
  const validation = {
    valid: validationResult ? (validationResult.valid ?? true) : true,
    errorCount: validErrors.length,
    warningCount: validWarnings.length,
    errors: validErrors,
    warnings: validWarnings,
  };

  // Calcular status geral legível
  let status;
  if (!validation.valid) {
    status = {
      level: 'incomplete',
      label: '❌ Artefato incompleto',
      description: `${validation.errorCount} erro(s) detectado(s). Revise o artefato antes de aprovar.`,
    };
  } else if (validation.warningCount > 0) {
    status = {
      level: 'attention',
      label: '⚠️ Atenção: avisos detectados',
      description: `${validation.warningCount} aviso(s) de possível truncamento ou incompletude.`,
    };
  } else {
    status = {
      level: 'ok',
      label: '✅ Artefato completo',
      description: 'Nenhum erro ou aviso detectado.',
    };
  }

  // Normalizar resultado de execução
  let execution = null;
  if (executionResult) {
    execution = {
      executed: executionResult.executed ?? false,
      success: executionResult.success ?? false,
      timedOut: executionResult.timedOut ?? false,
      durationMs: executionResult.durationMs ?? 0,
    };
  }

  // Calcular resumo dos arquivos
  const fileNames = files.map((f) => f.path);
  const filesSummary = {
    totalFiles: files.length,
    fileNames,
    contentType: manifest?.contentType || null,
  };

  const summary = {
    id: id || null,
    version: manifest?.version || '1.0.0',
    timestamp: manifest?.timestamp || new Date().toISOString(),
    origin: manifest?.origin || { specialist: 'hybrid', model: 'unknown', promptId: 'unknown' },
    validation,
    status,
    filesSummary,
    execution,
    files,
    contentPreview,
  };

  return {
    previewAvailable: true,
    summary,
    decision: 'pending',
    feedback: null,
    decisionTimestamp: null,
  };
}

/**
 * Aplica uma decisão (approved/rejected) ao objeto de preview, registrando
 * o feedback opcional e o timestamp da decisão.
 *
 * @param {object} previewObj - objeto retornado por generatePreview()
 * @param {'approved'|'rejected'} decision
 * @param {string|null} [feedback] - comentário opcional (obrigatório para rejection)
 *
 * @returns {object} novo objeto de preview com decision, feedback e decisionTimestamp atualizados
 */
export function applyDecision(previewObj, decision, feedback = null) {
  if (!previewObj || typeof previewObj !== 'object') {
    throw new TypeError('applyDecision: previewObj must be a non-null object');
  }

  const allowedDecisions = ['approved', 'rejected'];
  if (!allowedDecisions.includes(decision)) {
    throw new TypeError(
      `applyDecision: decision must be one of ${allowedDecisions.join(', ')}; got "${decision}"`,
    );
  }

  return {
    ...previewObj,
    decision,
    feedback: feedback || null,
    decisionTimestamp: new Date().toISOString(),
  };
}
