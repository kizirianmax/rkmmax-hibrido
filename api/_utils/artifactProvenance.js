const STATUS = {
  NO_EVENTS: 'no_events',
  PREVIEW_GENERATED: 'preview_generated',
  DECISION_PENDING: 'decision_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INCOMPLETE_HISTORY: 'incomplete_history',
  UNKNOWN: 'unknown',
};

function normalizeDecision(decision) {
  if (typeof decision !== 'string') return null;
  const value = decision.trim().toLowerCase();
  if (value === 'approved') return 'approved';
  if (value === 'rejected') return 'rejected';
  return null;
}

function toComparableDate(value) {
  if (typeof value !== 'string') return Number.NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function sortEvents(events = []) {
  return [...events].sort((a, b) => {
    const dateA = toComparableDate(a?.created_at);
    const dateB = toComparableDate(b?.created_at);
    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
      return dateA - dateB;
    }
    if (Number.isFinite(dateA) && !Number.isFinite(dateB)) return -1;
    if (!Number.isFinite(dateA) && Number.isFinite(dateB)) return 1;
    const idA = String(a?.ledger_id ?? '');
    const idB = String(b?.ledger_id ?? '');
    return idA.localeCompare(idB);
  });
}

export function buildArtifactProvenance(events = []) {
  const ordered = Array.isArray(events) ? sortEvents(events) : [];
  const eventCount = ordered.length;
  const firstEvent = ordered[0] ?? null;
  const lastEvent = ordered[eventCount - 1] ?? null;

  const previewEvents = ordered.filter((event) => event?.event_type === 'preview_generated');
  const decisionEvents = ordered.filter((event) => event?.event_type === 'decision_applied');
  const latestPreview = previewEvents[previewEvents.length - 1] ?? null;
  const latestDecision = decisionEvents[decisionEvents.length - 1] ?? null;

  const normalizedDecision = normalizeDecision(latestDecision?.decision);
  const hasPreview = previewEvents.length > 0;
  const hasDecision = Boolean(normalizedDecision);
  const decisionAt = toComparableDate(latestDecision?.created_at);
  const hasPreviewBeforeDecision = hasPreview && (!Number.isFinite(decisionAt) || previewEvents.some((event) => {
    const previewAt = toComparableDate(event?.created_at);
    return !Number.isFinite(previewAt) || previewAt <= decisionAt;
  }));

  const latestWithChecksum = [...ordered].reverse().find((event) => typeof event?.artifact_checksum === 'string' && event.artifact_checksum.trim());
  const latestWithTraceId = [...ordered].reverse().find((event) => typeof event?.trace_id === 'string' && event.trace_id.trim());
  const latestWithOriginModel = [...ordered].reverse().find((event) => typeof event?.origin_model === 'string' && event.origin_model.trim());
  const latestWithPromptId = [...ordered].reverse().find((event) => typeof event?.origin_prompt_id === 'string' && event.origin_prompt_id.trim());

  const warnings = [];
  if (decisionEvents.length > 0 && !hasDecision) {
    warnings.push('decision_event_without_supported_decision');
  }
  if (hasDecision && !hasPreviewBeforeDecision) {
    warnings.push('decision_without_previous_preview');
  }

  let status = STATUS.UNKNOWN;
  let confidence = 'low';

  if (eventCount === 0) {
    status = STATUS.NO_EVENTS;
  } else if (hasDecision && !hasPreviewBeforeDecision) {
    status = STATUS.INCOMPLETE_HISTORY;
  } else if (hasDecision && normalizedDecision === 'approved') {
    status = STATUS.APPROVED;
    confidence = 'high';
  } else if (hasDecision && normalizedDecision === 'rejected') {
    status = STATUS.REJECTED;
    confidence = 'high';
  } else if (hasPreview) {
    status = STATUS.DECISION_PENDING;
    confidence = 'medium';
  } else if (eventCount > 0) {
    status = STATUS.PREVIEW_GENERATED;
  }

  if (status === STATUS.INCOMPLETE_HISTORY || status === STATUS.UNKNOWN || status === STATUS.NO_EVENTS) {
    confidence = 'low';
  }

  return {
    status,
    confidence,
    generated: hasPreview,
    decision: normalizedDecision,
    hasChecksum: Boolean(latestWithChecksum),
    hasTraceId: Boolean(latestWithTraceId),
    traceId: latestWithTraceId?.trace_id ?? null,
    eventCount,
    firstEventAt: firstEvent?.created_at ?? null,
    lastEventAt: lastEvent?.created_at ?? null,
    checksum: latestWithChecksum?.artifact_checksum ?? null,
    originModel: latestWithOriginModel?.origin_model ?? null,
    originPromptId: latestWithPromptId?.origin_prompt_id ?? null,
    validation: latestPreview?.preview_validation ?? null,
    warnings,
    limitations: [
      'veredito_observacional_baseado_apenas_no_artifact_ledger',
      'checksum_registrado_nao_revalida_conteudo_atual',
      'nao_substitui_auditoria_externa_ou_garantia_criptografica_completa',
      'read_only_sem_impacto_em_runtime_ou_decisao',
    ],
  };
}

export { STATUS as ARTIFACT_PROVENANCE_STATUS };
