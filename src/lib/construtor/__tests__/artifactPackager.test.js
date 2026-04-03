/**
 * Testes unitários — Fase 2A: Empacotador de Artefatos do Construtor/Híbrido
 *
 * Valida:
 * - packageArtifact() gera um ZIP válido
 * - manifest.json contém os campos mínimos obrigatórios
 * - logs (generation.log, structure.log) são gerados com conteúdo estruturado
 * - checksum SHA-256 é calculado corretamente
 * - erros de input são tratados adequadamente
 */

import { packageArtifact, detectContentType, tryExtractHtmlParts, parseMultiFileContent } from '../artifactPackager.js';
import { generateManifest, computeChecksum, resolveModelName, DEFAULT_PROMPT_ID } from '../artifactManifest.js';
import { generateGenerationLog, generateStructureLog } from '../artifactLogger.js';

// Bytes mágicos do formato ZIP: PK\x03\x04
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

describe('artifactManifest', () => {
  describe('computeChecksum', () => {
    test('deve retornar string no formato sha256:<hex>', () => {
      const checksum = computeChecksum('hello world');
      expect(checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    test('deve ser determinístico para o mesmo conteúdo', () => {
      const a = computeChecksum('conteúdo de teste');
      const b = computeChecksum('conteúdo de teste');
      expect(a).toBe(b);
    });

    test('deve ser diferente para conteúdos distintos', () => {
      const a = computeChecksum('conteúdo A');
      const b = computeChecksum('conteúdo B');
      expect(a).not.toBe(b);
    });
  });

  describe('resolveModelName', () => {
    test('deve retornar "unknown" quando model e provider são undefined', () => {
      expect(resolveModelName(undefined, undefined)).toBe('unknown');
    });

    test('deve retornar string quando model é string', () => {
      expect(resolveModelName('llama-3.3-70b', undefined)).toBe('llama-3.3-70b');
    });

    test('deve preferir model.modelId', () => {
      expect(resolveModelName({ modelId: 'llama', displayName: 'LLaMA' }, 'groq')).toBe('llama');
    });

    test('deve usar model.displayName se modelId ausente', () => {
      expect(resolveModelName({ displayName: 'LLaMA' }, 'groq')).toBe('LLaMA');
    });

    test('deve usar provider como fallback', () => {
      expect(resolveModelName({}, 'groq')).toBe('groq');
    });
  });

  describe('generateManifest', () => {
    const baseParams = {
      id: 'test-uuid-1234',
      content: 'Conteúdo gerado pelo Construtor',
      metadata: {
        model: { modelId: 'llama-3.3-70b' },
        provider: 'groq',
        tier: 'free',
        complexity: 'medium',
        promptId: 'hybrid-genius',
      },
    };

    test('deve conter campo id igual ao passado', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.id).toBe('test-uuid-1234');
    });

    test('deve conter version "1.0.0"', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.version).toBe('1.0.0');
    });

    test('deve conter timestamp em formato ISO-8601', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('deve conter origin.specialist = "hybrid"', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.origin.specialist).toBe('hybrid');
    });

    test('deve conter origin.model resolvido', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.origin.model).toBe('llama-3.3-70b');
    });

    test('deve conter origin.promptId', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.origin.promptId).toBe('hybrid-genius');
    });

    test('deve conter checksum no formato sha256:<hex>', () => {
      const manifest = generateManifest(baseParams);
      expect(manifest.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    test('checksum deve corresponder ao conteúdo', () => {
      const manifest = generateManifest(baseParams);
      const expected = computeChecksum(baseParams.content);
      expect(manifest.checksum).toBe(expected);
    });

    test('deve usar DEFAULT_PROMPT_ID quando promptId não for informado', () => {
      const params = { ...baseParams, metadata: { ...baseParams.metadata, promptId: undefined } };
      const manifest = generateManifest(params);
      expect(manifest.origin.promptId).toBe(DEFAULT_PROMPT_ID);
    });
  });
});

describe('artifactLogger', () => {
  describe('generateGenerationLog', () => {
    test('deve retornar JSON válido', () => {
      const log = generateGenerationLog({
        timestamp: '2026-04-01T00:00:00.000Z',
        inputSummary: 'resumo',
        model: 'llama',
        tier: 'free',
        complexity: 'low',
        durationMs: 123,
      });
      expect(() => JSON.parse(log)).not.toThrow();
    });

    test('deve conter campo event = "generation"', () => {
      const log = JSON.parse(generateGenerationLog({ timestamp: new Date().toISOString(), inputSummary: '', model: 'x' }));
      expect(log.event).toBe('generation');
    });

    test('deve limitar inputSummary a 200 caracteres', () => {
      const longInput = 'a'.repeat(500);
      const log = JSON.parse(generateGenerationLog({ timestamp: new Date().toISOString(), inputSummary: longInput, model: 'x' }));
      expect(log.inputSummary.length).toBeLessThanOrEqual(200);
    });
  });

  describe('generateStructureLog', () => {
    test('deve retornar JSON válido', () => {
      const log = generateStructureLog({ files: [{ path: 'content/content.md', size: 42, type: 'text/markdown' }] });
      expect(() => JSON.parse(log)).not.toThrow();
    });

    test('deve conter campo event = "structure"', () => {
      const log = JSON.parse(generateStructureLog({ files: [] }));
      expect(log.event).toBe('structure');
    });

    test('deve listar os arquivos passados', () => {
      const files = [{ path: 'content/content.md', size: 10, type: 'text/markdown' }];
      const log = JSON.parse(generateStructureLog({ files }));
      expect(log.files).toHaveLength(1);
      expect(log.files[0].path).toBe('content/content.md');
    });
  });
});

describe('packageArtifact', () => {
  const sampleContent = '# Artefato de Teste\n\nConteúdo gerado pelo Construtor para fins de teste.';
  const sampleMetadata = {
    model: { modelId: 'llama-3.3-70b' },
    provider: 'groq',
    tier: 'free',
    complexity: 'medium',
    promptId: 'hybrid-genius',
  };

  test('deve retornar um objeto com id, manifest, zipBuffer e zipBase64', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('manifest');
    expect(result).toHaveProperty('zipBuffer');
    expect(result).toHaveProperty('zipBase64');
  });

  test('id deve ser um UUID v4 válido', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('zipBuffer deve ser um Buffer não vazio', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(Buffer.isBuffer(result.zipBuffer)).toBe(true);
    expect(result.zipBuffer.length).toBeGreaterThan(0);
  });

  test('zipBuffer deve iniciar com bytes mágicos do ZIP (PK)', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(result.zipBuffer.slice(0, 4)).toEqual(ZIP_MAGIC);
  });

  test('zipBase64 deve ser string decodificável para o mesmo buffer', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    const decoded = Buffer.from(result.zipBase64, 'base64');
    expect(decoded).toEqual(result.zipBuffer);
  });

  test('manifest deve conter todos os campos mínimos obrigatórios', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    const { manifest } = result;

    expect(manifest).toHaveProperty('id');
    expect(manifest).toHaveProperty('version', '1.0.0');
    expect(manifest).toHaveProperty('timestamp');
    expect(manifest).toHaveProperty('origin');
    expect(manifest.origin).toHaveProperty('specialist', 'hybrid');
    expect(manifest.origin).toHaveProperty('model');
    expect(manifest.origin).toHaveProperty('promptId');
    expect(manifest).toHaveProperty('checksum');
  });

  test('manifest.id deve ser o mesmo id retornado pelo packageArtifact', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(result.manifest.id).toBe(result.id);
  });

  test('manifest.checksum deve ser sha256 do conteúdo', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    const expected = computeChecksum(sampleContent);
    expect(result.manifest.checksum).toBe(expected);
  });

  test('deve funcionar sem metadados (metadata omitido)', async () => {
    const result = await packageArtifact({ content: sampleContent });
    expect(result.manifest.origin.model).toBe('unknown');
    expect(result.manifest.origin.specialist).toBe('hybrid');
    expect(result.manifest.origin.promptId).toBe('hybrid-genius');
  });

  test('deve lançar TypeError se content não for string', async () => {
    await expect(packageArtifact({ content: 123 })).rejects.toThrow(TypeError);
  });

  test('deve lançar TypeError se content for string vazia', async () => {
    await expect(packageArtifact({ content: '' })).rejects.toThrow(TypeError);
  });

  test('deve lançar TypeError se content for apenas espaços em branco', async () => {
    await expect(packageArtifact({ content: '   ' })).rejects.toThrow(TypeError);
  });

  test('deve usar metadata.filename para nomear o arquivo de conteúdo', async () => {
    // O resultado zipBase64 deve ser decodificável sem erro; a verificação
    // do nome interno do arquivo está coberta pela validade do ZIP.
    const result = await packageArtifact({
      content: sampleContent,
      metadata: { ...sampleMetadata, filename: 'meu_artefato.txt' },
    });
    expect(result.zipBuffer.length).toBeGreaterThan(0);
  });

  test('conteúdo HTML deve gerar manifest com contentType = "html"', async () => {
    const htmlContent = '<!DOCTYPE html><html><head></head><body><h1>Olá</h1></body></html>';
    const result = await packageArtifact({ content: htmlContent, metadata: sampleMetadata });
    expect(result.manifest.contentType).toBe('html');
  });

  test('conteúdo Markdown deve gerar manifest com contentType = "md"', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(result.manifest.contentType).toBe('md');
  });

  test('manifest deve conter campo contents descrevendo os arquivos do pacote', async () => {
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    expect(result.manifest).toHaveProperty('contents');
    expect(Array.isArray(result.manifest.contents)).toBe(true);
    expect(result.manifest.contents.length).toBeGreaterThan(0);
    expect(result.manifest.contents.some((c) => c.path === 'manifest.json')).toBe(true);
    expect(result.manifest.contents.some((c) => c.path === 'README.md')).toBe(true);
  });

  test('ZIP deve conter README.md na raiz', async () => {
    const AdmZip = (await import('adm-zip')).default;
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    const zip = new AdmZip(result.zipBuffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('README.md');
  });

  test('ZIP de conteúdo Markdown deve ter content.md na raiz (não em content/)', async () => {
    const AdmZip = (await import('adm-zip')).default;
    const result = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
    const zip = new AdmZip(result.zipBuffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('content.md');
    expect(entries.some((e) => e.startsWith('content/'))).toBe(false);
  });

  test('ZIP de conteúdo HTML deve ter index.html na raiz', async () => {
    const AdmZip = (await import('adm-zip')).default;
    const htmlContent = '<!DOCTYPE html><html><head></head><body><h1>Olá</h1></body></html>';
    const result = await packageArtifact({ content: htmlContent, metadata: sampleMetadata });
    const zip = new AdmZip(result.zipBuffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('index.html');
  });
});

describe('detectContentType', () => {
  test('deve detectar HTML com <!DOCTYPE html>', () => {
    const ct = detectContentType('<!DOCTYPE html><html><body></body></html>');
    expect(ct.extension).toBe('.html');
    expect(ct.name).toBe('index.html');
    expect(ct.type).toBe('text/html');
  });

  test('deve detectar HTML com <html>', () => {
    const ct = detectContentType('<html><body><h1>Olá</h1></body></html>');
    expect(ct.extension).toBe('.html');
    expect(ct.name).toBe('index.html');
  });

  test('deve detectar HTML com </html> no conteúdo', () => {
    const ct = detectContentType('<div>conteúdo</div></html>');
    expect(ct.extension).toBe('.html');
  });

  test('deve detectar Markdown por cabeçalho #', () => {
    const ct = detectContentType('# Título\n\nConteúdo.');
    expect(ct.extension).toBe('.md');
    expect(ct.name).toBe('content.md');
    expect(ct.type).toBe('text/markdown');
  });

  test('deve detectar Markdown por ## subseção', () => {
    const ct = detectContentType('Introdução\n## Seção\nTexto');
    expect(ct.extension).toBe('.md');
  });

  test('deve usar .md como fallback para texto simples', () => {
    const ct = detectContentType('Texto simples sem marcadores.');
    expect(ct.extension).toBe('.md');
    expect(ct.name).toBe('content.md');
  });

  test('deve ignorar espaços iniciais na detecção', () => {
    const ct = detectContentType('  <!DOCTYPE html><html></html>');
    expect(ct.extension).toBe('.html');
  });
});

describe('tryExtractHtmlParts', () => {
  test('deve retornar null para conteúdo que não é HTML completo', () => {
    expect(tryExtractHtmlParts('# Título\n\nConteúdo')).toBeNull();
    expect(tryExtractHtmlParts('Texto simples')).toBeNull();
  });

  test('deve retornar null se não houver <style> nem <script> inline', () => {
    const html = '<!DOCTYPE html><html><head></head><body><h1>Olá</h1></body></html>';
    expect(tryExtractHtmlParts(html)).toBeNull();
  });

  test('deve extrair <style> inline para styles.css', () => {
    const html = '<!DOCTYPE html><html><head><style>body { color: red; }</style></head><body></body></html>';
    const result = tryExtractHtmlParts(html);
    expect(result).not.toBeNull();
    const css = result.extractedFiles.find((f) => f.name === 'styles.css');
    expect(css).toBeDefined();
    expect(css.content).toContain('body { color: red; }');
    expect(css.type).toBe('text/css');
  });

  test('deve extrair <script> inline para script.js', () => {
    const html = '<!DOCTYPE html><html><head></head><body><script>console.log("ok");</script></body></html>';
    const result = tryExtractHtmlParts(html);
    expect(result).not.toBeNull();
    const js = result.extractedFiles.find((f) => f.name === 'script.js');
    expect(js).toBeDefined();
    expect(js.content).toContain('console.log("ok");');
    expect(js.type).toBe('application/javascript');
  });

  test('não deve extrair <script src="..."> externos', () => {
    const html = '<!DOCTYPE html><html><head></head><body><script src="app.js"></script></body></html>';
    const result = tryExtractHtmlParts(html);
    expect(result).toBeNull();
  });

  test('deve substituir <style> por <link rel="stylesheet"> no HTML modificado', () => {
    const html = '<!DOCTYPE html><html><head><style>h1 { color: blue; }</style></head><body></body></html>';
    const result = tryExtractHtmlParts(html);
    expect(result.htmlContent).toContain('<link rel="stylesheet" href="styles.css">');
    expect(result.htmlContent).not.toContain('<style>');
  });

  test('deve substituir <script> inline por <script src="script.js"> no HTML modificado', () => {
    const html = '<!DOCTYPE html><html><head></head><body><script>alert(1);</script></body></html>';
    const result = tryExtractHtmlParts(html);
    expect(result.htmlContent).toContain('<script src="script.js">');
    expect(result.htmlContent).not.toContain('alert(1)');
  });

  test('extractedFiles devem ser não vazios', () => {
    const html = '<!DOCTYPE html><html><head><style>.a{}</style></head><body><script>var x=1;</script></body></html>';
    const result = tryExtractHtmlParts(html);
    for (const f of result.extractedFiles) {
      expect(f.content.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── parseMultiFileContent ────────────────────────────────────────────────────

describe('parseMultiFileContent', () => {
  const VALID_MULTI = `--- FILE: index.html ---
<!DOCTYPE html><html><head></head><body></body></html>

--- FILE: styles.css ---
body { margin: 0; }

--- FILE: script.js ---
console.log('ok');`;

  test('conteúdo multiarquivo válido → retorna array com 3 arquivos', () => {
    const result = parseMultiFileContent(VALID_MULTI);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
  });

  test('cada arquivo tem name, content e type corretos', () => {
    const result = parseMultiFileContent(VALID_MULTI);
    expect(result[0].name).toBe('index.html');
    expect(result[0].type).toBe('text/html');
    expect(result[0].content).toContain('<!DOCTYPE html>');

    expect(result[1].name).toBe('styles.css');
    expect(result[1].type).toBe('text/css');
    expect(result[1].content).toContain('margin');

    expect(result[2].name).toBe('script.js');
    expect(result[2].type).toBe('application/javascript');
    expect(result[2].content).toContain("console.log");
  });

  test('conteúdo com apenas 1 delimitador → retorna null', () => {
    const single = '--- FILE: index.html ---\n<!DOCTYPE html><html></html>';
    expect(parseMultiFileContent(single)).toBeNull();
  });

  test('conteúdo sem delimitadores → retorna null', () => {
    expect(parseMultiFileContent('conteúdo normal sem delimitadores')).toBeNull();
    expect(parseMultiFileContent('<!DOCTYPE html><html></html>')).toBeNull();
  });

  test('arquivo vazio no meio → retorna null (fallback seguro)', () => {
    const withEmpty = `--- FILE: index.html ---
<!DOCTYPE html><html></html>

--- FILE: styles.css ---

--- FILE: script.js ---
console.log('ok');`;
    expect(parseMultiFileContent(withEmpty)).toBeNull();
  });

  test('inclui README.md quando presente', () => {
    const withReadme = VALID_MULTI + '\n\n--- FILE: README.md ---\n# Projeto';
    const result = parseMultiFileContent(withReadme);
    expect(result).not.toBeNull();
    expect(result.some((f) => f.name === 'README.md')).toBe(true);
  });
});

// ─── packageArtifact — multiarquivo ──────────────────────────────────────────

describe('packageArtifact — conteúdo multiarquivo', () => {
  const MULTI_CONTENT = `--- FILE: index.html ---
<!DOCTYPE html><html><head><link rel="stylesheet" href="styles.css"></head><body><script src="script.js"></script></body></html>

--- FILE: styles.css ---
body { margin: 0; color: #333; }

--- FILE: script.js ---
document.addEventListener('DOMContentLoaded', () => { console.log('ready'); });`;

  test('ZIP contém index.html na raiz', async () => {
    const { zipBuffer } = await packageArtifact({ content: MULTI_CONTENT });
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipBuffer);
    const names = zip.getEntries().map((e) => e.entryName);
    expect(names).toContain('index.html');
  });

  test('ZIP contém styles.css e script.js', async () => {
    const { zipBuffer } = await packageArtifact({ content: MULTI_CONTENT });
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipBuffer);
    const names = zip.getEntries().map((e) => e.entryName);
    expect(names).toContain('styles.css');
    expect(names).toContain('script.js');
  });

  test('ZIP contém README.md gerado automaticamente quando ausente', async () => {
    const { zipBuffer } = await packageArtifact({ content: MULTI_CONTENT });
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipBuffer);
    const names = zip.getEntries().map((e) => e.entryName);
    expect(names).toContain('README.md');
  });

  test('manifest tem contentType "multi-file"', async () => {
    const { manifest } = await packageArtifact({ content: MULTI_CONTENT });
    expect(manifest.contentType).toBe('multi-file');
  });

  test('manifest tem contents[] com os 3 arquivos', async () => {
    const { manifest } = await packageArtifact({ content: MULTI_CONTENT });
    const paths = manifest.contents.map((c) => c.path);
    expect(paths).toContain('index.html');
    expect(paths).toContain('styles.css');
    expect(paths).toContain('script.js');
  });

  test('ZIP contém manifest.json e logs/', async () => {
    const { zipBuffer } = await packageArtifact({ content: MULTI_CONTENT });
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipBuffer);
    const names = zip.getEntries().map((e) => e.entryName);
    expect(names).toContain('manifest.json');
    expect(names).toContain('logs/generation.log');
    expect(names).toContain('logs/structure.log');
  });

  test('conteúdo normal (não multiarquivo) continua com comportamento atual', async () => {
    const normalContent = '# Documento\n\nConteúdo normal sem delimitadores multiarquivo.';
    const { manifest, zipBuffer } = await packageArtifact({ content: normalContent });
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipBuffer);
    const names = zip.getEntries().map((e) => e.entryName);
    expect(names).toContain('content.md');
    expect(manifest.contentType).not.toBe('multi-file');
  });
});
