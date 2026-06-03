const DECISION_APPROVED = 'approved';
const DECISION_REJECTED = 'rejected';

const LIMITATIONS = [
  'Replay é observacional/read-only derivado do Artifact Ledger.',
  'Replay não restaura artefatos e não é time-travel funcional.',
  'Replay não altera runtime, decisão, geração, ZIP, preview, execução, prompts, providers/modelos, UI ou orquestração.',
];

function normalizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDecision(value) {
  const normalized = normalizeString(value)?.toLowerCase();
  if (normalized === DECISION_APPROVED || normalized === DECISION_REJECTED) return normalized;
  return null;
}

function normalizeEvents(events = []) {
  if (!Array.isArray(events)) return [];

  return [...events]
    .filter((event) => event && typeof event === 'object')
    .sort((a, b) => {
      const timeA = Date.parse(a.created_at || '') || 0;
      const timeB = Date.parse(b.created_at || '') || 0;
      if (timeA !== timeB) return timeA - timeB;

      const idA = `${a.ledger_id ?? ''}`;
      const idB = `${b.ledger_id ?? ''}`;
      return idA.localeCompare(idB);
    });
}

function deriveStatus(events) {
  if (!events.length) return 'no_events';

  let seenPreview = false;
  let hasKnownType = false;
  let hasDecisionWithoutPreview = false;
  let lastDecision = null;

  for (const event of events) {
    if (event.event_type === 'preview_generated') {
      seenPreview = true;
      hasKnownType = true;
      continue;
    }

    if (event.event_type === 'decision_applied') {
      hasKnownType = true;
      if (!seenPreview) hasDecisionWithoutPreview = true;
      const decision = normalizeDecision(event.decision);
      if (decision) lastDecision = decision;
    }
  }

  if (hasDecisionWithoutPreview) return 'incomplete_history';
  if (seenPreview && lastDecision === DECISION_APPROVED) return DECISION_APPROVED;
  if (seenPreview && lastDecision === DECISION_REJECTED) return DECISION_REJECTED;
  if (seenPreview && !lastDecision) return 'decision_pending';
  if (hasKnownType) return 'incomplete_history';
  return 'unknown';
}

function buildTimeline(events) {
  return events.map((event, index) => {
    const traceId = normalizeString(event.trace_id);
    const checksum = normalizeString(event.artifact_checksum);
    const feedback = normalizeString(event.feedback);

    return {
      step: index + 1,
      eventType: normalizeString(event.event_type),
      decision: normalizeDecision(event.decision),
      createdAt: event.created_at ?? null,
      traceId,
      checksum,
      originModel: normalizeString(event.origin_model),
      originPromptId: normalizeString(event.origin_prompt_id),
      previewStatus: normalizeString(event.preview_status),
      hasValidation: Boolean(event.preview_validation),
      hasFilesSummary: Boolean(event.preview_files_summary),
      hasFeedback: Boolean(feedback),
    };
  });
}

export function buildArtifactReplay(events = []) {
  const normalized = normalizeEvents(events);
  const timeline = buildTimeline(normalized);
  const traceIds = [...new Set(timeline.map((item) => item.traceId).filter(Boolean))];
  const checksums = timeline.map((item) => item.checksum).filter(Boolean);
  const status = deriveStatus(normalized);

  const warnings = [];
  if (!normalized.length) {
    warnings.push('Nenhum evento encontrado para o artifactId informado.');
  }
  if (status === 'incomplete_history') {
    warnings.push('Histórico incompleto: decisão encontrada sem preview anterior ou sem decisão válida derivável.');
  }

  return {
    status,
    eventCount: normalized.length,
    firstEventAt: normalized[0]?.created_at ?? null,
    lastEventAt: normalized[normalized.length - 1]?.created_at ?? null,
    hasTraceId: traceIds.length > 0,
    traceIds,
    hasChecksum: checksums.length > 0,
    checksum: checksums.length ? checksums[checksums.length - 1] : null,
    timeline,
    warnings,
    limitations: [...LIMITATIONS],
  };
}
