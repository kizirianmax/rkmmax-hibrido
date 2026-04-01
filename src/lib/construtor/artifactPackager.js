/**
 * Empacotador de artefatos do Construtor/Híbrido — Fase 2A
 *
 * Responsabilidade: receber o conteúdo gerado pelo Construtor e os
 * metadados associados, e produzir um arquivo ZIP com a estrutura:
 *
 *   artefato/
 *   ├── content/
 *   │   └── content.md      (ou nome definido em metadata.filename)
 *   ├── manifest.json
 *   └── logs/
 *       ├── generation.log
 *       └── structure.log
 *
 * Este módulo NÃO altera o fluxo do Serginho Orchestrator nem do /api/ai.
 * É uma camada adicional de empacotamento acionada pelo /api/artifact.
 */

import { randomUUID } from 'node:crypto';
import archiver from 'archiver';

import { generateManifest } from './artifactManifest.js';
import { generateGenerationLog, generateStructureLog } from './artifactLogger.js';

/**
 * Empacota o conteúdo gerado pelo Construtor em um ZIP rastreável.
 *
 * @param {object} params
 * @param {string} params.content - texto gerado pelo Construtor (result.text)
 * @param {object} [params.metadata] - metadados vindos do /api/ai ou do chamador
 * @param {object|string} [params.metadata.model] - objeto model retornado pelo Serginho
 * @param {string} [params.metadata.provider]
 * @param {string} [params.metadata.tier]
 * @param {string} [params.metadata.complexity]
 * @param {string} [params.metadata.promptId]
 * @param {string} [params.metadata.filename] - nome do arquivo de conteúdo (padrão: content.md)
 *
 * @returns {Promise<{id: string, manifest: object, zipBuffer: Buffer, zipBase64: string}>}
 */
export async function packageArtifact({ content, metadata = {} }) {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new TypeError('packageArtifact: content must be a non-empty string');
  }

  const startTime = Date.now();
  const id = randomUUID();

  const contentFilename = metadata.filename || 'content.md';
  const contentBuffer = Buffer.from(content, 'utf-8');

  // Gerar manifest com checksum
  const manifest = generateManifest({ id, content, metadata });
  const manifestJson = JSON.stringify(manifest, null, 2);

  // Gerar logs estruturados
  const files = [
    { path: `content/${contentFilename}`, size: contentBuffer.length, type: 'text/markdown' },
    { path: 'manifest.json', size: Buffer.byteLength(manifestJson, 'utf-8'), type: 'application/json' },
  ];

  const durationMs = Date.now() - startTime;

  const generationLog = generateGenerationLog({
    timestamp: manifest.timestamp,
    inputSummary: content.slice(0, 200),
    model: manifest.origin.model,
    tier: metadata.tier,
    complexity: metadata.complexity,
    durationMs,
  });

  const structureLog = generateStructureLog({ files });

  // Empacotar em ZIP
  const zipBuffer = await createZipBuffer({
    contentFilename,
    contentBuffer,
    manifestJson,
    generationLog,
    structureLog,
  });

  return {
    id,
    manifest,
    zipBuffer,
    zipBase64: zipBuffer.toString('base64'),
  };
}

/**
 * Cria um buffer ZIP em memória com a estrutura do artefato.
 * @private
 */
function createZipBuffer({ contentFilename, contentBuffer, manifestJson, generationLog, structureLog }) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 6 } });
    const chunks = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    archive.append(contentBuffer, { name: `content/${contentFilename}` });
    archive.append(Buffer.from(manifestJson, 'utf-8'), { name: 'manifest.json' });
    archive.append(Buffer.from(generationLog, 'utf-8'), { name: 'logs/generation.log' });
    archive.append(Buffer.from(structureLog, 'utf-8'), { name: 'logs/structure.log' });

    archive.finalize();
  });
}
