/**
 * Tests for Performance Metrics
 */

import { PerformanceMetrics } from '../lib/metrics.js';

describe('PerformanceMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = new PerformanceMetrics();
  });

  test('should record successful request', () => {
    metrics.recordRequest({
      success: true,
      responseTime: 1500,
      engine: 'gemini-pro',
      cached: false,
    });

    const stats = metrics.getMetrics();
    expect(stats.requests.total).toBe(1);
    expect(stats.requests.successful).toBe(1);
    expect(stats.requests.failed).toBe(0);
  });

  test('should record failed request', () => {
    metrics.recordRequest({
      success: false,
      responseTime: 2000,
      engine: 'groq-speed',
      error: 'Timeout error',
      timeout: true,
    });

    const stats = metrics.getMetrics();
    expect(stats.requests.total).toBe(1);
    expect(stats.requests.failed).toBe(1);
    expect(stats.performance.timeouts).toBe(1);
  });

  test('should track engine usage', () => {
    metrics.recordRequest({ success: true, engine: 'gemini-pro' });
    metrics.recordRequest({ success: true, engine: 'gemini-pro' });
    metrics.recordRequest({ success: true, engine: 'groq-speed' });

    const stats = metrics.getMetrics();
    expect(stats.engines['gemini-pro']).toBe(2);
    expect(stats.engines['groq-speed']).toBe(1);
  });

  test('should calculate response time statistics', () => {
    const times = [1000, 1500, 2000, 2500, 3000];
    
    times.forEach(time => {
      metrics.recordRequest({ success: true, responseTime: time });
    });

    const stats = metrics.getMetrics();
    expect(stats.performance.avgResponseTime).toBe('2000ms');
    expect(stats.performance.minResponseTime).toBe('1000ms');
    expect(stats.performance.maxResponseTime).toBe('3000ms');
  });

  test('should track cache statistics', () => {
    metrics.recordRequest({ success: true, cached: true });
    metrics.recordRequest({ success: true, cached: true });
    metrics.recordRequest({ success: true, cached: false });

    const stats = metrics.getMetrics();
    expect(stats.cache.hits).toBe(2);
    expect(stats.cache.misses).toBe(1);
    expect(stats.cache.hitRate).toBe('66.67%');
  });

  test('should calculate success rate correctly', () => {
    metrics.recordRequest({ success: true });
    metrics.recordRequest({ success: true });
    metrics.recordRequest({ success: false });
    metrics.recordRequest({ success: true });

    const stats = metrics.getMetrics();
    expect(stats.requests.successRate).toBe('75.00%');
  });

  test('should track recent errors', () => {
    metrics.recordRequest({
      success: false,
      error: 'First error',
      engine: 'gemini-pro',
    });

    metrics.recordRequest({
      success: false,
      error: 'Second error',
      engine: 'groq-speed',
    });

    const stats = metrics.getMetrics();
    expect(stats.recentErrors).toHaveLength(2);
    expect(stats.recentErrors[0].message).toBe('First error');
    expect(stats.recentErrors[1].message).toBe('Second error');
  });

  test('should limit response time history to 1000', () => {
    // Add 1500 entries
    for (let i = 0; i < 1500; i++) {
      metrics.recordRequest({ success: true, responseTime: 1000 + i });
    }

    expect(metrics.metrics.responseTimes).toHaveLength(1000);
  });

  test('should limit error history to 100', () => {
    // Add 150 errors
    for (let i = 0; i < 150; i++) {
      metrics.recordRequest({
        success: false,
        error: `Error ${i}`,
      });
    }

    expect(metrics.metrics.errors).toHaveLength(100);
  });

  test('should calculate P95 and P99 correctly', () => {
    // Add 100 response times from 0 to 99ms
    for (let i = 0; i < 100; i++) {
      metrics.recordRequest({ success: true, responseTime: i });
    }

    const stats = metrics.getMetrics();
    const p95 = parseInt(stats.performance.p95ResponseTime);
    const p99 = parseInt(stats.performance.p99ResponseTime);
    
    expect(p95).toBeGreaterThanOrEqual(90);
    expect(p99).toBeGreaterThanOrEqual(95);
  });

  test('should handle zero requests gracefully', () => {
    const stats = metrics.getMetrics();
    
    expect(stats.requests.total).toBe(0);
    expect(stats.requests.successRate).toBe('0%');
    expect(stats.cache.hitRate).toBe('0%');
    expect(stats.performance.avgResponseTime).toBe('0ms');
  });

  test('should reset metrics correctly', () => {
    metrics.recordRequest({ success: true, responseTime: 1000, engine: 'gemini-pro' });
    metrics.recordRequest({ success: false, error: 'Test error' });

    metrics.reset();

    const stats = metrics.getMetrics();
    expect(stats.requests.total).toBe(0);
    expect(stats.requests.successful).toBe(0);
    expect(stats.requests.failed).toBe(0);
    expect(stats.performance.timeouts).toBe(0);
    expect(Object.keys(stats.engines)).toHaveLength(0);
  });

  test('should export to Sentry format', () => {
    const mockSentry = {
      setContext: () => {},
    };

    metrics.recordRequest({
      success: true,
      responseTime: 1500,
      engine: 'gemini-pro',
    });

    metrics.exportToSentry(mockSentry);

    expect(mockSentry.setContext).toHaveBeenCalledWith('performance', expect.any(Object));
    expect(mockSentry.setContext).toHaveBeenCalledWith('engines', expect.any(Object));
    expect(mockSentry.setContext).toHaveBeenCalledWith('cache', expect.any(Object));
  });
});
