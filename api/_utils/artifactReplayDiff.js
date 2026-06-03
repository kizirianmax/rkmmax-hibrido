const DECISION_APPROVED = 'approved';
const DECISION_REJECTED = 'rejected';

const LIMITATIONS = [
  'Diff/veredito é observacional/read-only e derivado apenas de eventos já registrados no Artifact Ledger.',
  'Diff não restaura artefatos, não revalida conteúdo atual e não representa histórico Git/versionamento completo.',
  'Diff não constitui prova criptográfica completa e não altera runtime, decisão, geração, ZIP, preview, execução, prompts, providers/modelos, UI ou orquestração.',
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

function hasNonEmptyFeedback(value) {
  return Boolean(normalizeString(value));
}

function didOptionalValueChange(previousValue, nextValue) {
  const previous = normalizeString(previousValue);
  const next = normalizeString(nextValue);
  if (!previous || !next) return false;
  return previous !== next;
}

function safeSecondsBetween(previous, next) {
  const previousTime = Date.parse(previous?.created_at || '');
  const nextTime = Date.parse(next?.created_at || '');
  if (!Number.isFinite(previousTime) || !Number.isFinite(nextTime)) return null;
  if (nextTime < previousTime) return null;
  return Math.floor((nextTime - previousTime) / 1000);
}

function stableSerialize(value) {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => (item && typeof item === 'object' ? JSON.parse(stableSerialize(item) || 'null') : item)));
  }

  const sortedObject = Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      const child = value[key];
      if (child && typeof child === 'object') {
        const serialized = stableSerialize(child);
        acc[key] = serialized ? JSON.parse(serialized) : child;
      } else {
        acc[key] = child;
      }
      return acc;
    }, {});

  return JSON.stringify(sortedObject);
}

function didObjectChange(previousValue, nextValue) {
  if (!previousValue || !nextValue) return false;
  const previous = stableSerialize(previousValue);
  const next = stableSerialize(nextValue);
  if (!previous || !next) return false;
  return previous !== next;
}

function buildTransitions(events) {
  const transitions = [];

  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1];
    const current = events[index];

    transitions.push({
      step: index,
      fromStep: index,
      toStep: index + 1,
      fromEventType: normalizeString(previous.event_type),
      toEventType: normalizeString(current.event_type),
      fromDecision: normalizeDecision(previous.decision),
      toDecision: normalizeDecision(current.decision),
      secondsBetween: safeSecondsBetween(previous, current),
      traceIdChanged: didOptionalValueChange(previous.trace_id, current.trace_id),
      checksumChanged: didOptionalValueChange(previous.artifact_checksum, current.artifact_checksum),
      validationChanged: didObjectChange(previous.preview_validation, current.preview_validation),
      filesSummaryChanged: didObjectChange(previous.preview_files_summary, current.preview_files_summary),
      hasFeedbackOnToEvent: hasNonEmptyFeedback(current.feedback),
    });
  }

  return transitions;
}

function deriveStatus(events, transitions) {
  if (!events.length) return 'no_events';
  if (events.length === 1) return 'single_event';

  let seenPreview = false;
  let hasPreview = false;
  let hasKnownType = false;
  let hasDecisionWithoutPreview = false;
  let hasAnyDecision = false;
  let lastDecision = null;

  for (const event of events) {
    const eventType = normalizeString(event.event_type);
    if (eventType === 'preview_generated') {
      hasKnownType = true;
      hasPreview = true;
      seenPreview = true;
      continue;
    }

    if (eventType === 'decision_applied') {
      hasKnownType = true;
      hasAnyDecision = true;
      if (!seenPreview) hasDecisionWithoutPreview = true;
      const decision = normalizeDecision(event.decision);
      if (decision) lastDecision = decision;
    }
  }

  if (hasDecisionWithoutPreview) return 'incomplete_history';
  if (hasPreview && lastDecision === DECISION_APPROVED) return DECISION_APPROVED;
  if (hasPreview && lastDecision === DECISION_REJECTED) return DECISION_REJECTED;
  if (hasPreview && !hasAnyDecision) return 'decision_pending';
  if (hasPreview && hasAnyDecision && !lastDecision) return 'incomplete_history';
  if (transitions.length && hasKnownType) return 'diff_available';
  if (hasKnownType) return 'incomplete_history';
  return 'unknown';
}

export function buildArtifactReplayDiff(events = []) {
  const normalized = normalizeEvents(events);
  const transitions = buildTransitions(normalized);
  const traceIds = [...new Set(normalized.map((event) => normalizeString(event.trace_id)).filter(Boolean))];
  const checksums = normalized.map((event) => normalizeString(event.artifact_checksum)).filter(Boolean);
  const status = deriveStatus(normalized, transitions);

  const warnings = [];
  if (!normalized.length) {
    warnings.push('Nenhum evento encontrado para o artifactId informado.');
  }
  if (status === 'incomplete_history') {
    warnings.push('Histórico incompleto: decisão sem preview anterior ou sequência inconsistente no ledger.');
  }

  return {
    status,
    eventCount: normalized.length,
    transitionCount: transitions.length,
    firstEventAt: normalized[0]?.created_at ?? null,
    lastEventAt: normalized[normalized.length - 1]?.created_at ?? null,
    hasTraceId: traceIds.length > 0,
    traceIds,
    hasChecksum: checksums.length > 0,
    checksumChanged: transitions.some((transition) => transition.checksumChanged),
    transitions,
    warnings,
    limitations: [...LIMITATIONS],
  };
}
