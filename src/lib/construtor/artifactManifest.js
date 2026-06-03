/**
 * Gerador de manifest.json para artefatos do Construtor/Híbrido
 *
 * Responsabilidade: montar o manifest mínimo obrigatório com proveniência
 * e checksum SHA-256 do conteúdo gerado.
 */

import { createHash } from 'node:crypto';

/** Identificador padrão do prompt usado pelo Construtor/Híbrido. */
export const DEFAULT_PROMPT_ID = 'hybrid-genius';

/**
 * Calcula o checksum SHA-256 de uma string de conteúdo.
 * @param {string} content
 * @returns {string} no formato "sha256:<hex>"
 */
export function computeChecksum(content) {
  const hash = createHash('sha256').update(content, 'utf-8').digest('hex');
  return `sha256:${hash}`;
}

/**
 * Extrai o identificador legível do modelo a partir do objeto model retornado
 * pelo Serginho Orchestrator ou dos metadados passados pelo endpoint.
 * @param {object|string|undefined} model
 * @param {string|undefined} provider
 * @returns {string}
 */
export function resolveModelName(model, provider) {
  if (!model && !provider) return 'unknown';
  if (typeof model === 'string') return model;
  if (model && typeof model === 'object') {
    return model.modelId || model.displayName || model.id || provider || 'unknown';
  }
  return provider || 'unknown';
}

/**
 * Gera o manifest.json para um artefato do Construtor.
 *
 * @param {object} params
 * @param {string} params.id - UUID v4 do artefato
 * @param {string} params.content - conteúdo gerado (usado para checksum)
 * @param {object} params.metadata - metadados vindos do endpoint ou do Serginho
 * @param {object|string} [params.metadata.model]
 * @param {string} [params.metadata.provider]
 * @param {string} [params.metadata.tier]
 * @param {string} [params.metadata.complexity]
 * @param {string} [params.metadata.promptId]
 * @param {string} [params.contentType] - tipo detectado do conteúdo (ex: "html", "md")
 * @param {Array<{path: string, description: string, type: string}>} [params.contents] - lista de arquivos do pacote
 * @returns {object} manifest
 */
export function generateManifest({ id, content, metadata = {}, contentType, contents }) {
  const checksum = computeChecksum(content);
  const modelName = resolveModelName(metadata.model, metadata.provider);

  const manifest = {
    id,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    origin: {
      specialist: 'hybrid',
      model: modelName,
      promptId: metadata.promptId || DEFAULT_PROMPT_ID,
      traceId: typeof metadata.traceId === 'string' && metadata.traceId.trim() ? metadata.traceId.trim() : null,
    },
    checksum,
  };

  if (contentType) manifest.contentType = contentType;
  if (contents && contents.length > 0) manifest.contents = contents;

  return manifest;
}
