/**
 * Testes unitários — Fase 2B: Validador de Artefatos do Construtor/Híbrido
 *
 * Valida:
 * - validateArtifact() retorna { valid, errors, warnings }
 * - artefato válido (saído de packageArtifact) é aceito sem erros
 * - erros críticos tornam valid = false
 * - avisos não críticos não bloqueiam o artefato (valid = true com warnings)
 * - separação clara entre erros e warnings
 */

import { packageArtifact } from '../artifactPackager.js';
import { validateArtifact, validateFileContent, validateMultiFileCompleteness } from '../artifactValidator.js';
import { computeChecksum } from '../artifactManifest.js';

// Bytes mágicos do formato ZIP: PK\x03\x04
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const sampleContent = '# Artefato de Teste\n\nConteúdo gerado pelo Construtor para fins de teste.';
const sampleMetadata = {
  model: { modelId: 'llama-3.3-70b' },
  provider: 'groq',
  tier: 'free',
  complexity: 'medium',
  promptId: 'hybrid-genius',
};

/** Gera um artefato real via packageArtifact() para uso nos testes. */
async function buildValidArtifact(overrides = {}) {
  const base = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
  return { ...base, ...overrides };
}

describe('validateArtifact', () => {
  // ── retorno estruturado ────────────────────────────────────────────────────
  describe('retorno estruturado', () => {
    test('deve retornar objeto com valid, errors e warnings', async () => {
      const artifact = await buildValidArtifact();
      const result = validateArtifact(artifact);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('artefato gerado por packageArtifact deve ser válido', async () => {
      const artifact = await buildValidArtifact();
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── input inválido ─────────────────────────────────────────────────────────
  describe('input inválido', () => {
    test('deve retornar valid=false para null', () => {
      const result = validateArtifact(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('deve retornar valid=false para undefined', () => {
      const result = validateArtifact(undefined);
      expect(result.valid).toBe(false);
    });

    test('deve retornar valid=false para string', () => {
      const result = validateArtifact('not an object');
      expect(result.valid).toBe(false);
    });
  });

  // ── validação de id ────────────────────────────────────────────────────────
  describe('artifact.id', () => {
    test('deve falhar se id estiver ausente', async () => {
      const artifact = await buildValidArtifact({ id: undefined });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('artifact.id'))).toBe(true);
    });

    test('deve falhar se id não for UUID v4', async () => {
      const artifact = await buildValidArtifact({ id: 'not-a-uuid' });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('UUID v4'))).toBe(true);
    });

    test('deve aceitar UUID v4 válido', async () => {
      const artifact = await buildValidArtifact();
      expect(artifact.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      const result = validateArtifact(artifact);
      expect(result.errors.some((e) => e.includes('artifact.id'))).toBe(false);
    });
  });

  // ── validação de zipBuffer ────────────────────────────────────────────────
  describe('artifact.zipBuffer', () => {
    test('deve falhar se zipBuffer estiver ausente', async () => {
      const artifact = await buildValidArtifact({ zipBuffer: undefined });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('zipBuffer'))).toBe(true);
    });

    test('deve falhar se zipBuffer não for um Buffer', async () => {
      const artifact = await buildValidArtifact({ zipBuffer: 'not-a-buffer' });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('zipBuffer must be a Buffer'))).toBe(true);
    });

    test('deve falhar se zipBuffer estiver vazio', async () => {
      const artifact = await buildValidArtifact({ zipBuffer: Buffer.alloc(0) });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('zipBuffer must not be empty'))).toBe(true);
    });

    test('deve falhar se zipBuffer não iniciar com bytes mágicos do ZIP', async () => {
      const artifact = await buildValidArtifact({ zipBuffer: Buffer.from('not a zip file') });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('magic bytes'))).toBe(true);
    });

    test('deve aceitar zipBuffer com bytes mágicos ZIP corretos', async () => {
      const artifact = await buildValidArtifact();
      expect(artifact.zipBuffer.subarray(0, 4)).toEqual(ZIP_MAGIC);
      const result = validateArtifact(artifact);
      expect(result.errors.some((e) => e.includes('zipBuffer'))).toBe(false);
    });
  });

  // ── validação de zipBase64 ────────────────────────────────────────────────
  describe('artifact.zipBase64', () => {
    test('deve falhar se zipBase64 estiver ausente', async () => {
      const artifact = await buildValidArtifact({ zipBase64: undefined });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('zipBase64'))).toBe(true);
    });

    test('deve falhar se zipBase64 não for string', async () => {
      const artifact = await buildValidArtifact({ zipBase64: 42 });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('zipBase64'))).toBe(true);
    });
  });

  // ── validação de manifest ─────────────────────────────────────────────────
  describe('artifact.manifest', () => {
    test('deve falhar se manifest estiver ausente', async () => {
      const artifact = await buildValidArtifact({ manifest: undefined });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('manifest'))).toBe(true);
    });

    test('deve falhar se manifest não for objeto', async () => {
      const artifact = await buildValidArtifact({ manifest: 'not-object' });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
    });

    test('deve falhar se manifest.id não corresponder a artifact.id', async () => {
      const artifact = await buildValidArtifact();
      const tampered = { ...artifact, manifest: { ...artifact.manifest, id: 'outro-id' } };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('does not match artifact.id'))).toBe(true);
    });

    test('deve falhar se manifest.version estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const { version: _v, ...manifestSemVersion } = artifact.manifest;
      const tampered = { ...artifact, manifest: manifestSemVersion };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('manifest.version'))).toBe(true);
    });

    test('deve falhar se manifest.timestamp estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const { timestamp: _t, ...manifestSemTimestamp } = artifact.manifest;
      const tampered = { ...artifact, manifest: manifestSemTimestamp };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('manifest.timestamp'))).toBe(true);
    });

    test('deve falhar se manifest.timestamp não for ISO-8601', async () => {
      const artifact = await buildValidArtifact();
      const tampered = { ...artifact, manifest: { ...artifact.manifest, timestamp: '2026/04/01' } };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ISO-8601'))).toBe(true);
    });

    test('deve falhar se manifest.origin estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const { origin: _o, ...manifestSemOrigin } = artifact.manifest;
      const tampered = { ...artifact, manifest: manifestSemOrigin };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('manifest.origin'))).toBe(true);
    });

    test('deve falhar se manifest.origin.specialist estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const tampered = {
        ...artifact,
        manifest: { ...artifact.manifest, origin: { ...artifact.manifest.origin, specialist: undefined } },
      };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('specialist'))).toBe(true);
    });

    test('deve falhar se manifest.origin.model estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const tampered = {
        ...artifact,
        manifest: { ...artifact.manifest, origin: { ...artifact.manifest.origin, model: undefined } },
      };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('origin.model'))).toBe(true);
    });

    test('deve falhar se manifest.origin.promptId estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const tampered = {
        ...artifact,
        manifest: { ...artifact.manifest, origin: { ...artifact.manifest.origin, promptId: undefined } },
      };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('promptId'))).toBe(true);
    });

    test('deve falhar se manifest.checksum estiver ausente', async () => {
      const artifact = await buildValidArtifact();
      const { checksum: _c, ...manifestSemChecksum } = artifact.manifest;
      const tampered = { ...artifact, manifest: manifestSemChecksum };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('checksum'))).toBe(true);
    });

    test('deve falhar se manifest.checksum não estiver no formato sha256:<hex>', async () => {
      const artifact = await buildValidArtifact();
      const tampered = { ...artifact, manifest: { ...artifact.manifest, checksum: 'md5:abcdef' } };
      const result = validateArtifact(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sha256'))).toBe(true);
    });
  });

  // ── warnings não críticos ──────────────────────────────────────────────────
  describe('warnings', () => {
    test('deve emitir warning quando model é "unknown" mas manter valid=true', async () => {
      const artifact = await packageArtifact({ content: sampleContent });
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('"unknown"'))).toBe(true);
    });

    test('artefato com metadados completos não deve ter warnings de model', async () => {
      const artifact = await buildValidArtifact();
      const result = validateArtifact(artifact);
      expect(result.warnings.some((w) => w.includes('"unknown"'))).toBe(false);
    });
  });

  // ── acumulação de erros ────────────────────────────────────────────────────
  describe('acumulação de erros', () => {
    test('deve acumular múltiplos erros críticos em uma única chamada', async () => {
      const artifact = { id: 'not-uuid', manifest: null, zipBuffer: null, zipBase64: null };
      const result = validateArtifact(artifact);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

// ─── validateFileContent ──────────────────────────────────────────────────────

describe('validação de conteúdo de arquivo', () => {
  // ── arquivo vazio ──────────────────────────────────────────────────────────
  describe('arquivo vazio ou muito curto', () => {
    test('arquivo vazio → warning de conteúdo vazio', () => {
      const result = validateFileContent('app.js', '');
      expect(result.warnings.some((w) => w.includes('vazio'))).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('apenas whitespace → warning de conteúdo vazio', () => {
      const result = validateFileContent('app.js', '   \n\t  ');
      expect(result.warnings.some((w) => w.includes('vazio'))).toBe(true);
    });

    test('conteúdo menor que 10 chars → warning de conteúdo curto', () => {
      const result = validateFileContent('note.txt', 'hi');
      expect(result.warnings.some((w) => w.includes('curto'))).toBe(true);
    });
  });

  // ── .json ─────────────────────────────────────────────────────────────────
  describe('.json', () => {
    test('JSON válido → sem errors nem warnings de conteúdo', () => {
      const result = validateFileContent('config.json', '{"name": "test", "version": "1.0.0"}');
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('JSON truncado → error claro', () => {
      const result = validateFileContent('config.json', '{"name": "test"');
      expect(result.errors.some((e) => e.includes('JSON inválido'))).toBe(true);
    });

    test('JSON completamente inválido → error', () => {
      const result = validateFileContent('data.json', '{nome: sem-aspas}');
      expect(result.errors.some((e) => e.includes('JSON inválido'))).toBe(true);
    });

    test('array JSON válido → sem errors', () => {
      const result = validateFileContent('items.json', '[1, 2, 3]');
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── .js / .ts ─────────────────────────────────────────────────────────────
  describe('.js / .ts', () => {
    test('função completa → sem warnings', () => {
      const complete = `function greet(name) {\n  return 'Hello ' + name;\n}\n\nmodule.exports = { greet };`;
      const result = validateFileContent('greet.js', complete);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('função aberta (bloco não fechado) → warning de chave não fechada', () => {
      const truncated = `function foo() {`;
      const result = validateFileContent('app.js', truncated);
      expect(result.warnings.some((w) => w.includes('chave'))).toBe(true);
    });

    test('arquivo .ts com bloco aberto → warning', () => {
      const truncated = `export class MyService {\n  constructor() {`;
      const result = validateFileContent('service.ts', truncated);
      expect(result.warnings.some((w) => w.includes('chave'))).toBe(true);
    });

    test('arquivo .mjs completo → sem warnings', () => {
      const complete = `export const add = (a, b) => a + b;\nexport default add;`;
      const result = validateFileContent('utils.mjs', complete);
      expect(result.warnings).toHaveLength(0);
    });

    test('última linha terminando em "," → warning de corte abrupto', () => {
      const result = validateFileContent('config.js', 'const x = {\n  a: 1,\n  b: 2,');
      expect(result.warnings.some((w) => w.includes('corte abrupto'))).toBe(true);
    });

    test('última linha terminando em "=>" → warning de corte abrupto', () => {
      const result = validateFileContent('fn.js', 'const fn = (x) =>');
      expect(result.warnings.some((w) => w.includes('corte abrupto'))).toBe(true);
    });
  });

  // ── .html ─────────────────────────────────────────────────────────────────
  describe('.html', () => {
    test('HTML completo → sem warnings', () => {
      const complete = `<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><p>Hello</p></body>\n</html>`;
      const result = validateFileContent('index.html', complete);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('HTML sem </html> → warning', () => {
      const truncated = `<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><p>Hello</p></body>`;
      const result = validateFileContent('index.html', truncated);
      expect(result.warnings.some((w) => w.includes('</html>'))).toBe(true);
    });

    test('HTML sem </body> → warning', () => {
      const truncated = `<html>\n<head></head>\n<body><p>truncado`;
      const result = validateFileContent('index.html', truncated);
      expect(result.warnings.some((w) => w.includes('</body>'))).toBe(true);
    });

    test('HTML sem </head> → warning', () => {
      const truncated = `<html>\n<head><title>Test</title>`;
      const result = validateFileContent('index.html', truncated);
      expect(result.warnings.some((w) => w.includes('</head>'))).toBe(true);
    });

    test('HTML parcial sem tags estruturais → sem warnings de estrutura', () => {
      const partial = `<p>Parágrafo simples</p>`;
      const result = validateFileContent('snippet.html', partial);
      expect(result.warnings.filter((w) => w.includes('</html>'))).toHaveLength(0);
    });
  });

  // ── .md ───────────────────────────────────────────────────────────────────
  describe('.md', () => {
    test('Markdown completo → sem warnings', () => {
      const complete = `# Título\n\nEste é um parágrafo completo.\n\n## Seção\n\nMais conteúdo aqui.`;
      const result = validateFileContent('README.md', complete);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('termina com heading vazio "# " → warning', () => {
      const result = validateFileContent('doc.md', '# Título\n\nConteúdo.\n\n# ');
      expect(result.warnings.some((w) => w.includes('heading Markdown vazio'))).toBe(true);
    });

    test('termina com item de lista vazio "- " → warning', () => {
      const result = validateFileContent('doc.md', '# Lista\n\n- item 1\n- ');
      expect(result.warnings.some((w) => w.includes('item de lista Markdown vazio'))).toBe(true);
    });

    test('termina com item numerado vazio "1. " → warning', () => {
      const result = validateFileContent('doc.md', '# Lista\n\n1. primeiro\n1. ');
      expect(result.warnings.some((w) => w.includes('item de lista Markdown vazio'))).toBe(true);
    });

    test('fence de código aberto (sem fechamento) → warning', () => {
      const result = validateFileContent('doc.md', '# Código\n\n```javascript\nconst x = 1;');
      expect(result.warnings.some((w) => w.includes('bloco de código Markdown'))).toBe(true);
    });

    test('fence de código fechado corretamente → sem warning de fence', () => {
      const result = validateFileContent('doc.md', '# Código\n\n```javascript\nconst x = 1;\n```\n\nFim.');
      expect(result.warnings.filter((w) => w.includes('bloco de código'))).toHaveLength(0);
    });
  });
});

// ─── validateMultiFileCompleteness ───────────────────────────────────────────

describe('validateMultiFileCompleteness', () => {
  test('array vazio → sem errors nem warnings', () => {
    const result = validateMultiFileCompleteness([]);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('todos os arquivos completos → sem warnings de conteúdo', () => {
    const files = [
      { name: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head></head>\n<body><p>OK</p></body>\n</html>' },
      { name: 'styles.css', content: 'body { margin: 0; }' },
      { name: 'script.js', content: "console.log('ready');" },
    ];
    const result = validateMultiFileCompleteness(files);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('último arquivo truncado → warning especial de corte', () => {
    const files = [
      { name: 'index.html', content: '<html><head></head><body></body></html>' },
      { name: 'script.js', content: 'function init() {' },
    ];
    const result = validateMultiFileCompleteness(files);
    expect(result.warnings.some((w) => w.includes('script.js'))).toBe(true);
  });

  test('arquivo .json inválido no meio → error com nome do arquivo', () => {
    const files = [
      { name: 'config.json', content: '{"name": "test"' },
      { name: 'index.js', content: "console.log('ok');" },
    ];
    const result = validateMultiFileCompleteness(files);
    expect(result.errors.some((e) => e.includes('config.json'))).toBe(true);
  });

  test('multi-file com .json válido e .js completo → sem warnings de conteúdo', () => {
    const files = [
      { name: 'package.json', content: '{"name": "proj", "version": "1.0.0"}' },
      { name: 'index.js', content: "const x = 1;\nmodule.exports = x;" },
    ];
    const result = validateMultiFileCompleteness(files);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('último arquivo termina em "," → warning de corte abrupto no último arquivo', () => {
    const files = [
      { name: 'a.js', content: "console.log('first');" },
      { name: 'b.js', content: 'const obj = { a: 1,' },
    ];
    const result = validateMultiFileCompleteness(files);
    expect(result.warnings.some((w) => w.includes('b.js'))).toBe(true);
  });
});
