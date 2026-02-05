/**
 * 💚 HEALTH CHECK ENDPOINT - Verificação de saúde do sistema
 * 
 * Retorna status de:
 * - Sistema geral
 * - Engines de IA disponíveis
 * - Variáveis de ambiente
 * - Métricas de performance
 * - Circuit breakers
 */

import { getEnvStatus } from './lib/validate-env.js';
import { breakers } from './lib/circuit-breaker.js';
import { globalMetrics } from './lib/metrics.js';
import { globalCache } from './lib/cache.js';

/**
 * Verificar se Gemini está disponível
 */
async function checkGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY;
  if (!apiKey) {
    return { available: false, reason: 'No API key configured' };
  }

  try {
    const response = await fetch(
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
      reason: response.ok ? 'OK' : await response.text(),
    };
  } catch (error) {
    return {
      available: false,
      reason: error.message,
    };
  }
}

/**
 * Verificar se Groq está disponível
 */
async function checkGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { available: false, reason: 'No API key configured' };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    });

    return {
      available: response.ok,
      status: response.status,
      reason: response.ok ? 'OK' : await response.text(),
    };
  } catch (error) {
    return {
      available: false,
      reason: error.message,
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

    // Obter estatísticas
    const metrics = globalMetrics.getMetrics();
    const cacheStats = globalCache.getStats();
    const breakerStats = {
      'gemini-pro': breakers['gemini-pro'].getStats(),
      'gemini-flash': breakers['gemini-flash'].getStats(),
      'groq-speed': breakers['groq-speed'].getStats(),
    };

    // Montar resposta
    const health = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime ? process.uptime() : null,
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
      
      environment: getEnvStatus(),
      
      performance: metrics,
      
      cache: cacheStats,
      
      circuitBreakers: breakerStats,
    };

    // Retornar status code apropriado
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
