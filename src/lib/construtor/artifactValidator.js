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

// Bytes mágicos do formato ZIP: PK\x03\x04
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/** UUID v4 canônico (case-insensitive). */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Checksum no formato "sha256:<64 hex chars>". */
const CHECKSUM_REGEX = /^sha256:[a-f0-9]{64}$/;

/** Timestamp ISO-8601 mínimo (data + hora). */
const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

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
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
