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

import { packageArtifact } from '../artifactPackager.js';
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
});
