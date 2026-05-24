import { buildArtifactPipelineMetrics } from '../artifactMetrics.js';

describe('artifactMetrics', () => {
  test('deve gerar estrutura mínima determinística de métricas do pipeline', () => {
    const metrics = buildArtifactPipelineMetrics({
      phase: 'preview',
      startedAt: '2026-05-24T10:00:00.000Z',
      finishedAt: '2026-05-24T10:00:00.150Z',
      files: [{ path: 'content.md' }, { path: 'manifest.json' }],
      zipBuffer: Buffer.alloc(512),
      validationResult: { valid: false, errors: ['erro-a'], warnings: ['warn-a', 'warn-b'] },
      executionResult: { executed: false, reason: 'execution-disabled-by-security-policy' },
      timestamp: '2026-05-24T10:00:01.000Z',
    });

    expect(metrics).toEqual({
      timestamp: '2026-05-24T10:00:01.000Z',
      phase: 'preview',
      durationMs: 150,
      fileCount: 2,
      zipApproxBytes: 512,
      validationStatus: 'invalid',
      errorCount: 1,
      warningCount: 2,
      executionStatus: 'disabled-by-security-policy',
    });
  });
});
