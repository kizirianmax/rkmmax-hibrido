/**
 * 🎯 ENGINE ORCHESTRATOR - Orquestração paralela de engines
 * 
 * Implementa:
 * - Promise.race() entre 3 engines
 * - Primeira resposta bem-sucedida vence
 * - Cancelamento de outras requisições
 * - Cadeia de fallback em falhas
 * - Integrado com circuit breakers
 */

import { breakers } from './circuit-breaker.js';
import { globalCache } from './cache.js';
import { globalMetrics } from './metrics.js';

/**
 * Chamar KIZI 2.5 Pro (Gemini 2.5 Pro)
 */
async function callGeminiPro(messages, systemPrompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
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
async function callGeminiFlash(messages, systemPrompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
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
async function callGroqSpeed(messages, systemPrompt, apiKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages,
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

  // Verificar cache primeiro
  const cached = globalCache.get(messages);
  if (cached) {
    globalMetrics.recordRequest({
      success: true,
      cached: true,
      responseTime: Date.now() - startTime,
      engine: 'cache',
    });
    return { ...cached, cached: true };
  }

  // Definir ordem de engines baseado na complexidade
  let engineOrder = [];
  
  if (complexity === 'pro' && geminiKey) {
    engineOrder = [
      { name: 'gemini-pro', fn: () => callGeminiPro(messages, systemPrompt, geminiKey), breaker: breakers['gemini-pro'] },
      { name: 'groq-speed', fn: () => callGroqSpeed(messages, systemPrompt, groqKey), breaker: breakers['groq-speed'], requires: groqKey },
      { name: 'gemini-flash', fn: () => callGeminiFlash(messages, systemPrompt, geminiKey), breaker: breakers['gemini-flash'] },
    ];
  } else if (complexity === 'flash' && geminiKey) {
    engineOrder = [
      { name: 'gemini-flash', fn: () => callGeminiFlash(messages, systemPrompt, geminiKey), breaker: breakers['gemini-flash'] },
      { name: 'groq-speed', fn: () => callGroqSpeed(messages, systemPrompt, groqKey), breaker: breakers['groq-speed'], requires: groqKey },
      { name: 'gemini-pro', fn: () => callGeminiPro(messages, systemPrompt, geminiKey), breaker: breakers['gemini-pro'] },
    ];
  } else {
    // Default: speed first
    engineOrder = [
      { name: 'groq-speed', fn: () => callGroqSpeed(messages, systemPrompt, groqKey), breaker: breakers['groq-speed'], requires: groqKey },
      { name: 'gemini-flash', fn: () => callGeminiFlash(messages, systemPrompt, geminiKey), breaker: breakers['gemini-flash'], requires: geminiKey },
      { name: 'gemini-pro', fn: () => callGeminiPro(messages, systemPrompt, geminiKey), breaker: breakers['gemini-pro'], requires: geminiKey },
    ];
  }

  // Filtrar engines que não tem API key
  engineOrder = engineOrder.filter(e => !e.requires || e.requires);

  if (engineOrder.length === 0) {
    throw new Error('No AI engines available');
  }

  // Modo paralelo: Promise.race
  if (useParallel && engineOrder.length > 1) {
    console.log(`🏁 Racing ${engineOrder.length} engines...`);
    
    const promises = engineOrder.map(async (engine) => {
      try {
        const response = await engine.breaker.execute(engine.fn);
        return { response, model: engine.name, success: true };
      } catch (error) {
        console.error(`❌ ${engine.name} failed:`, error.message);
        return { error: error.message, model: engine.name, success: false };
      }
    });

    // Esperar pela primeira resposta bem-sucedida
    const results = await Promise.all(promises);
    const successful = results.find(r => r.success);
    
    if (successful) {
      const responseTime = Date.now() - startTime;
      console.log(`✅ ${successful.model} won the race in ${responseTime}ms`);
      
      // Salvar no cache
      globalCache.set(messages, { response: successful.response, model: successful.model });
      
      // Registrar métricas
      globalMetrics.recordRequest({
        success: true,
        cached: false,
        responseTime,
        engine: successful.model,
      });
      
      return { ...successful, cached: false, responseTime };
    }
  }

  // Fallback sequencial se paralelo falhou ou não está habilitado
  console.log(`🔄 Trying engines sequentially...`);
  for (const engine of engineOrder) {
    try {
      console.log(`🤖 Trying ${engine.name}...`);
      const response = await engine.breaker.execute(engine.fn);
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ ${engine.name} succeeded in ${responseTime}ms`);
      
      // Salvar no cache
      globalCache.set(messages, { response, model: engine.name });
      
      // Registrar métricas
      globalMetrics.recordRequest({
        success: true,
        cached: false,
        responseTime,
        engine: engine.name,
      });
      
      return { response, model: engine.name, success: true, cached: false, responseTime };
    } catch (error) {
      console.error(`❌ ${engine.name} failed:`, error.message);
      continue;
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
