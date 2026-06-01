/**
 * Empacotador de artefatos do Construtor/Híbrido — Fase 2A
 *
 * Responsabilidade: receber o conteúdo gerado pelo Construtor e os
 * metadados associados, e produzir um arquivo ZIP com a estrutura:
 *
 *   (HTML com extração)          (Markdown ou HTML simples)
 *   ├── index.html               ├── index.html  ou  content.md
 *   ├── styles.css  (se extraído)
 *   ├── script.js   (se extraído)
 *   ├── README.md                ├── README.md
 *   ├── manifest.json            ├── manifest.json
 *   └── logs/                    └── logs/
 *       ├── generation.log           ├── generation.log
 *       └── structure.log            └── structure.log
 *
 * Este módulo NÃO altera o fluxo do Serginho Orchestrator nem do /api/ai.
 * É uma camada adicional de empacotamento acionada pelo /api/artifact.
 */

import { randomUUID } from 'node:crypto';
import { ZipArchive } from 'archiver';

import { generateManifest } from './artifactManifest.js';
import { generateGenerationLog, generateStructureLog } from './artifactLogger.js';
import { buildArtifactPipelineMetrics } from './artifactMetrics.js';
import {
  stripMarkdownFences,
  tryNormalizeAlternativeFormat,
  parseMultiFileContent,
} from './artifactNormalizer.js';

// Re-export pure normalizer functions for backwards compatibility with existing callers.
export { stripMarkdownFences, tryNormalizeAlternativeFormat, parseMultiFileContent, normalizeVisibleContent, prettyFormatByExtension } from './artifactNormalizer.js';

// ── Detecção de tipo de conteúdo ─────────────────────────────────────────────

/**
 * Detecta o tipo real do conteúdo gerado e retorna metadados de extensão/tipo.
 * @param {string} content
 * @returns {{ extension: string, type: string, label: string, name: string }}
 */
export function detectContentType(content) {
  const trimmed = content.trim();
  if (
    /^<!DOCTYPE/i.test(trimmed) ||
    /^<html/i.test(trimmed) ||
    (trimmed.startsWith('<') && trimmed.includes('</html>'))
  ) {
    return { extension: '.html', type: 'text/html', label: 'Landing Page HTML', name: 'index.html' };
  }
  if (trimmed.startsWith('#') || trimmed.includes('\n## ') || trimmed.includes('\n### ')) {
    return { extension: '.md', type: 'text/markdown', label: 'Documento Markdown', name: 'content.md' };
  }
  return { extension: '.md', type: 'text/markdown', label: 'Documento', name: 'content.md' };
}

// ── Extração conservadora de partes HTML ─────────────────────────────────────

/**
 * Tenta extrair blocos <style> e <script> inline do HTML para arquivos separados.
 * Retorna null se não for HTML completo ou não houver nada a extrair.
 * @param {string} content
 * @returns {{ htmlContent: string, extractedFiles: Array<{name, content, type}> } | null}
 */
export function tryExtractHtmlParts(content) {
  if (!/^<!DOCTYPE|^<html/i.test(content.trim())) {
    return null;
  }

  // Limitar tamanho do input para evitar degradação em conteúdo malformado
  const MAX_EXTRACTION_SIZE = 500_000;
  if (content.length > MAX_EXTRACTION_SIZE) {
    return null;
  }

  const extractedFiles = [];
  let htmlContent = content;

  // Extrair blocos <style>...</style>
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styles = [];
  let match;
  while ((match = styleRegex.exec(content)) !== null) {
    styles.push(match[1].trim());
  }

  // Extrair blocos <script>...</script> sem atributo src (inline apenas)
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  while ((match = scriptRegex.exec(content)) !== null) {
    if (match[1].trim()) scripts.push(match[1].trim());
  }

  if (styles.length > 0) {
    const cssContent = styles.join('\n\n');
    extractedFiles.push({ name: 'styles.css', content: cssContent, type: 'text/css' });
    // Remoção de blocos <style> para empacotamento em arquivo separado (não é sanitização de segurança)
    // lgtm[js/incomplete-multi-character-sanitization]
    htmlContent = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    htmlContent = htmlContent.replace(/<\/head>/i, '  <link rel="stylesheet" href="styles.css">\n</head>');
  }

  if (scripts.length > 0) {
    const jsContent = scripts.join('\n\n');
    extractedFiles.push({ name: 'script.js', content: jsContent, type: 'application/javascript' });
    // Remoção de blocos <script> inline para empacotamento em arquivo separado (não é sanitização de segurança)
    // lgtm[js/incomplete-multi-character-sanitization]
    htmlContent = htmlContent.replace(/<script(?![^>]*\bsrc\b)[^>]*>[\s\S]*?<\/script>/gi, '');
    htmlContent = htmlContent.replace(/<\/body>/i, '  <script src="script.js"></script>\n</body>');
  }

  if (extractedFiles.length === 0) return null;

  return { htmlContent, extractedFiles };
}

// ── Geração de README.md ──────────────────────────────────────────────────────

/**
 * Gera o README.md explicativo do pacote.
 * @param {{ id: string, timestamp: string, model: string, contentFilename: string, extractedFiles: Array }} params
 * @returns {string}
 */
function generateReadme({ id, timestamp, model, contentFilename, extractedFiles = [] }) {
  const isHtml = contentFilename.endsWith('.html');
  const fileList = [`- \`${contentFilename}\` — Arquivo principal`];
  for (const f of extractedFiles) {
    if (f.name === 'styles.css') fileList.push('- `styles.css` — Estilos extraídos');
    if (f.name === 'script.js') fileList.push('- `script.js` — Scripts extraídos');
  }
  fileList.push('- `manifest.json` — Metadados e rastreabilidade');
  fileList.push('- `logs/` — Logs de geração e estrutura');

  const howToUse = isHtml
    ? `Abra o arquivo \`${contentFilename}\` no navegador para visualizar a landing page.`
    : `Abra o arquivo \`${contentFilename}\` em um editor de texto ou visualizador Markdown.`;

  return `# Artefato do Construtor/Híbrido

**ID:** ${id}
**Gerado em:** ${timestamp}
**Modelo:** ${model}
**Status:** ✅ Aprovado

## Conteúdo do pacote

${fileList.join('\n')}

## Como usar

${howToUse}
`;
}

/**
 * Gera um README.md mínimo para artefatos multiarquivo gerados nativamente.
 * @param {{ id: string, files: Array<{name: string}> }} params
 * @returns {string}
 */
function generateMultiFileReadme({ id, files }) {
  const fileList = files.map((f) => `- \`${f.name}\``).join('\n');
  const hasHtml = files.some((f) => f.name.endsWith('.html'));
  const howToUse = hasHtml
    ? 'Abra o arquivo `index.html` no navegador para visualizar o artefato.'
    : 'Abra o arquivo principal em um editor de texto ou visualizador.';

  return `# Artefato do Construtor/Híbrido

**ID:** ${id}
**Status:** ✅ Aprovado

## Arquivos

${fileList}
- \`manifest.json\` — Metadados e rastreabilidade
- \`logs/\` — Logs de geração e estrutura

## Como usar

${howToUse}
`;
}

// ── Empacotamento principal ───────────────────────────────────────────────────

/**
 * Empacota conteúdo multiarquivo já parseado em um ZIP rastreável.
 * @private
 */
async function packageMultiFileArtifact({ id, content, multiFiles, metadata, startTime }) {
  // Garantir README.md no pacote
  const hasReadme = multiFiles.some((f) => f.name.toLowerCase() === 'readme.md');
  const filesWithReadme = hasReadme ? multiFiles : [
    ...multiFiles,
    {
      name: 'README.md',
      content: generateMultiFileReadme({ id, files: multiFiles }),
      type: 'text/markdown',
    },
  ];

  const contents = [
    ...filesWithReadme.map((f) => ({
      path: f.name,
      description: f.name,
      type: f.type,
    })),
    { path: 'manifest.json', description: 'Metadados e rastreabilidade', type: 'application/json' },
    { path: 'logs/generation.log', description: 'Log de geração', type: 'text/plain' },
    { path: 'logs/structure.log', description: 'Log de estrutura', type: 'text/plain' },
  ];

  const manifest = generateManifest({
    id,
    content,
    metadata,
    contentType: 'multi-file',
    contents,
  });
  const manifestJson = JSON.stringify(manifest, null, 2);

  const durationMs = Date.now() - startTime;

  const generationLog = generateGenerationLog({
    timestamp: manifest.timestamp,
    inputSummary: content.slice(0, 200),
    model: manifest.origin.model,
    tier: metadata.tier,
    complexity: metadata.complexity,
    durationMs,
  });

  const filesForLog = filesWithReadme.map((f) => ({
    path: f.name,
    size: Buffer.byteLength(f.content, 'utf-8'),
    type: f.type,
  }));
  filesForLog.push({ path: 'manifest.json', size: Buffer.byteLength(manifestJson, 'utf-8'), type: 'application/json' });

  const structureLog = generateStructureLog({ files: filesForLog });

  const zipBuffer = await new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const chunks = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    for (const f of filesWithReadme) {
      archive.append(Buffer.from(f.content, 'utf-8'), { name: f.name });
    }

    archive.append(Buffer.from(manifestJson, 'utf-8'), { name: 'manifest.json' });
    archive.append(Buffer.from(generationLog, 'utf-8'), { name: 'logs/generation.log' });
    archive.append(Buffer.from(structureLog, 'utf-8'), { name: 'logs/structure.log' });

    archive.finalize();
  });

  const packagingMetrics = buildArtifactPipelineMetrics({
    phase: 'packaging',
    startedAt: new Date(startTime).toISOString(),
    finishedAt: new Date().toISOString(),
    files: contents,
    zipBuffer,
  });

  return {
    id,
    manifest,
    zipBuffer,
    zipBase64: zipBuffer.toString('base64'),
    metrics: { packaging: packagingMetrics },
  };
}

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
 * @param {string} [params.metadata.filename] - nome do arquivo de conteúdo (sobrescreve detecção automática)
 *
 * @returns {Promise<{id: string, manifest: object, zipBuffer: Buffer, zipBase64: string}>}
 */
export async function packageArtifact({ content, metadata = {} }) {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new TypeError('packageArtifact: content must be a non-empty string');
  }

  const startTime = Date.now();
  const id = randomUUID();

  // Tentar formato multiarquivo nativo (delimitadores --- FILE: <path> ---)
  const multiFiles = parseMultiFileContent(content);

  if (multiFiles) {
    return packageMultiFileArtifact({ id, content, multiFiles, metadata, startTime });
  }

  // Fallback: detectar tipo de conteúdo (respeitando metadata.filename se fornecido)
  const contentType = detectContentType(content);
  const contentFilename = metadata.filename || contentType.name;

  // Tentar extrair CSS/JS inline para arquivos separados (só para HTML sem filename explícito)
  let mainContent = content;
  let extractedFiles = [];
  if (!metadata.filename && contentType.extension === '.html') {
    const extraction = tryExtractHtmlParts(content);
    if (extraction) {
      mainContent = extraction.htmlContent;
      extractedFiles = extraction.extractedFiles;
    }
  }

  const contentBuffer = Buffer.from(mainContent, 'utf-8');

  // Montar lista de contents para o manifest
  const contents = [
    { path: contentFilename, description: contentType.label, type: contentType.type },
    ...extractedFiles.map((f) => ({
      path: f.name,
      description: f.name === 'styles.css' ? 'Estilos extraídos' : 'Scripts extraídos',
      type: f.type,
    })),
    { path: 'README.md', description: 'Instruções de uso', type: 'text/markdown' },
    { path: 'manifest.json', description: 'Metadados e rastreabilidade', type: 'application/json' },
    { path: 'logs/generation.log', description: 'Log de geração', type: 'text/plain' },
    { path: 'logs/structure.log', description: 'Log de estrutura', type: 'text/plain' },
  ];

  // Gerar manifest enriquecido com contentType e contents
  const manifest = generateManifest({
    id,
    content,
    metadata,
    contentType: contentType.extension.replace('.', ''),
    contents,
  });
  const manifestJson = JSON.stringify(manifest, null, 2);

  // Gerar logs estruturados
  const filesForLog = [
    { path: contentFilename, size: contentBuffer.length, type: contentType.type },
    ...extractedFiles.map((f) => ({
      path: f.name,
      size: Buffer.byteLength(f.content, 'utf-8'),
      type: f.type,
    })),
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

  const structureLog = generateStructureLog({ files: filesForLog });

  // Gerar README.md de pacote
  const readme = generateReadme({
    id,
    timestamp: manifest.timestamp,
    model: manifest.origin.model,
    contentFilename,
    extractedFiles,
  });

  // Empacotar em ZIP (arquivos de conteúdo na raiz do ZIP)
  const zipBuffer = await createZipBuffer({
    contentFilename,
    contentBuffer,
    extractedFiles,
    readme,
    manifestJson,
    generationLog,
    structureLog,
  });

  const packagingMetrics = buildArtifactPipelineMetrics({
    phase: 'packaging',
    startedAt: new Date(startTime).toISOString(),
    finishedAt: new Date().toISOString(),
    files: contents,
    zipBuffer,
  });

  return {
    id,
    manifest,
    zipBuffer,
    zipBase64: zipBuffer.toString('base64'),
    metrics: { packaging: packagingMetrics },
  };
}

/**
 * Cria um buffer ZIP em memória com a estrutura do artefato.
 * Os arquivos de conteúdo ficam na raiz do ZIP (não em content/).
 * @private
 */
function createZipBuffer({
  contentFilename,
  contentBuffer,
  extractedFiles = [],
  readme,
  manifestJson,
  generationLog,
  structureLog,
}) {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const chunks = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Arquivo principal de conteúdo na raiz
    archive.append(contentBuffer, { name: contentFilename });

    // Arquivos extraídos (styles.css, script.js) na raiz
    for (const f of extractedFiles) {
      archive.append(Buffer.from(f.content, 'utf-8'), { name: f.name });
    }

    // README e metadados na raiz
    archive.append(Buffer.from(readme, 'utf-8'), { name: 'README.md' });
    archive.append(Buffer.from(manifestJson, 'utf-8'), { name: 'manifest.json' });
    archive.append(Buffer.from(generationLog, 'utf-8'), { name: 'logs/generation.log' });
    archive.append(Buffer.from(structureLog, 'utf-8'), { name: 'logs/structure.log' });

    archive.finalize();
  });
}
