import { readLedgerEvents } from './_utils/artifactLedger.js';
import { buildArtifactReplay } from './_utils/artifactReplay.js';
import { verifyAuth } from './lib/auth.js';

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
      message:
        authError === 'missing_token'
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
    replay: buildArtifactReplay(events),
  });
}
