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
import { executeArtifact } from '../src/lib/construtor/artifactRunner.js';
import { generatePreview, applyDecision } from '../src/lib/construtor/artifactPreview.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

      // Fase 2C — tentar executar (executor detecta e pula conteúdo não executável)
      let executionResult = null;
      if (artifact.zipBuffer instanceof Buffer) {
        try {
          executionResult = await executeArtifact(artifact);
        } catch {
          // Execução opcional — não bloqueia o preview
          executionResult = null;
        }
      }

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
