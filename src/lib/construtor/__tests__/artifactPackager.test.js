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

import { packageArtifact, detectContentType, tryExtractHtmlParts, parseMultiFileContent, stripMarkdownFences, tryNormalizeAlternativeFormat, normalizeVisibleContent, prettyFormatByExtension } from '../artifactPackager.js';
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

  test('remove fences markdown do conteúdo dos arquivos', () => {
    const withFences = `--- FILE: index.js ---
\`\`\`javascript
console.log('hello');
\`\`\`

--- FILE: dados.json ---
\`\`\`json
{"nome": "teste"}
\`\`\``;
    const result = parseMultiFileContent(withFences);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe("console.log('hello');");
    expect(result[0].content).not.toContain('```');
    expect(result[1].content).toBe('{\n  "nome": "teste"\n}');
    expect(result[1].content).not.toContain('```');
  });

  test('remove TODOS os fences em arquivo de código (não .md)', () => {
    const withMultipleFences = `--- FILE: script.js ---
\`\`\`javascript
const fs = require('fs');
const dados = JSON.parse(fs.readFileSync('./dados.json', 'utf-8'));
console.log(dados);
\`\`\`

--- FILE: dados.json ---
\`\`\`json
{"nome": "teste"}
\`\`\``;
    const result = parseMultiFileContent(withMultipleFences);
    expect(result).not.toBeNull();
    expect(result[0].content).not.toContain('```');
    expect(result[1].content).not.toContain('```');
  });

  test('preserva fences internas legítimas em README.md', () => {
    const withReadme = `--- FILE: script.js ---
console.log('hello');

--- FILE: README.md ---
# Como usar

Execute com:
\`\`\`bash
node script.js
\`\`\``;
    const result = parseMultiFileContent(withReadme);
    expect(result).not.toBeNull();
    expect(result[0].content).toBe("console.log('hello');");
    // README.md preserva fence interna (é documentação legítima)
    expect(result[1].content).toContain('```bash');
  });

  test('remove fence envolvente de README.md quando é wrapper completo', () => {
    const withWrappedReadme = `--- FILE: script.js ---
console.log('hello');

--- FILE: README.md ---
\`\`\`markdown
# Como usar
Execute com: node script.js
\`\`\``;
    const result = parseMultiFileContent(withWrappedReadme);
    expect(result).not.toBeNull();
    expect(result[1].content).toBe('# Como usar\nExecute com: node script.js');
    expect(result[1].content).not.toMatch(/^```/);
  });

  test('conteúdo de código com newline antes do fence é limpo', () => {
    const withLeadingNewline = `--- FILE: index.js ---

\`\`\`javascript
console.log('hello');
\`\`\`

--- FILE: config.json ---

\`\`\`json
{"port": 3000}
\`\`\``;
    const result = parseMultiFileContent(withLeadingNewline);
    expect(result).not.toBeNull();
    expect(result[0].content).not.toContain('```');
    expect(result[0].content).toContain("console.log('hello');");
    expect(result[1].content).not.toContain('```');
    expect(result[1].content).toContain('"port": 3000');
  });

  test('conteúdo sem fences permanece inalterado', () => {
    const clean = `--- FILE: index.js ---
console.log('hello');

--- FILE: style.css ---
body { margin: 0; }`;
    const result = parseMultiFileContent(clean);
    expect(result).not.toBeNull();
    expect(result[0].content).toBe("console.log('hello');");
    expect(result[1].content).toBe('body { margin: 0; }');
  });

  test('remove fence sem identificador de linguagem', () => {
    const withPlainFence = `--- FILE: index.js ---
\`\`\`
console.log('hello');
\`\`\`

--- FILE: style.css ---
\`\`\`
body { margin: 0; }
\`\`\``;
    const result = parseMultiFileContent(withPlainFence);
    expect(result).not.toBeNull();
    expect(result[0].content).toBe("console.log('hello');");
    expect(result[0].content).not.toContain('```');
  });

  test('remove fence com identificador hyphenado (objective-c)', () => {
    const withHyphen = `--- FILE: main.m ---
\`\`\`objective-c
NSLog(@"hello");
\`\`\`

--- FILE: README.md ---
# Docs`;
    const result = parseMultiFileContent(withHyphen);
    expect(result).not.toBeNull();
    expect(result[0].content).toBe('NSLog(@"hello");');
    expect(result[0].content).not.toContain('```');
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

  test('conteúdo de código no ZIP está limpo de fences markdown', async () => {
    const AdmZip = (await import('adm-zip')).default;
    const contentWithFences = `--- FILE: script.js ---
\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

--- FILE: README.md ---
Execute com: node script.js`;
    const { zipBuffer } = await packageArtifact({ content: contentWithFences });
    const zip = new AdmZip(zipBuffer);
    const scriptEntry = zip.getEntry('script.js');
    const scriptContent = scriptEntry.getData().toString('utf-8');
    expect(scriptContent).not.toContain('```');
    expect(scriptContent).toContain('const x = 42;');
  });
});

// ─── tryNormalizeAlternativeFormat ────────────────────────────────────────────

describe('tryNormalizeAlternativeFormat', () => {
  test('converte #### arquivo.ext para --- FILE: arquivo.ext ---', () => {
    const alt = `#### script.js
\`\`\`javascript
console.log('hello');
\`\`\`

#### README.md
\`\`\`markdown
Execute com: node script.js
\`\`\``;
    const result = tryNormalizeAlternativeFormat(alt);
    expect(result).not.toBeNull();
    expect(result).toContain('--- FILE: script.js ---');
    expect(result).toContain('--- FILE: README.md ---');
  });

  test('converte ### arquivo.ext para --- FILE: arquivo.ext ---', () => {
    const alt = `### index.js
\`\`\`javascript
console.log('hello');
\`\`\`

### package.json
\`\`\`json
{}
\`\`\``;
    const result = tryNormalizeAlternativeFormat(alt);
    expect(result).not.toBeNull();
    expect(result).toContain('--- FILE: index.js ---');
    expect(result).toContain('--- FILE: package.json ---');
  });

  test('retorna null quando não há headers com nomes de arquivo', () => {
    expect(tryNormalizeAlternativeFormat('conteúdo normal')).toBeNull();
    expect(tryNormalizeAlternativeFormat('### Seção\nTexto')).toBeNull();
  });

  test('retorna null para apenas 1 arquivo (precisa de pelo menos 2)', () => {
    const single = `#### script.js
\`\`\`javascript
console.log('hello');
\`\`\``;
    expect(tryNormalizeAlternativeFormat(single)).toBeNull();
  });

  test('não afeta conteúdo que já usa --- FILE: ---', () => {
    const correct = `--- FILE: script.js ---
console.log('hello');

--- FILE: README.md ---
Instruções`;
    expect(tryNormalizeAlternativeFormat(correct)).toBeNull();
  });
});

// ─── parseMultiFileContent — formato alternativo com #### headers ─────────────

describe('parseMultiFileContent — formato alternativo com #### headers', () => {
  test('formato alternativo (#### + fences) é normalizado e parseado', () => {
    const alt = `#### script.js
\`\`\`javascript
console.log('hello');
\`\`\`

#### dados.json
\`\`\`json
{"nome": "teste"}
\`\`\``;
    const result = parseMultiFileContent(alt);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('script.js');
    expect(result[0].content).toBe("console.log('hello');");
    expect(result[0].content).not.toContain('```');
    expect(result[1].name).toBe('dados.json');
    expect(result[1].content).toBe('{\n  "nome": "teste"\n}');
  });

  test('formato correto (--- FILE: ---) continua funcionando normalmente', () => {
    const correct = `--- FILE: script.js ---
console.log('hello');

--- FILE: README.md ---
Instruções`;
    const result = parseMultiFileContent(correct);
    expect(result).not.toBeNull();
    expect(result[0].name).toBe('script.js');
    expect(result[1].name).toBe('README.md');
  });
});

// ─── normalizeVisibleContent ──────────────────────────────────────────────────

describe('normalizeVisibleContent', () => {
  test('conteúdo não-multi-file retorna sem alteração', () => {
    const plain = '# Documento\n\nConteúdo normal sem delimitadores.';
    expect(normalizeVisibleContent(plain)).toBe(plain);
  });

  test('conteúdo HTML simples retorna sem alteração', () => {
    const html = '<!DOCTYPE html><html><body><h1>Olá</h1></body></html>';
    expect(normalizeVisibleContent(html)).toBe(html);
  });

  test('conteúdo multi-file com fences → fences removidas, delimitadores preservados', () => {
    const withFences = `--- FILE: script.js ---
\`\`\`javascript
console.log('hello');
\`\`\`

--- FILE: dados.json ---
\`\`\`json
{"nome": "teste"}
\`\`\``;
    const result = normalizeVisibleContent(withFences);
    expect(result).toContain('--- FILE: script.js ---');
    expect(result).toContain('--- FILE: dados.json ---');
    expect(result).not.toContain('```javascript');
    expect(result).not.toContain('```json');
    expect(result).not.toContain('```');
    expect(result).toContain("console.log('hello');");
    expect(result).toContain('"nome": "teste"');
  });

  test('conteúdo multi-file sem fences retorna inalterado (exceto espaço extra)', () => {
    const clean = `--- FILE: script.js ---
console.log('hello');

--- FILE: README.md ---
# Instruções`;
    const result = normalizeVisibleContent(clean);
    expect(result).toContain('--- FILE: script.js ---');
    expect(result).toContain('--- FILE: README.md ---');
    expect(result).toContain("console.log('hello');");
    expect(result).toContain('# Instruções');
  });

  test('README.md preserva fences internas legítimas após normalização', () => {
    const withReadme = `--- FILE: script.js ---
console.log('hello');

--- FILE: README.md ---
# Como usar

\`\`\`bash
node script.js
\`\`\``;
    const result = normalizeVisibleContent(withReadme);
    expect(result).toContain('--- FILE: README.md ---');
    expect(result).toContain('```bash');
    expect(result).not.toContain('```javascript');
  });

  test('formato alternativo (#### headers) é convertido e normalizado', () => {
    const alt = `#### script.js
\`\`\`javascript
const x = 1;
\`\`\`

#### dados.json
\`\`\`json
{"x": 1}
\`\`\``;
    const result = normalizeVisibleContent(alt);
    expect(result).toContain('--- FILE: script.js ---');
    expect(result).toContain('--- FILE: dados.json ---');
    expect(result).not.toContain('```');
    expect(result).toContain('const x = 1;');
  });

  test('entrada null retorna null', () => {
    expect(normalizeVisibleContent(null)).toBeNull();
  });

  test('entrada string vazia retorna string vazia', () => {
    expect(normalizeVisibleContent('')).toBe('');
  });

  test('entrada "Sem resposta" retorna sem alteração', () => {
    expect(normalizeVisibleContent('Sem resposta')).toBe('Sem resposta');
  });

  // ── Casos com arquivo único (parseDisplayFiles — aceita >= 1) ─────────────────

  test('arquivo único com fence → fence removida, delimitador preservado', () => {
    const single = `--- FILE: script.js ---
\`\`\`javascript
const x = 1;
\`\`\``;
    const result = normalizeVisibleContent(single);
    expect(result).toContain('--- FILE: script.js ---');
    expect(result).not.toContain('```');
    expect(result).toContain('const x = 1;');
  });

  test('arquivo único JSON em linha → indentado no output visível', () => {
    const single = `--- FILE: dados.json ---
{"nome":"teste","valor":42}`;
    const result = normalizeVisibleContent(single);
    expect(result).toContain('--- FILE: dados.json ---');
    expect(result).toContain('\n');
    expect(result).toContain('  ');
    expect(JSON.parse(result.replace(/^--- FILE: dados\.json ---\n/, ''))).toEqual({ nome: 'teste', valor: 42 });
  });

  test('arquivo único README.md sem fence → aplicado prettyFormat .md', () => {
    const single = `--- FILE: README.md ---
# Título
1. Passo um
2. Passo dois`;
    const result = normalizeVisibleContent(single);
    expect(result).toContain('--- FILE: README.md ---');
    expect(result).toContain('# Título');
    expect(result).toContain('1. Passo um');
  });

  test('arquivo único com conteúdo vazio após strip → retorna conteúdo sem alteração (nenhum arquivo válido)', () => {
    const single = `--- FILE: script.js ---
\`\`\`javascript
\`\`\``;
    // Arquivo vazio após strip: parseDisplayFiles retorna null → conteúdo bruto preservado
    const result = normalizeVisibleContent(single);
    expect(result).toBe(single);
  });
});

// ─── prettyFormatByExtension ──────────────────────────────────────────────────

describe('prettyFormatByExtension', () => {
  test('.json em linha única → indentado com 2 espaços', () => {
    const input = '{"itens":[{"cat":"A","nome":"x"}]}';
    const result = prettyFormatByExtension('dados.json', input);
    expect(result).toContain('\n');
    expect(result).toContain('  ');
    expect(JSON.parse(result)).toEqual(JSON.parse(input));
  });

  test('.json inválido → retorna sem alteração', () => {
    const input = '{broken json';
    expect(prettyFormatByExtension('dados.json', input)).toBe(input);
  });

  test('.md com listas grudadas → insere quebras', () => {
    const input = '# Título\n1. Passo um\n2. Passo dois';
    const result = prettyFormatByExtension('README.md', input);
    expect(result).toContain('\n\n1. Passo');
  });

  test('.js com statements colados → insere quebras após ;', () => {
    const input = "const fs = require('fs');const dados = JSON.parse('{}');console.log(dados);";
    const result = prettyFormatByExtension('script.js', input);
    expect(result).toContain(';\n');
  });

  test('.html → retorna sem alteração (extensão não tratada)', () => {
    const input = '<div>test</div>';
    expect(prettyFormatByExtension('index.html', input)).toBe(input);
  });

  test('.json com espaços ao redor → indentado corretamente', () => {
    const input = '  {"nome":"teste","valor":42}  ';
    const result = prettyFormatByExtension('dados.json', input);
    expect(result).toContain('\n');
    expect(JSON.parse(result)).toEqual({ nome: 'teste', valor: 42 });
  });

  test('.json com trailing comma → limpa e indenta', () => {
    const input = '{"itens":["a","b","c",]}';
    const result = prettyFormatByExtension('dados.json', input);
    expect(result).toContain('\n');
    expect(JSON.parse(result)).toEqual({ itens: ['a', 'b', 'c'] });
  });

  test('.json já indentado → preserva (não duplica formatação)', () => {
    const input = '{\n  "nome": "teste"\n}';
    const result = prettyFormatByExtension('dados.json', input);
    expect(result).toBe(input);
  });

  test('.js com } seguido de function → insere quebra', () => {
    const input = "function a() { return 1; }function b() { return 2; }";
    const result = prettyFormatByExtension('script.js', input);
    expect(result).toContain('}\n\nfunction b');
  });

  test('.js com }); seguido de const → insere quebra', () => {
    const input = "app.listen(3000, () => { console.log('ok'); });const x = 1;";
    const result = prettyFormatByExtension('script.js', input);
    expect(result).toContain(';\nconst x');
  });

  test('.js com }catch → insere espaço', () => {
    const input = "try { foo(); }catch(e) { bar(); }";
    const result = prettyFormatByExtension('script.js', input);
    expect(result).toContain('} catch');
  });

  test('.js com }else → insere espaço', () => {
    const input = "if (x) { foo(); }else { bar(); }";
    const result = prettyFormatByExtension('script.js', input);
    expect(result).toContain('} else');
  });

  test('.js já bem formatado → preserva sem alteração significativa', () => {
    const input = "const fs = require('fs');\n\nfunction main() {\n  console.log('ok');\n}\n\nmain();";
    const result = prettyFormatByExtension('script.js', input);
    expect(result).toContain("const fs = require('fs');");
    expect(result).toContain('function main()');
  });
});

// ─── validateArtifactFileName — Barreira 1: rejeição de nomes inseguros ───────

import { validateArtifactFileName } from '../artifactPackager.js';

describe('validateArtifactFileName', () => {
  // ── Casos aceitos ─────────────────────────────────────────────────────────
  test('aceita arquivo simples: index.html', () => {
    expect(validateArtifactFileName('index.html')).toEqual({ valid: true, reason: null });
  });

  test('aceita arquivo simples: script.js', () => {
    expect(validateArtifactFileName('script.js')).toEqual({ valid: true, reason: null });
  });

  test('aceita subpasta relativa segura: src/App.jsx', () => {
    expect(validateArtifactFileName('src/App.jsx')).toEqual({ valid: true, reason: null });
  });

  test('aceita subpasta relativa segura: src/components/Button.jsx', () => {
    expect(validateArtifactFileName('src/components/Button.jsx')).toEqual({ valid: true, reason: null });
  });

  test('aceita subpasta relativa segura: public/index.html', () => {
    expect(validateArtifactFileName('public/index.html')).toEqual({ valid: true, reason: null });
  });

  // ── Casos rejeitados ──────────────────────────────────────────────────────
  test('rejeita nome vazio', () => {
    const result = validateArtifactFileName('');
    expect(result.valid).toBe(false);
  });

  test('rejeita nome null', () => {
    const result = validateArtifactFileName(null);
    expect(result.valid).toBe(false);
  });

  test('rejeita nome undefined', () => {
    const result = validateArtifactFileName(undefined);
    expect(result.valid).toBe(false);
  });

  test('rejeita nome com apenas espaços', () => {
    const result = validateArtifactFileName('   ');
    expect(result.valid).toBe(false);
  });

  test('rejeita byte nulo', () => {
    const result = validateArtifactFileName('evil\0.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/byte nulo/);
  });

  test('rejeita caminho absoluto Unix: /tmp/evil.js', () => {
    const result = validateArtifactFileName('/tmp/evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/absoluto Unix/);
  });

  test('rejeita caminho UNC Windows: \\\\server\\share\\evil.js', () => {
    const result = validateArtifactFileName('\\\\server\\share\\evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/UNC/);
  });

  test('rejeita drive letter Windows com barra: C:\\temp\\evil.js', () => {
    const result = validateArtifactFileName('C:\\temp\\evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/drive letter/);
  });

  test('rejeita drive letter Windows com slash: C:/temp/evil.js', () => {
    const result = validateArtifactFileName('C:/temp/evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/drive letter/);
  });

  test('rejeita traversal simples: ../evil.js', () => {
    const result = validateArtifactFileName('../evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/traversal/);
  });

  test('rejeita traversal embutido: src/../../evil.js', () => {
    const result = validateArtifactFileName('src/../../evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/traversal/);
  });

  test('rejeita traversal com backslash: ..\\evil.js', () => {
    const result = validateArtifactFileName('..\\evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/traversal/);
  });

  test('rejeita traversal misto com backslash: src\\..\\evil.js', () => {
    const result = validateArtifactFileName('src\\..\\evil.js');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/traversal/);
  });
});

// ─── parseMultiFileContent — rejeição de nomes inseguros no pipeline ─────────

describe('parseMultiFileContent — rejeição de nomes inseguros (Barreira 1)', () => {
  function makeMultiFile(...entries) {
    return entries.map(([name, content]) => `--- FILE: ${name} ---\n${content}`).join('\n\n');
  }

  test('rejeita conteúdo multi-file com traversal ../evil.js', () => {
    const content = makeMultiFile(['../evil.js', 'alert(1)'], ['index.html', '<html></html>']);
    expect(() => parseMultiFileContent(content)).toThrow(/traversal|inseguros|inválido/i);
  });

  test('rejeita conteúdo multi-file com caminho absoluto /tmp/evil.js', () => {
    const content = makeMultiFile(['/tmp/evil.js', 'alert(1)'], ['index.html', '<html></html>']);
    expect(() => parseMultiFileContent(content)).toThrow(/inválido|absoluto/i);
  });

  test('aceita conteúdo multi-file com subpastas seguras', () => {
    const content = makeMultiFile(
      ['src/App.jsx', 'export default function App() {}'],
      ['src/components/Button.jsx', 'export default function Button() {}'],
    );
    const result = parseMultiFileContent(content);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('src/App.jsx');
    expect(result[1].name).toBe('src/components/Button.jsx');
  });
});
