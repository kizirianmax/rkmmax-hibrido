/**
 * POST /api/artifact-preview — Preview e Refinamento de Artefatos (Fase 2D)
 *
 * Endpoint único que despacha por método HTTP:
 *
 * ── POST ─────────────────────────────────────────────────────────────────────
 * Recebe content + metadata, empacota (Fase 2A), valida (Fase 2B),
 * opcionalmente executa se for JS (Fase 2C) e retorna o preview completo.
 *
 * Body: { "content": "<string>", "metadata": { ... } }
 *
 * Resposta (200):
 * {
 *   "success": true,
 *   "preview": { previewAvailable, summary, decision, feedback, decisionTimestamp }
 * }
 *
 * ── PATCH ────────────────────────────────────────────────────────────────────
 * Recebe o preview existente + decision + feedback e retorna o objeto atualizado.
 *
 * Body: { "preview": { ... }, "decision": "approved"|"rejected", "feedback": "..." }
 *
 * Resposta (200):
 * {
 *   "success": true,
 *   "preview": { ...preview atualizado... }
 * }
 *
 * NÃO altera Serginho, Especialistas, ABNT, /api/ai, nem as Fases 2A–2C.
 */

import { packageArtifact } from '../src/lib/construtor/artifactPackager.js';
import { validateArtifact } from '../src/lib/construtor/artifactValidator.js';
import { generatePreview, applyDecision } from '../src/lib/construtor/artifactPreview.js';
import { applyCorsRestricted } from './lib/cors.js';
import { verifyAuth } from './lib/auth.js';

// ⚠️ Fase 2 — Contenção P0:
//
// A importação de `executeArtifact` foi DESLIGADA intencionalmente neste handler.
// O preview NÃO deve executar JavaScript no servidor automaticamente. A execução
// permanecerá indisponível até que um PR posterior introduza sandbox real e
// gatilho explícito opt-in.
//
// O contrato de resposta preserva o campo `preview.summary.execution` para
// compatibilidade do frontend, mas com valor explícito indicando desativação
// temporária por segurança (sem fingir execução realizada).

/**
 * Marcador de execução desativada temporariamente — preserva o shape esperado
 * pelo frontend, sem fingir que houve execução.
 */
const EXECUTION_DISABLED = {
  executed: false,
  success: false,
  command: null,
  durationMs: 0,
  stdout: '',
  stderr: '',
  timedOut: false,
  exitCode: null,
  reason: 'execution-disabled-by-security-policy',
};

export default async function handler(req, res) {
  // CORS restrito — substitui o antigo "*"
  if (applyCorsRestricted(req, res)) return;

  if (req.method !== 'POST' && req.method !== 'PATCH') {
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

  // ── POST: gerar preview ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { content, metadata = {} } = req.body || {};

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({
          error: 'Bad request',
          message: '"content" (string não vazia) é obrigatório',
        });
      }

      // Fase 2A — empacotar
      const artifact = await packageArtifact({ content, metadata });

      // Fase 2B — validar
      const validationResult = validateArtifact(artifact);

      // Fase 2C — execução automática DESATIVADA por contenção P0.
      // Não invocar `executeArtifact()` aqui. Preview deve ser inspeção, não execução.
      const executionResult = EXECUTION_DISABLED;

      // Fase 2D — gerar preview
      const preview = generatePreview(artifact, validationResult, executionResult);

      return res.status(200).json({ success: true, preview });
    } catch (error) {
      console.error('❌ Artifact preview (POST) error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Falha ao gerar preview do artefato'
            : error.message,
      });
    }
  }

  // ── PATCH: aplicar decisão ────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const { preview, decision, feedback = null, content } = req.body || {};

      if (!preview || typeof preview !== 'object') {
        return res.status(400).json({
          error: 'Bad request',
          message: '"preview" (objeto) é obrigatório',
        });
      }

      const allowedDecisions = ['approved', 'rejected'];
      if (!allowedDecisions.includes(decision)) {
        return res.status(400).json({
          error: 'Bad request',
          message: `"decision" deve ser um de: ${allowedDecisions.join(', ')}`,
        });
      }

      const updatedPreview = applyDecision(preview, decision, feedback);

      // Quando aprovado e content fornecido, empacotar o artefato e retornar zipBase64
      if (decision === 'approved' && content && typeof content === 'string' && content.trim() !== '') {
        try {
          const artifact = await packageArtifact({ content, metadata: preview.summary?.origin || {} });
          return res.status(200).json({ success: true, preview: updatedPreview, zipBase64: artifact.zipBase64 });
        } catch (packError) {
          console.error('❌ Artifact packaging on approval failed:', packError);
          // Falha no empacotamento não bloqueia a aprovação — retorna sem zipBase64
        }
      }

      return res.status(200).json({ success: true, preview: updatedPreview });
    } catch (error) {
      console.error('❌ Artifact preview (PATCH) error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Falha ao aplicar decisão ao artefato'
            : error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
