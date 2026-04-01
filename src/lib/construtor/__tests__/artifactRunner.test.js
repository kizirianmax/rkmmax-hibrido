/**
 * Testes unitários — Fase 2C: Executor Controlado de Artefatos do Construtor/Híbrido
 *
 * Valida:
 * - executeArtifact() executa artefato JS com sucesso e captura stdout
 * - executeArtifact() detecta falha quando script termina com exit code != 0
 * - executeArtifact() aplica timeout rígido (artefato com loop infinito)
 * - executeArtifact() retorna executed=false para artefato não executável (markdown)
 * - executeArtifact() retorna executed=false, reason='validation-failed' para artefato inválido
 */

import { packageArtifact } from '../artifactPackager.js';
import { executeArtifact } from '../artifactRunner.js';

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
