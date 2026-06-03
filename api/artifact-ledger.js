import { readLedgerEvents } from './_utils/artifactLedger.js';
import { verifyAuth } from './lib/auth.js';

const SAFE_RESPONSE_FIELDS = [
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

function sanitizeEvents(events = []) {
  if (!Array.isArray(events)) return [];
  return events.map((event) => {
    const safeEvent = {};
    for (const field of SAFE_RESPONSE_FIELDS) {
      safeEvent[field] = event?.[field] ?? null;
    }
    return safeEvent;
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    const statusMap = {
      missing_token: 401,
      invalid_token: 401,
      auth_unavailable: 503,
      auth_error: 503,
    };
    return res.status(statusMap[authError] || 401).json({
      error: authError === 'auth_unavailable' ? 'Service configuration error' : 'Unauthorized',
      message: authError === 'missing_token'
        ? 'Authentication required.'
        : authError === 'auth_unavailable'
        ? 'Authentication service is not configured. Contact administrator.'
        : 'Invalid or expired token. Please log in again.',
      code: authError,
    });
  }

  const artifactIdRaw = Array.isArray(req.query?.artifactId) ? req.query.artifactId[0] : req.query?.artifactId;
  const artifactId = typeof artifactIdRaw === 'string' ? artifactIdRaw.trim() : '';

  if (!artifactId) {
    return res.status(400).json({
      error: 'Bad request',
      message: '"artifactId" query param é obrigatório',
      code: 'missing_artifact_id',
    });
  }

  const { events, error } = await readLedgerEvents({ artifactId, userId: user?.id });
  if (error) {
    const isUnavailable = error === 'supabase_unavailable';
    return res.status(isUnavailable ? 503 : 500).json({
      error: isUnavailable ? 'Service configuration error' : 'Internal server error',
      message: isUnavailable
        ? 'Artifact ledger is unavailable in this environment.'
        : 'Failed to read artifact ledger.',
      code: error,
    });
  }

  return res.status(200).json({
    success: true,
    artifactId,
    events: sanitizeEvents(events),
  });
}
