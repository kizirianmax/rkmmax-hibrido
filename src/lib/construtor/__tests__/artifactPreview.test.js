/**
 * Testes unitários — Fase 2D: Preview e Refinamento do Construtor/Híbrido
 *
 * Valida:
 * - generatePreview() retorna objeto com campos esperados
 * - generatePreview() com validação inválida mostra errorCount > 0
 * - generatePreview() com execução mostra dados de execução
 * - generatePreview() sem execução (markdown) mostra execution: null
 * - generatePreview() para input inválido retorna previewAvailable: false
 * - applyDecision() muda decision para "approved"
 * - applyDecision() muda decision para "rejected" com feedback
 * - applyDecision() preserva o summary original
 * - applyDecision() lança TypeError para decision inválida
 */

import { packageArtifact } from '../artifactPackager.js';
import { validateArtifact } from '../artifactValidator.js';
import { generatePreview, applyDecision } from '../artifactPreview.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const sampleContent = '# Artefato de Teste\n\nConteúdo gerado pelo Construtor para fins de teste.';
const sampleMetadata = {
  model: { modelId: 'llama-3.3-70b' },
  provider: 'groq',
  tier: 'free',
  complexity: 'medium',
  promptId: 'hybrid-genius',
};

async function buildValidArtifact(overrides = {}) {
  const base = await packageArtifact({ content: sampleContent, metadata: sampleMetadata });
  return { ...base, ...overrides };
}

// ── generatePreview ───────────────────────────────────────────────────────────

describe('generatePreview', () => {
  describe('retorno estruturado', () => {
    test('deve retornar objeto com campos esperados', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = validateArtifact(artifact);
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview).toHaveProperty('previewAvailable', true);
      expect(preview).toHaveProperty('summary');
      expect(preview).toHaveProperty('decision', 'pending');
      expect(preview).toHaveProperty('feedback', null);
      expect(preview).toHaveProperty('decisionTimestamp', null);
    });

    test('summary deve conter id, version, timestamp, origin, validation, files, contentPreview', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = validateArtifact(artifact);
      const preview = generatePreview(artifact, validationResult, null);
      const { summary } = preview;

      expect(summary).toHaveProperty('id', artifact.id);
      expect(summary).toHaveProperty('version', '1.0.0');
      expect(typeof summary.timestamp).toBe('string');
      expect(summary).toHaveProperty('origin');
      expect(summary.origin).toHaveProperty('specialist', 'hybrid');
      expect(summary).toHaveProperty('validation');
      expect(summary).toHaveProperty('files');
      expect(Array.isArray(summary.files)).toBe(true);
      expect(typeof summary.contentPreview).toBe('string');
    });
  });

  describe('validação inválida', () => {
    test('deve refletir errorCount > 0 quando validação tem erros', async () => {
      const validationResult = {
        valid: false,
        errors: ['manifest is required', 'id is required'],
        warnings: [],
      };

      const artifact = await buildValidArtifact();
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.validation.valid).toBe(false);
      expect(preview.summary.validation.errorCount).toBe(2);
      expect(preview.summary.validation.warningCount).toBe(0);
    });

    test('deve refletir warningCount quando validação tem avisos', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = {
        valid: true,
        errors: [],
        warnings: ['checksum mismatch warning'],
      };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.validation.valid).toBe(true);
      expect(preview.summary.validation.errorCount).toBe(0);
      expect(preview.summary.validation.warningCount).toBe(1);
    });
  });

  describe('execução', () => {
    test('deve incluir dados de execução quando executionResult é fornecido', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = validateArtifact(artifact);
      const executionResult = {
        executed: true,
        success: true,
        timedOut: false,
        durationMs: 123,
      };

      const preview = generatePreview(artifact, validationResult, executionResult);

      expect(preview.summary.execution).not.toBeNull();
      expect(preview.summary.execution.executed).toBe(true);
      expect(preview.summary.execution.success).toBe(true);
      expect(preview.summary.execution.timedOut).toBe(false);
      expect(preview.summary.execution.durationMs).toBe(123);
    });

    test('deve retornar execution: null quando executionResult não é fornecido (markdown)', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = validateArtifact(artifact);
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.execution).toBeNull();
    });

    test('deve refletir executed: false para artefato não executável', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = validateArtifact(artifact);
      const executionResult = {
        executed: false,
        success: true,
        timedOut: false,
        durationMs: 0,
      };

      const preview = generatePreview(artifact, validationResult, executionResult);

      expect(preview.summary.execution.executed).toBe(false);
    });
  });

  describe('files e contentPreview', () => {
    test('deve listar arquivos extraídos do ZIP', async () => {
      const artifact = await buildValidArtifact();
      const preview = generatePreview(artifact, null, null);

      expect(preview.summary.files.length).toBeGreaterThan(0);
      const paths = preview.summary.files.map((f) => f.path);
      expect(paths.some((p) => p.startsWith('content/'))).toBe(true);
      expect(paths.some((p) => p === 'manifest.json')).toBe(true);
    });

    test('contentPreview deve conter os primeiros chars do conteúdo', async () => {
      const artifact = await buildValidArtifact();
      const preview = generatePreview(artifact, null, null);

      expect(preview.summary.contentPreview).toContain('Artefato de Teste');
    });

    test('contentPreview deve ter no máximo 500 caracteres', async () => {
      const longContent = 'A'.repeat(2000);
      const artifact = await packageArtifact({ content: longContent, metadata: sampleMetadata });
      const preview = generatePreview(artifact, null, null);

      expect(preview.summary.contentPreview.length).toBeLessThanOrEqual(500);
    });
  });

  describe('input inválido', () => {
    test('deve retornar previewAvailable: false para null', () => {
      const preview = generatePreview(null, null, null);
      expect(preview.previewAvailable).toBe(false);
      expect(preview.summary).toBeNull();
    });

    test('deve retornar previewAvailable: false para undefined', () => {
      const preview = generatePreview(undefined, null, null);
      expect(preview.previewAvailable).toBe(false);
    });
  });
});

// ── applyDecision ─────────────────────────────────────────────────────────────

describe('applyDecision', () => {
  let basePreview;

  beforeEach(async () => {
    const artifact = await buildValidArtifact();
    const validationResult = validateArtifact(artifact);
    basePreview = generatePreview(artifact, validationResult, null);
  });

  test('deve mudar decision para "approved"', () => {
    const updated = applyDecision(basePreview, 'approved');
    expect(updated.decision).toBe('approved');
  });

  test('deve mudar decision para "rejected" com feedback', () => {
    const updated = applyDecision(basePreview, 'rejected', 'Conteúdo incompleto');
    expect(updated.decision).toBe('rejected');
    expect(updated.feedback).toBe('Conteúdo incompleto');
  });

  test('deve registrar decisionTimestamp como string ISO', () => {
    const updated = applyDecision(basePreview, 'approved');
    expect(typeof updated.decisionTimestamp).toBe('string');
    expect(() => new Date(updated.decisionTimestamp)).not.toThrow();
  });

  test('deve preservar o summary original intacto', () => {
    const updated = applyDecision(basePreview, 'approved');
    expect(updated.summary).toEqual(basePreview.summary);
  });

  test('deve preservar previewAvailable original', () => {
    const updated = applyDecision(basePreview, 'approved');
    expect(updated.previewAvailable).toBe(basePreview.previewAvailable);
  });

  test('deve lançar TypeError para decision inválida', () => {
    expect(() => applyDecision(basePreview, 'unknown')).toThrow(TypeError);
  });

  test('deve lançar TypeError para previewObj nulo', () => {
    expect(() => applyDecision(null, 'approved')).toThrow(TypeError);
  });

  test('feedback deve ser null quando não fornecido', () => {
    const updated = applyDecision(basePreview, 'approved');
    expect(updated.feedback).toBeNull();
  });
});
