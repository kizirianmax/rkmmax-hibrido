/**
 * Métricas mínimas locais do pipeline de artefatos (Fase 4 — F4-02).
 *
 * Sem envio externo, sem persistência remota e sem conteúdo sensível.
 */

/**
 * Converte valor numérico para inteiro seguro não-negativo.
 * Retorna o fallback para NaN, infinito ou números negativos.
 */
const toSafeInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return fallback;
  return Math.round(parsed);
};

const toIsoTimestamp = (value = null) => {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const resolveExecutionStatus = (executionResult = null) => {
  if (!executionResult || typeof executionResult !== 'object') return 'not-provided';
  if (executionResult.executed === false && executionResult.reason === 'execution-disabled-by-security-policy') {
    return 'disabled-by-security-policy';
  }
  if (executionResult.executed === false) return 'not-executed';
  if (executionResult.success === true) return 'executed-success';
  return 'executed-failed';
};

/**
 * Cria métrica mínima e estruturada para fases do pipeline.
 */
export function buildArtifactPipelineMetrics({
  phase = 'unknown',
  startedAt = null,
  finishedAt = null,
  files = [],
  zipBuffer = null,
  validationResult = null,
  executionResult = null,
  timestamp = null,
} = {}) {
  const startMs = startedAt ? new Date(startedAt).getTime() : null;
  const endMs = finishedAt ? new Date(finishedAt).getTime() : null;
  const durationMs =
    Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
      ? Math.round(endMs - startMs)
      : null;

  const validErrors = Array.isArray(validationResult?.errors) ? validationResult.errors : [];
  const validWarnings = Array.isArray(validationResult?.warnings) ? validationResult.warnings : [];
  const validationStatus =
    typeof validationResult?.valid === 'boolean'
      ? (validationResult.valid ? 'valid' : 'invalid')
      : 'not-provided';

  const fileCount = Array.isArray(files) ? files.length : 0;
  const zipApproxBytes = Buffer.isBuffer(zipBuffer)
    ? zipBuffer.length
    : toSafeInteger(zipBuffer?.length, null);

  return {
    timestamp: toIsoTimestamp(timestamp),
    phase,
    durationMs,
    fileCount,
    zipApproxBytes,
    validationStatus,
    errorCount: toSafeInteger(validErrors.length),
    warningCount: toSafeInteger(validWarnings.length),
    executionStatus: resolveExecutionStatus(executionResult),
  };
}
