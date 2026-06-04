const KNOWN_EVENT_TYPES = new Set(['preview_generated', 'decision_applied']);

const LIMITATIONS = [
  'Consulta por traceId é observacional/read-only derivada do Artifact Ledger.',
  'traceId é metadado observacional e não constitui garantia ou prova criptográfica completa.',
  'Consulta por traceId não é rastreamento global entre usuários.',
  'Consulta por traceId não altera runtime, decisão, geração, ZIP, preview, execução, prompts, providers/modelos, UI ou orquestração.',
];

function normalizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDecision(value) {
  const decision = normalizeString(value)?.toLowerCase();
  if (decision === 'approved' || decision === 'rejected') return decision;
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

function deriveStatus({ events, artifactIds }) {
  if (!events.length) return 'no_events';
  if (artifactIds.length > 1) return 'multi_artifact';
  if (artifactIds.length === 1) return 'single_artifact';

  const hasUnknownType = events.some((event) => !KNOWN_EVENT_TYPES.has(event.event_type));
  if (hasUnknownType) return 'unknown';
  return 'trace_available';
}

function buildTimeline(events) {
  return events.map((event, index) => ({
    step: index + 1,
    artifactId: normalizeString(event.artifact_id),
    eventType: normalizeString(event.event_type),
    decision: normalizeDecision(event.decision),
    createdAt: event.created_at ?? null,
    originModel: normalizeString(event.origin_model),
    originPromptId: normalizeString(event.origin_prompt_id),
    previewStatus: normalizeString(event.preview_status),
    hasValidation: Boolean(event.preview_validation),
    hasFilesSummary: Boolean(event.preview_files_summary),
    hasFeedback: Boolean(normalizeString(event.feedback)),
  }));
}

export function buildArtifactTrace(events = []) {
  const normalized = normalizeEvents(events);
  const timeline = buildTimeline(normalized);
  const artifactIds = [
    ...new Set(
      timeline
        .map((item) => item.artifactId)
        .filter(Boolean),
    ),
  ];
  const checksums = normalized
    .map((event) => normalizeString(event.artifact_checksum))
    .filter(Boolean);
  const uniqueChecksums = [...new Set(checksums)];
  const status = deriveStatus({ events: normalized, artifactIds });
  const warnings = [];

  if (!normalized.length) {
    warnings.push('Nenhum evento encontrado para o traceId informado no contexto do usuário autenticado.');
  } else if (status === 'unknown') {
    warnings.push('Eventos encontrados com tipos não reconhecidos para derivação completa.');
  }

  return {
    status,
    eventCount: normalized.length,
    artifactCount: artifactIds.length,
    artifactIds,
    firstEventAt: normalized[0]?.created_at ?? null,
    lastEventAt: normalized[normalized.length - 1]?.created_at ?? null,
    hasChecksum: uniqueChecksums.length > 0,
    checksumChanged: uniqueChecksums.length > 1,
    timeline,
    warnings,
    limitations: [...LIMITATIONS],
  };
}
