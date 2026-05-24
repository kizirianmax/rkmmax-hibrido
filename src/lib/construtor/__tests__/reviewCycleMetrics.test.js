import { buildReviewCycleMetrics } from '../reviewCycleMetrics.js';

describe('reviewCycleMetrics', () => {
  const FIXED_NOW = new Date('2026-05-24T12:00:00.000Z').getTime();

  it('retorna estrutura mínima determinística com histórico vazio', () => {
    const metrics = buildReviewCycleMetrics({ reviewHistory: [], cycleStartedAt: null, now: FIXED_NOW });

    expect(metrics).toEqual({
      timestamp: '2026-05-24T12:00:00.000Z',
      cycleStartedAt: null,
      cycleElapsedMs: null,
      revisionCount: 0,
      humanDecisionCount: 0,
      finalStatus: 'pending',
    });
  });

  it('conta corretamente revisões e decisões humanas', () => {
    const history = [
      { type: 'adjustment_requested', text: 'corrigir título', timestamp: '2026-05-24T11:55:00.000Z' },
      { type: 'adjustment_requested', text: 'ajustar layout', timestamp: '2026-05-24T11:57:00.000Z' },
      { type: 'approved', text: null, timestamp: '2026-05-24T11:59:00.000Z' },
    ];

    const metrics = buildReviewCycleMetrics({ reviewHistory: history, cycleStartedAt: null, now: FIXED_NOW });

    expect(metrics.revisionCount).toBe(2);
    expect(metrics.humanDecisionCount).toBe(1);
    expect(metrics.finalStatus).toBe('approved');
  });

  it('detecta status final "rejected" quando último evento é rejected', () => {
    const history = [
      { type: 'adjustment_requested', text: 'revisar', timestamp: '2026-05-24T11:55:00.000Z' },
      { type: 'rejected', text: 'não atende', timestamp: '2026-05-24T11:59:00.000Z' },
    ];

    const metrics = buildReviewCycleMetrics({ reviewHistory: history, cycleStartedAt: null, now: FIXED_NOW });

    expect(metrics.finalStatus).toBe('rejected');
    expect(metrics.humanDecisionCount).toBe(1);
  });

  it('calcula tempo aproximado do ciclo quando cycleStartedAt é fornecido', () => {
    const startedAt = FIXED_NOW - 45000; // 45 segundos antes

    const metrics = buildReviewCycleMetrics({
      reviewHistory: [],
      cycleStartedAt: startedAt,
      now: FIXED_NOW,
    });

    expect(metrics.cycleElapsedMs).toBe(45000);
    expect(metrics.cycleStartedAt).toBe(new Date(startedAt).toISOString());
  });

  it('retorna cycleElapsedMs null quando cycleStartedAt não é fornecido', () => {
    const metrics = buildReviewCycleMetrics({ reviewHistory: [], cycleStartedAt: null, now: FIXED_NOW });

    expect(metrics.cycleElapsedMs).toBeNull();
    expect(metrics.cycleStartedAt).toBeNull();
  });

  it('expõe timestamp ISO correto usando now fornecido', () => {
    const metrics = buildReviewCycleMetrics({ reviewHistory: [], now: FIXED_NOW });

    expect(metrics.timestamp).toBe('2026-05-24T12:00:00.000Z');
  });

  it('não quebra com reviewHistory inválido (null/undefined)', () => {
    expect(() => buildReviewCycleMetrics({ reviewHistory: null, now: FIXED_NOW })).not.toThrow();
    expect(() => buildReviewCycleMetrics({ reviewHistory: undefined, now: FIXED_NOW })).not.toThrow();

    const m1 = buildReviewCycleMetrics({ reviewHistory: null, now: FIXED_NOW });
    expect(m1.revisionCount).toBe(0);
    expect(m1.humanDecisionCount).toBe(0);
  });

  it('ignora tipo de evento desconhecido no finalStatus', () => {
    const history = [
      { type: 'revision_generated', text: null, timestamp: '2026-05-24T11:59:00.000Z' },
    ];

    const metrics = buildReviewCycleMetrics({ reviewHistory: history, now: FIXED_NOW });

    // 'revision_generated' não é status terminal — deve cair em 'pending'
    expect(metrics.finalStatus).toBe('pending');
    expect(metrics.revisionCount).toBe(0);
  });

  it('não registra conteúdo sensível nas métricas (apenas contadores e timestamps)', () => {
    const history = [
      { type: 'adjustment_requested', text: 'segredo confidencial XYZ', timestamp: '2026-05-24T11:55:00.000Z' },
    ];

    const metrics = buildReviewCycleMetrics({ reviewHistory: history, now: FIXED_NOW });

    const serialized = JSON.stringify(metrics);
    expect(serialized).not.toContain('segredo confidencial XYZ');
  });
});
