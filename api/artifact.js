/**
 * POST /api/artifact — Endpoint de empacotamento de artefatos do Construtor/Híbrido
 *
 * Recebe o conteúdo já gerado pelo Construtor (via /api/ai) e os metadados
 * associados, e retorna o artefato empacotado em ZIP (base64) com manifest e logs.
 *
 * NÃO substitui nem altera o fluxo de /api/ai.
 * NÃO faz bypass ao Serginho Orchestrator.
 * É um endpoint complementar acionado APÓS a geração de conteúdo.
 *
 * Body esperado:
 * {
 *   "content": "<string gerada pelo Construtor>",
 *   "metadata": {
 *     "model": <object ou string, opcional>,
 *     "provider": "<string, opcional>",
 *     "tier": "<string, opcional>",
 *     "complexity": "<string, opcional>",
 *     "promptId": "<string, opcional>"
 *   }
 * }
 *
 * Resposta de sucesso (200):
 * {
 *   "success": true,
 *   "id": "<uuid-v4>",
 *   "manifest": { ... },
 *   "zipBase64": "<base64>"
 * }
 */

import { packageArtifact } from '../src/lib/construtor/artifactPackager.js';
import { applyCorsRestricted } from './lib/cors.js';
import { verifyAuth } from './lib/auth.js';

export default async function handler(req, res) {
  // CORS restrito — substitui o antigo "*"
  if (applyCorsRestricted(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth guard — rejeitar requisições sem JWT válido (padrão de /api/ai)
  const { error: authError } = await verifyAuth(req);
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
        ? 'Authentication required. Send Authorization: Bearer <token> header.'
        : authError === 'auth_unavailable'
        ? 'Authentication service is not configured. Contact administrator.'
        : 'Invalid or expired token. Please log in again.',
      code: authError,
    });
  }

  try {
    const { content, metadata = {} } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        error: 'Bad request',
        message: '"content" (string não vazia) é obrigatório',
      });
    }

    const artifact = await packageArtifact({ content, metadata });

    return res.status(200).json({
      success: true,
      id: artifact.id,
      manifest: artifact.manifest,
      zipBase64: artifact.zipBase64,
    });
  } catch (error) {
    console.error('❌ Artifact packaging error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Falha ao empacotar artefato'
          : error.message,
    });
  }
}
