import { createClient } from '@supabase/supabase-js';

const ALLOWED_EVENT_TYPES = new Set(['preview_generated', 'decision_applied']);
const MAX_FEEDBACK_LENGTH = 1000;
const SAFE_LEDGER_FIELDS = [
  'ledger_id',
  'artifact_id',
  'event_type',
  'trace_id',
  'artifact_checksum',
  'origin_model',
  'origin_prompt_id',
  'artifact_timestamp',
  'preview_validation',
  'preview_status',
  'preview_files_summary',
  'decision',
  'feedback',
  'decision_timestamp',
  'created_at',
];

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeFeedback(feedback) {
  if (typeof feedback !== 'string') return null;
  const trimmed = feedback.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_FEEDBACK_LENGTH);
}

function normalizeTraceId(traceId) {
  if (typeof traceId !== 'string') return null;
  const trimmed = traceId.trim();
  return trimmed || null;
}

function buildLedgerRow(event = {}) {
  const eventType = event.eventType;
  if (!ALLOWED_EVENT_TYPES.has(eventType)) return null;

  const manifest = event.manifest && typeof event.manifest === 'object' ? event.manifest : {};
  const summary = event.preview?.summary && typeof event.preview.summary === 'object' ? event.preview.summary : {};
  const origin = manifest.origin || summary.origin || {};
  const traceId = event.traceId ?? origin.traceId ?? null;

  const artifactId = manifest.id || summary.id || event.artifactId || null;
  if (!artifactId) return null;

  return {
    artifact_id: artifactId,
    event_type: eventType,
    trace_id: normalizeTraceId(traceId),
    artifact_checksum: manifest.checksum || null,
    origin_model: origin.model || null,
    origin_prompt_id: origin.promptId || null,
    artifact_timestamp: manifest.timestamp || summary.timestamp || null,
    preview_validation: summary.validation || null,
    preview_status: summary.status || null,
    preview_files_summary: summary.filesSummary || null,
    decision: event.decision ?? event.preview?.decision ?? null,
    feedback: normalizeFeedback(event.feedback ?? event.preview?.feedback ?? null),
    decision_timestamp: event.decisionTimestamp ?? event.preview?.decisionTimestamp ?? null,
    user_id: event.user?.id || null,
    user_email: event.user?.email || null,
  };
}

export async function recordLedgerEvent(event) {
  try {
    const row = buildLedgerRow(event);
    if (!row) return false;

    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('artifact_ledger').insert(row);
    if (error) {
      console.error('[artifactLedger] insert error:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[artifactLedger] recordLedgerEvent exception:', error.message);
    return false;
  }
}

export async function readLedgerEvents({ artifactId, userId } = {}) {
  try {
    if (!artifactId || !userId) {
      return { events: [], error: 'invalid_params' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { events: [], error: 'supabase_unavailable' };
    }

    const { data, error } = await supabase
      .from('artifact_ledger')
      .select(SAFE_LEDGER_FIELDS.join(','))
      .eq('artifact_id', artifactId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[artifactLedger] read error:', error.message);
      return { events: [], error: 'read_failed' };
    }

    return { events: Array.isArray(data) ? data : [], error: null };
  } catch (error) {
    console.error('[artifactLedger] readLedgerEvents exception:', error.message);
    return { events: [], error: 'read_failed' };
  }
}

export async function readLedgerEventsByTraceId({ traceId, userId } = {}) {
  try {
    if (!traceId || !userId) {
      return { events: [], error: 'invalid_params' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { events: [], error: 'supabase_unavailable' };
    }

    const { data, error } = await supabase
      .from('artifact_ledger')
      .select(SAFE_LEDGER_FIELDS.join(','))
      .eq('trace_id', traceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .order('ledger_id', { ascending: true });

    if (error) {
      console.error('[artifactLedger] read by trace_id error:', error.message);
      return { events: [], error: 'read_failed' };
    }

    return { events: Array.isArray(data) ? data : [], error: null };
  } catch (error) {
    console.error('[artifactLedger] readLedgerEventsByTraceId exception:', error.message);
    return { events: [], error: 'read_failed' };
  }
}
