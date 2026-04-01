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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
