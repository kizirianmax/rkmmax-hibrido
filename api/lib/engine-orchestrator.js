/**
 * @deprecated Phase A4 — Soberania de Entrada Única (Gateway obrigatório)
 * Use `api/lib/serginho-orchestrator.js` instead.
 * This file is retained to avoid breaking unknown references but must NOT be
 * imported by any route handler.
 */
/**
 * 🎯 ENGINE ORCHESTRATOR - Orquestração paralela de engines
 *
 * Fixes (CodeRabbit PR #95):
 * 1. Cache key agora inclui systemPrompt + complexity (evita cross-contamination)
 * 2. Filter de engineOrder corrigido: !e.requires || Boolean(e.requires) real
 * 3. Modo paralelo usa Promise.any (first-success) em vez de Promise.all
 */

import { breakers } from './circuit-breaker.js';
import { globalCache } from './cache.js';
import { globalMetrics } from './metrics.js';

/**
 * Chamar KIZI 2.5 Pro (Gemini 2.5 Pro)
 */
async function callGeminiPro(messages, systemPrompt, apiKey, signal) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        contents: messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 16000,
          topP: 0.95,
          topK: 64,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Pro error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Chamar KIZI Flash (Gemini Flash)
 */
async function callGeminiFlash(messages, systemPrompt, apiKey, signal) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        contents: messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          topP: 0.9,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Flash error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Chamar KIZI Speed (Groq)
 */
async function callGroqSpeed(messages, systemPrompt, apiKey, signal) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq Speed error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Gerar chave de cache composta por systemPrompt + complexity + messages
 * Fix: evita cross-contamination entre contextos diferentes
 */
function buildCacheKey(messages, systemPrompt, complexity) {
  return [
    { systemPrompt: systemPrompt || '', complexity: complexity || 'speed' },
    ...messages,
  ];
}

/**
 * Orquestrar chamadas paralelas aos engines
 * Retorna a primeira resposta bem-sucedida
 */
export async function orchestrateEngines(messages, systemPrompt, options = {}) {
  const startTime = Date.now();
  const {
    geminiKey,
    groqKey,
    complexity = 'speed',
    useParallel = true,
  } = options;

  // Chave de cache composta (fix: inclui systemPrompt + complexity)
  const cacheKey = buildCacheKey(messages, systemPrompt, complexity);
  const cached = globalCache.get(cacheKey);
  if (cached) {
    globalMetrics.recordRequest({
      success: true,
      cached: true,
      responseTime: Date.now() - startTime,
      engine: 'cache',
    });
    return { response: cached.response, model: cached.model, success: true, cached: true, responseTime: Date.now() - startTime };
  }

  // Definir ordem de engines baseado na complexidade
  let engineOrder = [];

  if (complexity === 'pro' && geminiKey) {
    engineOrder = [
      { name: 'gemini-pro', fn: (sig) => callGeminiPro(messages, systemPrompt, geminiKey, sig), breaker: breakers['gemini-pro'], signal: true },
      { name: 'groq-speed', fn: (sig) => callGroqSpeed(messages, systemPrompt, groqKey, sig), breaker: breakers['groq-speed'], requires: groqKey, signal: true },
      { name: 'gemini-flash', fn: (sig) => callGeminiFlash(messages, systemPrompt, geminiKey, sig), breaker: breakers['gemini-flash'], signal: true },
    ];
  } else if (complexity === 'flash' && geminiKey) {
    engineOrder = [
      { name: 'gemini-flash', fn: (sig) => callGeminiFlash(messages, systemPrompt, geminiKey, sig), breaker: breakers['gemini-flash'], signal: true },
      { name: 'groq-speed', fn: (sig) => callGroqSpeed(messages, systemPrompt, groqKey, sig), breaker: breakers['groq-speed'], requires: groqKey, signal: true },
      { name: 'gemini-pro', fn: (sig) => callGeminiPro(messages, systemPrompt, geminiKey, sig), breaker: breakers['gemini-pro'], signal: true },
    ];
  } else {
    // Default: speed first
    engineOrder = [
      { name: 'groq-speed', fn: (sig) => callGroqSpeed(messages, systemPrompt, groqKey, sig), breaker: breakers['groq-speed'], requires: groqKey, signal: true },
      { name: 'gemini-flash', fn: (sig) => callGeminiFlash(messages, systemPrompt, geminiKey, sig), breaker: breakers['gemini-flash'], requires: geminiKey, signal: true },
      { name: 'gemini-pro', fn: (sig) => callGeminiPro(messages, systemPrompt, geminiKey, sig), breaker: breakers['gemini-pro'], requires: geminiKey, signal: true },
    ];
  }

  // Fix: filtro real — só inclui engine se a API key está disponível
  // e.requires IS the apiKey string; Boolean(e.requires) === !!e.requires
  // Simplificado: filter(e => !e.requires || e.requires) é tautologia
  // Correto: filter(e => !e.requires || !!e.requires) ainda é tautologia
  // Real fix: engines sem 'requires' sempre passam; engines COM 'requires' só passam se a key é truthy
  engineOrder = engineOrder.filter(e => e.requires === undefined || Boolean(e.requires));

  if (engineOrder.length === 0) {
    throw new Error('No AI engines available');
  }

  // Modo paralelo: Promise.any (first-success) com AbortController para cancelar engines perdedores
  if (useParallel && engineOrder.length > 1) {
    console.warn(`🏁 Racing ${engineOrder.length} engines (Promise.any)...`);
    // AbortController cancels in-flight requests once a winner is found
    const ac = new AbortController();
    const { signal } = ac;
    const promises = engineOrder.map((engine) => {
      // Pass signal to engine fn so it can abort its fetch when cancelled
      const fn = engine.signal ? () => engine.fn(signal) : engine.fn;
      return engine.breaker
        .execute(fn)
        .then((response) => ({ response, model: engine.name }));
      // Rejection propagates naturally so Promise.any skips this engine
    });
    try {
      const winner = await Promise.any(promises);
      // Cancel all remaining in-flight requests
      ac.abort();
      const responseTime = Date.now() - startTime;
      console.warn(`✅ ${winner.model} won the race in ${responseTime}ms`);
      globalCache.set(cacheKey, { response: winner.response, model: winner.model });
      globalMetrics.recordRequest({
        success: true,
        cached: false,
        responseTime,
        engine: winner.model,
      });
      return { ...winner, success: true, cached: false, responseTime };
    } catch {
      // AggregateError: all engines failed — fall through to sequential
      ac.abort();
      console.warn('⚠️ All parallel engines failed, trying sequential fallback...');
    }
  }

  // Fallback sequencial
  console.warn('🔄 Trying engines sequentially...');
  for (const engine of engineOrder) {
    try {
      console.warn(`🤖 Trying ${engine.name}...`);
      const response = await engine.breaker.execute(engine.fn);
      const responseTime = Date.now() - startTime;

      console.warn(`✅ ${engine.name} succeeded in ${responseTime}ms`);

      globalCache.set(cacheKey, { response, model: engine.name });
      globalMetrics.recordRequest({
        success: true,
        cached: false,
        responseTime,
        engine: engine.name,
      });

      return { response, model: engine.name, success: true, cached: false, responseTime };
    } catch (error) {
      console.error(`❌ ${engine.name} failed:`, error.message);
    }
  }

  // Todos falharam
  const responseTime = Date.now() - startTime;
  globalMetrics.recordRequest({
    success: false,
    cached: false,
    responseTime,
    error: 'All engines failed',
    timeout: responseTime > 10000,
  });

  throw new Error('All AI engines failed');
}
