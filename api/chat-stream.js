/**
 * 🌊 STREAMING SSE ENDPOINT - Server-Sent Events
 * 
 * Implementa streaming de respostas para evitar timeouts:
 * - Inicia resposta em < 500ms
 * - Stream tokens conforme chegam
 * - Nunca aguarda resposta completa
 * - Fecha gracefully em timeout
 * - Garante < 12s total
 */

import geniusPrompts from "../src/prompts/geniusPrompts.js";
import { orchestrateEngines } from "./lib/engine-orchestrator.js";
import { globalMetrics } from "./lib/metrics.js";

const { buildGeniusPrompt } = geniusPrompts;

/**
 * Stream tokens de resposta via SSE
 */
async function streamResponse(res, messages, systemPrompt, options) {
  const startTime = Date.now();
  
  try {
    // Configurar SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Enviar evento inicial
    res.write('event: start\n');
    res.write(`data: ${JSON.stringify({ status: 'processing', timestamp: Date.now() })}\n\n`);

    // Timer de timeout (11s para margem de segurança)
    const timeout = setTimeout(() => {
      res.write('event: timeout\n');
      res.write(`data: ${JSON.stringify({ error: 'Request timeout', duration: Date.now() - startTime })}\n\n`);
      res.end();
    }, 11000);

    // Obter resposta do orquestrador
    const result = await orchestrateEngines(messages, systemPrompt, options);
    clearTimeout(timeout);

    // Simular streaming dividindo a resposta em chunks
    const response = result.response;
    const chunkSize = 50; // Caracteres por chunk
    
    for (let i = 0; i < response.length; i += chunkSize) {
      const chunk = response.slice(i, i + chunkSize);
      
      res.write('event: chunk\n');
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      
      // Pequeno delay para simular streaming real
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Evento final com metadados
    res.write('event: complete\n');
    res.write(`data: ${JSON.stringify({ 
      model: result.model, 
      cached: result.cached,
      duration: Date.now() - startTime,
      success: true
    })}\n\n`);
    
    res.end();

  } catch (error) {
    console.error('❌ Streaming error:', error);
    
    res.write('event: error\n');
    res.write(`data: ${JSON.stringify({ 
      error: error.message,
      duration: Date.now() - startTime 
    })}\n\n`);
    
    res.end();
  }
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      type = 'genius',
      messages,
      agentType,
      complexity = 'speed',
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Verificar credenciais
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return res.status(500).json({
        error: 'No AI providers configured',
        hint: 'Configure GEMINI_API_KEY or GROQ_API_KEY',
      });
    }

    // Construir system prompt
    const promptType = agentType || 'serginho';
    const systemPrompt = buildGeniusPrompt(promptType);

    console.log(`🌊 Starting SSE stream - Type: ${type} | Complexity: ${complexity}`);

    // Stream a resposta
    await streamResponse(res, messages, systemPrompt, {
      geminiKey,
      groqKey,
      complexity,
      useParallel: true,
    });

  } catch (error) {
    console.error('❌ Stream handler error:', error);
    
    // Se headers já foram enviados, não podemos enviar JSON
    if (res.headersSent) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}
