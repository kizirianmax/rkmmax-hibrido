const DECISION_APPROVED = 'approved';
const DECISION_REJECTED = 'rejected';

const DEFAULT_LIMITATIONS = [
  'Veredito observacional derivado apenas de eventos já registrados no Artifact Ledger.',
  'Não revalida o conteúdo atual do artefato e não constitui prova criptográfica completa.',
  'Não altera runtime, decisão, geração, ZIP, prompts, provider ou modelo.',
];

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

function extractLastNonEmpty(events, field) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const value = events[i]?.[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value !== 'string') return value;
  }
  return null;
}

function determineStatus(events) {
  if (!events.length) return 'no_events';

  let seenPreview = false;
  let previewBeforeDecision = false;
  let lastDecision = null;

  for (const event of events) {
    if (event.event_type === 'preview_generated') {
      seenPreview = true;
    }

    if (event.event_type === 'decision_applied') {
      const decision = typeof event.decision === 'string' ? event.decision.trim().toLowerCase() : '';
      if (decision === DECISION_APPROVED || decision === DECISION_REJECTED) {
        lastDecision = decision;
      }
      if (seenPreview) {
        previewBeforeDecision = true;
      }
    }
  }

  if (lastDecision && !previewBeforeDecision) {
    return 'incomplete_history';
  }

  if (lastDecision === DECISION_APPROVED) return DECISION_APPROVED;
  if (lastDecision === DECISION_REJECTED) return DECISION_REJECTED;

  if (seenPreview) {
    return 'decision_pending';
  }

  const hasKnownType = events.some((event) => event.event_type === 'preview_generated' || event.event_type === 'decision_applied');
  return hasKnownType ? 'incomplete_history' : 'unknown';
}

function determineConfidence({ status, hasChecksum, eventCount }) {
  if (status === 'approved' || status === 'rejected') {
    return hasChecksum && eventCount >= 2 ? 'high' : 'medium';
  }

  if (status === 'decision_pending') {
    return hasChecksum ? 'medium' : 'low';
  }

  if (status === 'incomplete_history') return 'low';
  if (status === 'no_events') return 'low';
  return 'low';
}

export function buildArtifactProvenance(events = []) {
  const normalized = normalizeEvents(events);
  const status = determineStatus(normalized);

  const firstEventAt = normalized[0]?.created_at ?? null;
  const lastEventAt = normalized[normalized.length - 1]?.created_at ?? null;

  const hasPreview = normalized.some((event) => event.event_type === 'preview_generated');
  const lastDecision = extractLastNonEmpty(normalized, 'decision');
  const checksum = extractLastNonEmpty(normalized, 'artifact_checksum');
  const traceId = extractLastNonEmpty(normalized, 'trace_id');
  const validation = extractLastNonEmpty(normalized, 'preview_validation');

  const warnings = [];
  if (!normalized.length) {
    warnings.push('Nenhum evento encontrado para o artifactId informado.');
  }
  if (status === 'incomplete_history') {
    warnings.push('Histórico incompleto: decisão encontrada sem evento de preview anterior.');
  }
  if (!checksum) {
    warnings.push('Nenhum checksum registrado no ledger para este histórico.');
  }

  return {
    status,
    confidence: determineConfidence({ status, hasChecksum: Boolean(checksum), eventCount: normalized.length }),
    generated: hasPreview,
    decision: typeof lastDecision === 'string' && lastDecision.trim() ? lastDecision.trim().toLowerCase() : null,
    hasChecksum: Boolean(checksum),
    hasTraceId: Boolean(traceId),
    traceId: traceId || null,
    eventCount: normalized.length,
    firstEventAt,
    lastEventAt,
    checksum: checksum || null,
    originModel: extractLastNonEmpty(normalized, 'origin_model'),
    originPromptId: extractLastNonEmpty(normalized, 'origin_prompt_id'),
    validation: validation && typeof validation === 'object' ? validation : null,
    warnings,
    limitations: [...DEFAULT_LIMITATIONS],
  };
}
