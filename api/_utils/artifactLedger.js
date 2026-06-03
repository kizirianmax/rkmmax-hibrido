import { createClient } from '@supabase/supabase-js';

const ALLOWED_EVENT_TYPES = new Set(['preview_generated', 'decision_applied']);
const MAX_FEEDBACK_LENGTH = 1000;

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

function buildLedgerRow(event = {}) {
  const eventType = event.eventType;
  if (!ALLOWED_EVENT_TYPES.has(eventType)) return null;

  const manifest = event.manifest && typeof event.manifest === 'object' ? event.manifest : {};
  const summary = event.preview?.summary && typeof event.preview.summary === 'object' ? event.preview.summary : {};
  const origin = manifest.origin || summary.origin || {};

  const artifactId = manifest.id || summary.id || event.artifactId || null;
  if (!artifactId) return null;

  return {
    artifact_id: artifactId,
    event_type: eventType,
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

