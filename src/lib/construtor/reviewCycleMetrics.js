/**
 * F4-03 — Métricas mínimas e estruturadas do ciclo de revisão humana.
 *
 * Sem envio externo, sem persistência remota e sem conteúdo sensível.
 * Reutiliza eventos já presentes no reviewHistory (F3-03).
 */

const ALLOWED_FINAL_STATUSES = new Set(['approved', 'rejected', 'pending']);

const toSafeInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Constrói métricas mínimas estruturadas do ciclo de revisão humana.
 *
 * @param {object}  options
 * @param {Array}   options.reviewHistory    — array de eventos [{type, timestamp}] (F3-03)
 * @param {number|string|Date|null} options.cycleStartedAt — timestamp de início do ciclo (ms, ISO ou Date)
 * @param {number|null} options.now          — timestamp atual em ms (override para testes)
 * @returns {object} métricas estruturadas
 */
export function buildReviewCycleMetrics({
  reviewHistory = [],
  cycleStartedAt = null,
  now = null,
} = {}) {
  const nowMs = now != null ? Number(now) : Date.now();
  const safeHistory = Array.isArray(reviewHistory) ? reviewHistory : [];

  const revisionCount = toSafeInteger(
    safeHistory.filter((e) => e && e.type === 'adjustment_requested').length
  );

  const humanDecisionCount = toSafeInteger(
    safeHistory.filter((e) => e && (e.type === 'approved' || e.type === 'rejected')).length
  );

  const lastEvent = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : null;
  const rawFinalStatus = lastEvent?.type;
  const finalStatus = ALLOWED_FINAL_STATUSES.has(rawFinalStatus)
    ? rawFinalStatus
    : 'pending';

  const startedAtMs = cycleStartedAt != null ? new Date(cycleStartedAt).getTime() : null;
  const cycleElapsedMs =
    Number.isFinite(startedAtMs) && startedAtMs > 0 && nowMs >= startedAtMs
      ? Math.round(nowMs - startedAtMs)
      : null;

  return {
    timestamp: new Date(nowMs).toISOString(),
    cycleStartedAt: toIsoOrNull(cycleStartedAt),
    cycleElapsedMs,
    revisionCount,
    humanDecisionCount,
    finalStatus,
  };
}
