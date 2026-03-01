/**
 * 💚 HEALTH CHECK ENDPOINT - Verificação de saúde do sistema
 *
 * Fix (CodeRabbit PR #95):
 * 1. Provider health probes agora têm timeout de 3s (AbortController)
 * 2. Endpoint público retorna apenas campos seguros (sem dados internos)
 *    - getEnvStatus() e circuitBreakers removidos da resposta pública
 *    - Apenas status, engines, performance summary e cache hit/miss expostos
 */

import { globalMetrics } from './lib/metrics.js';
import { globalCache } from './lib/cache.js';

const PROBE_TIMEOUT_MS = 3000;

/**
 * Wrapper de fetch com timeout via AbortController
 */
async function fetchWithTimeout(url, options, timeoutMs = PROBE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

/**
 * Verificar se Gemini está disponível (com timeout de 3s)
 */
async function checkGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY;
  if (!apiKey) {
    return { available: false, reason: 'No API key configured' };
  }

  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'health check' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );

    return {
      available: response.ok,
      status: response.status,
      reason: response.ok ? 'OK' : 'Provider returned error',
    };
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return {
      available: false,
      reason: isTimeout ? 'Timeout after 3s' : 'Unreachable',
    };
  }
}

/**
 * Verificar se Groq está disponível (com timeout de 3s)
 */
async function checkGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { available: false, reason: 'No API key configured' };
  }

  try {
    const response = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'health check' }],
          max_tokens: 10,
        }),
      }
    );

    return {
      available: response.ok,
      status: response.status,
      reason: response.ok ? 'OK' : 'Provider returned error',
    };
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return {
      available: false,
      reason: isTimeout ? 'Timeout after 3s' : 'Unreachable',
    };
  }
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();

    // Verificar engines em paralelo
    const [geminiStatus, groqStatus] = await Promise.all([
      checkGemini(),
      checkGroq(),
    ]);

    // Status geral
    const hasAnyEngine = geminiStatus.available || groqStatus.available;
    const status = hasAnyEngine ? 'healthy' : 'degraded';

    // Estatísticas seguras para exposição pública
    const metrics = globalMetrics.getMetrics();
    const cacheStats = globalCache.getStats();

    // Resposta pública: apenas campos seguros (sem internals sensíveis)
    const health = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checkDuration: Date.now() - startTime + 'ms',

      engines: {
        gemini: {
          available: geminiStatus.available,
          models: ['gemini-2.5-pro', 'gemini-2.0-flash'],
          status: geminiStatus.reason,
        },
        groq: {
          available: groqStatus.available,
          models: ['llama-3.3-70b-versatile'],
          status: groqStatus.reason,
        },
      },

      performance: {
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
        avgResponseTime: metrics.avgResponseTime,
      },

      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        size: cacheStats.size,
      },
    };

    const statusCode = status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);

  } catch (error) {
    console.error('❌ Health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
