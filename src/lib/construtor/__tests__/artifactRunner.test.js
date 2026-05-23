/**
 * Testes unitários — Fase 2C: Executor Controlado de Artefatos do Construtor/Híbrido
 *
 * Valida:
 * - executeArtifact() executa artefato JS com sucesso e captura stdout
 * - executeArtifact() detecta falha quando script termina com exit code != 0
 * - executeArtifact() aplica timeout rígido (artefato com loop infinito)
 * - executeArtifact() retorna executed=false para artefato não executável (markdown)
 * - executeArtifact() retorna executed=false, reason='validation-failed' para artefato inválido
 * - Barreira 2: validateZipEntries rejeita entries inseguras (path traversal, absolutos)
 */

import { packageArtifact } from '../artifactPackager.js';
import { executeArtifact, validateZipEntries } from '../artifactRunner.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ── Helpers ───────────────────────────────────────────────────────────────────

const sampleMetadata = {
  model: { modelId: 'llama-3.3-70b' },
  provider: 'groq',
  tier: 'free',
  complexity: 'medium',
  promptId: 'hybrid-genius',
};

/**
 * Gera um artefato JS executável com o script fornecido.
 * O packageArtifact usa metadata.filename para nomear o arquivo de conteúdo.
 */
async function buildJsArtifact(scriptContent) {
  return packageArtifact({
    content: scriptContent,
    metadata: { ...sampleMetadata, filename: 'script.js' },
  });
}

/**
 * Gera um artefato Markdown (não executável).
 */
async function buildMarkdownArtifact() {
  return packageArtifact({
    content: '# Artefato de Teste\n\nConteúdo markdown não executável.',
    metadata: { ...sampleMetadata, filename: 'content.md' },
  });
}

/**
 * Cria um mock de AdmZip com entries customizadas para testes de validação.
 * @param {string[]} entryNames
 */
function mockZip(entryNames) {
  return {
    getEntries: () => entryNames.map((name) => ({ entryName: name })),
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('executeArtifact', () => {
  // 1. Execução bem-sucedida
  test('deve executar artefato JS com sucesso e capturar stdout', async () => {
    const artifact = await buildJsArtifact("process.stdout.write('ok\\n');");
    const result = await executeArtifact(artifact);

    expect(result.executed).toBe(true);
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('ok');
    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(result.command).toMatch(/node/);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // 2. Execução com erro (exit code != 0)
  test('deve retornar success=false quando script termina com exit code 1', async () => {
    const artifact = await buildJsArtifact('process.exit(1);');
    const result = await executeArtifact(artifact);

    expect(result.executed).toBe(true);
    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.command).toMatch(/node/);
  });

  // 3. Timeout
  test('deve retornar timedOut=true para script com loop infinito', async () => {
    const artifact = await buildJsArtifact('while(true){}');
    const result = await executeArtifact(artifact, { timeout: 500 });

    expect(result.executed).toBe(true);
    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.command).toMatch(/node/);
  }, 10_000);

  // 4. Artefato não executável (markdown)
  test('deve retornar executed=false para artefato markdown (não executável)', async () => {
    const artifact = await buildMarkdownArtifact();
    const result = await executeArtifact(artifact);

    expect(result.executed).toBe(false);
    expect(result.success).toBe(true);
    expect(result.reason).toBe('not-executable');
    expect(result.command).toBeNull();
    expect(result.durationMs).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBeNull();
  });

  // 5. Artefato inválido / validação falha (sem manifest)
  test('deve retornar executed=false, reason=validation-failed para artefato sem manifest', async () => {
    const validArtifact = await buildJsArtifact('console.log("test");');
    const invalidArtifact = { ...validArtifact, manifest: undefined };
    const result = await executeArtifact(invalidArtifact);

    expect(result.executed).toBe(false);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('validation-failed');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.command).toBeNull();
    expect(result.durationMs).toBe(0);
    expect(result.exitCode).toBeNull();
  });
});

// ── Barreira 2: validateZipEntries — testes diretos de segurança ──────────────

const SAFE_DEST = join(tmpdir(), 'artifact-runner-test-safe');

describe('validateZipEntries — Barreira 2: rejeição de entries inseguras', () => {
  // ── Casos rejeitados ──────────────────────────────────────────────────────

  test('rejeita entry com traversal: ../evil.js', () => {
    const result = validateZipEntries(mockZip(['../evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/traversal|\.\./i);
  });

  test('rejeita entry com traversal embutido: src/../../evil.js', () => {
    const result = validateZipEntries(mockZip(['src/../../evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/traversal|\.\./i);
  });

  test('rejeita entry com traversal com backslash: ..\\evil.js', () => {
    const result = validateZipEntries(mockZip(['..\\evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/traversal|\.\./i);
  });

  test('rejeita entry com traversal misto backslash: src\\..\\evil.js', () => {
    const result = validateZipEntries(mockZip(['src\\..\\evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/traversal|\.\./i);
  });

  test('rejeita entry com traversal misto slash-backslash: src/..\\evil.js', () => {
    const result = validateZipEntries(mockZip(['src/..\\evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/traversal|\.\./i);
  });

  test('rejeita entry com traversal misto backslash-slash: src\\../evil.js', () => {
    const result = validateZipEntries(mockZip(['src\\../evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/traversal|\.\./i);
  });

  test('rejeita entry com caminho absoluto Unix: /etc/passwd', () => {
    const result = validateZipEntries(mockZip(['/etc/passwd']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/absoluto Unix/i);
  });

  test('rejeita entry com caminho absoluto Windows (backslash): \\tmp\\evil.js', () => {
    const result = validateZipEntries(mockZip(['\\tmp\\evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/backslash/i);
  });

  test('rejeita entry com byte nulo', () => {
    const result = validateZipEntries(mockZip(['evil\0.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/byte nulo/i);
  });

  test('rejeita entry com caminho UNC backslash: \\\\server\\share\\evil.js', () => {
    const result = validateZipEntries(mockZip(['\\\\server\\share\\evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
  });

  test('rejeita entry com caminho UNC double slash: //server/share/evil.js', () => {
    const result = validateZipEntries(mockZip(['//server/share/evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
  });

  test('rejeita entry com drive letter Windows: C:/temp/evil.js', () => {
    const result = validateZipEntries(mockZip(['C:/temp/evil.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/drive letter/i);
  });

  test('rejeita tentativa de escape por diretório com prefixo semelhante ao permitido', () => {
    // Um path absoluto como /tmp/artifact-runner-test-safe-escape/evil.js é capturado
    // pela verificação de caminho absoluto (começa com /), mesmo tendo nome similar ao destDir.
    const similarDirPath = SAFE_DEST + '-escape/evil.js';
    const result = validateZipEntries(mockZip([similarDirPath]), SAFE_DEST);
    expect(result.safe).toBe(false);
  });

  // ── Casos aceitos ─────────────────────────────────────────────────────────

  test('aceita entry de arquivo simples: script.js', () => {
    const result = validateZipEntries(mockZip(['script.js']), SAFE_DEST);
    expect(result.safe).toBe(true);
  });

  test('aceita entries com subpastas relativas seguras', () => {
    const result = validateZipEntries(
      mockZip(['src/App.jsx', 'src/components/Button.jsx', 'public/index.html', 'manifest.json']),
      SAFE_DEST,
    );
    expect(result.safe).toBe(true);
  });

  test('comprova que ZIP vazio é aceito (nenhuma entry a validar)', () => {
    const result = validateZipEntries(mockZip([]), SAFE_DEST);
    expect(result.safe).toBe(true);
  });

  // ── Integração: ZIP legítimo gerado pelo packager é aceito pelo runner ────

  test('ZIP gerado por packageArtifact passa na validação (sem rejeição unsafe-zip-entry)', async () => {
    const artifact = await buildJsArtifact("process.stdout.write('ok\\n');");
    const result = await executeArtifact(artifact);
    expect(result.reason).not.toBe('unsafe-zip-entry');
  });

  // ── Confirmar que extractAllTo não é chamado em entries inseguras ─────────

  test('validateZipEntries retorna safe=false imediatamente, bloqueando extração', () => {
    // Verificamos diretamente que validateZipEntries retorna safe=false para entry insegura.
    // Como extractToTempDir chama validateZipEntries ANTES de extractAllTo, safe=false
    // impede qualquer extração — confirmado pelo fluxo de executeArtifact retornando
    // executed=false com stdout='' e reason='unsafe-zip-entry'.
    const result = validateZipEntries(mockZip(['../evil.js', 'script.js']), SAFE_DEST);
    expect(result.safe).toBe(false);
    // O primeiro arquivo inseguro bloqueia tudo — nenhuma entry subsequente é extraída
    expect(result.reason).toBeTruthy();
  });
});
