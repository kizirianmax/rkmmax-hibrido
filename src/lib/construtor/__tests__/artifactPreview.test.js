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

import { jest } from '@jest/globals';
import { packageArtifact } from '../artifactPackager.js';
import { validateArtifact } from '../artifactValidator.js';
import { generatePreview, applyDecision } from '../artifactPreview.js';
import { computeChecksum } from '../artifactManifest.js';

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

    test('summary.validation deve conter errors e warnings como arrays quando validationResult é fornecido', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = {
        valid: false,
        errors: ['script.js: possível truncamento'],
        warnings: ['data.json: JSON inválido ou truncado'],
      };
      const preview = generatePreview(artifact, validationResult, null);

      expect(Array.isArray(preview.summary.validation.errors)).toBe(true);
      expect(Array.isArray(preview.summary.validation.warnings)).toBe(true);
      expect(preview.summary.validation.errors).toContain('script.js: possível truncamento');
      expect(preview.summary.validation.warnings).toContain('data.json: JSON inválido ou truncado');
    });

    test('summary.validation.errors e warnings devem ser arrays vazios para validação limpa', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: true, errors: [], warnings: [] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.validation.errors).toEqual([]);
      expect(preview.summary.validation.warnings).toEqual([]);
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
      // Nova estrutura: arquivo principal na raiz (content.md ou index.html)
      expect(paths.some((p) => p === 'content.md' || p === 'index.html' || p.startsWith('content/'))).toBe(true);
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

  describe('status geral', () => {
    test('summary.status.level deve ser "ok" para artefato válido sem warnings', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: true, errors: [], warnings: [] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.status.level).toBe('ok');
    });

    test('summary.status.level deve ser "attention" para artefato válido com warnings', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: true, errors: [], warnings: ['arquivo.js: possível truncamento'] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.status.level).toBe('attention');
    });

    test('summary.status.level deve ser "incomplete" para artefato inválido', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: false, errors: ['id is required'], warnings: [] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.status.level).toBe('incomplete');
    });

    test('summary.status.label deve conter texto descritivo', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: true, errors: [], warnings: [] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(typeof preview.summary.status.label).toBe('string');
      expect(preview.summary.status.label.length).toBeGreaterThan(0);
    });

    test('summary.status deve ser "ok" quando validationResult é null', async () => {
      const artifact = await buildValidArtifact();
      const preview = generatePreview(artifact, null, null);

      expect(preview.summary.status.level).toBe('ok');
    });
  });

  describe('filesSummary', () => {
    test('summary.filesSummary.totalFiles deve refletir número de arquivos no ZIP', async () => {
      const artifact = await buildValidArtifact();
      const preview = generatePreview(artifact, null, null);

      expect(typeof preview.summary.filesSummary.totalFiles).toBe('number');
      expect(preview.summary.filesSummary.totalFiles).toBe(preview.summary.files.length);
    });

    test('summary.filesSummary.fileNames deve ser array com nomes dos arquivos', async () => {
      const artifact = await buildValidArtifact();
      const preview = generatePreview(artifact, null, null);

      expect(Array.isArray(preview.summary.filesSummary.fileNames)).toBe(true);
      expect(preview.summary.filesSummary.fileNames).toEqual(
        preview.summary.files.map((f) => f.path)
      );
    });
  });

  describe('F3-02 — dados mínimos para indicador de artefato/ZIP na UI', () => {
    test('preview válido inclui arquivos e validation sem erros para estado "pronto para exportar"', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: true, errors: [], warnings: [] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.validation.valid).toBe(true);
      expect(preview.summary.validation.errorCount).toBe(0);
      expect(preview.summary.filesSummary.totalFiles).toBeGreaterThan(0);
    });

    test('preview inválido preserva erros de validação para estado "revisar antes de exportar"', async () => {
      const artifact = await buildValidArtifact();
      const validationResult = { valid: false, errors: ['manifest inválido'], warnings: [] };
      const preview = generatePreview(artifact, validationResult, null);

      expect(preview.summary.validation.valid).toBe(false);
      expect(preview.summary.validation.errorCount).toBeGreaterThan(0);
      expect(preview.summary.validation.errors).toContain('manifest inválido');
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

describe('F3-01 — pipeline mínimo do Construtor/Híbrido', () => {
  test('deve manter íntegro o fluxo empacotar → validar → preview com dados determinísticos e sem rede externa', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    try {
      const deterministicContent = '# Título\n\nConteúdo determinístico para F3-01.';
      const deterministicMetadata = {
        model: { modelId: 'llama-3.3-70b' },
        provider: 'groq',
        tier: 'free',
        complexity: 'low',
        promptId: 'hybrid-genius',
      };
      const executionDisabled = {
        executed: false,
        success: false,
        timedOut: false,
        durationMs: 0,
        reason: 'execution-disabled-by-security-policy',
      };

      const artifact = await packageArtifact({
        content: deterministicContent,
        metadata: deterministicMetadata,
      });
      const validationResult = validateArtifact(artifact);
      const preview = generatePreview(artifact, validationResult, executionDisabled);

      expect(artifact.manifest.origin.specialist).toBe('hybrid');
      expect(artifact.manifest.origin.promptId).toBe('hybrid-genius');
      expect(artifact.manifest.checksum).toBe(computeChecksum(deterministicContent));

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toEqual([]);

      expect(preview.previewAvailable).toBe(true);
      expect(preview.summary.validation.valid).toBe(true);
      expect(preview.summary.filesSummary.fileNames).toEqual(
        expect.arrayContaining(['manifest.json', 'logs/generation.log', 'logs/structure.log']),
      );
      expect(preview.summary.execution).toEqual({
        executed: false,
        success: false,
        timedOut: false,
        durationMs: 0,
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
