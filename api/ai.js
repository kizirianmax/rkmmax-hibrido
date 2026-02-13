/**
 * 🤖 ENDPOINT UNIFICADO DE IA - KIZI AI (GROQ APENAS)
 *
 * Sistema inteligente com Groq:
 * - openai/gpt-oss-120b (Principal) = Raciocínio complexo, 120B params
 * - llama-3.3-70b-versatile (Fallback) = Velocidade, respostas rápidas
 *
 * O sistema tenta o 120b primeiro, fallback para 70b se falhar.
 */

import geniusPrompts from "../src/prompts/geniusPrompts.js";
import costOptimization from "../src/utils/costOptimization.js";
import { specialists } from "../src/config/specialists.js";

const { buildGeniusPrompt } = geniusPrompts;
const { optimizeRequest, cacheResponse } = costOptimization;

// Configuração dos modelos Groq
const GROQ_MODELS = {
  PRIMARY: 'openai/gpt-oss-120b',           // 120B reasoning model
  FALLBACK: 'llama-3.3-70b-versatile',      // 70B fast model
};

/**
 * Chamar Groq com fallback automático
 */
async function callGroq(messages, systemPrompt, options = {}) {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!groqKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Tentar modelo principal primeiro
  try {
    console.log('🚀 [GROQ] Tentando modelo principal:', GROQ_MODELS.PRIMARY);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODELS.PRIMARY,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ [GROQ] Modelo principal respondeu com sucesso');
    
    return {
      response: data.choices[0].message.content,
      model: GROQ_MODELS.PRIMARY,
      provider: 'groq',
      tokens: data.usage?.total_tokens || 0,
      success: true,
    };
    
  } catch (primaryError) {
    console.warn('⚠️ [GROQ] Modelo principal falhou:', primaryError.message);
    console.log('🔄 [GROQ] Tentando fallback:', GROQ_MODELS.FALLBACK);
    
    // Tentar fallback
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODELS.FALLBACK,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq fallback error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [GROQ] Fallback respondeu com sucesso');
      
      return {
        response: data.choices[0].message.content,
        model: GROQ_MODELS.FALLBACK,
        provider: 'groq-fallback',
        tokens: data.usage?.total_tokens || 0,
        success: true,
        usedFallback: true,
      };
      
    } catch (fallbackError) {
      console.error('❌ [GROQ] Ambos os modelos falharam');
      throw new Error(`All Groq models failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
    }
  }
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      type = 'genius',
      messages,
      agentType,
      specialistId,
    } = req.body;

    // Validar entrada
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'messages array is required',
      });
    }

    // Verificar credenciais
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      console.error('❌ [AI] GROQ_API_KEY not configured');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'GROQ_API_KEY not configured in environment variables',
        hint: 'Add GROQ_API_KEY to Vercel environment variables',
      });
    }

    console.log(`🤖 [AI] Request type: ${type}, messages: ${messages.length}`);

    // ========================================
    // TIPO: GENIUS (Serginho + Híbrido)
    // ========================================
    if (type === 'genius' || type === 'chat' || type === 'intelligent' || type === 'hybrid') {
      const promptType = agentType || 'serginho';
      const systemPrompt = buildGeniusPrompt(promptType);
      const optimized = optimizeRequest(messages, systemPrompt);

      // Verificar cache
      if (optimized.cached) {
        console.log('💰 [AI] Cache hit!');
        return res.status(200).json({
          ...optimized.response,
          cached: true,
          type: promptType,
        });
      }

      // Chamar Groq com fallback
      const result = await callGroq(optimized.messages, optimized.systemPrompt);

      const response = {
        ...result,
        type: promptType,
        cached: false,
        optimized: true,
        stats: optimized.stats,
      };

      // Cachear resposta
      cacheResponse(messages, response);

      return res.status(200).json(response);
    }

    // ========================================
    // TIPO: SPECIALIST
    // ========================================
    if (type === 'specialist') {
      if (!specialistId) {
        return res.status(400).json({ error: 'specialistId required for specialist type' });
      }

      const specialist = specialists[specialistId];
      if (!specialist) {
        return res.status(404).json({ 
          error: 'Specialist not found',
          availableSpecialists: Object.keys(specialists),
        });
      }

      const systemPrompt = buildGeniusPrompt('specialist', {
        name: specialist.name,
        description: specialist.description,
        category: specialist.category,
        systemPrompt: specialist.systemPrompt,
      });

      const optimized = optimizeRequest(messages, systemPrompt);

      // Verificar cache
      if (optimized.cached) {
        console.log('💰 [AI] Cache hit (specialist)!');
        return res.status(200).json({
          ...optimized.response,
          cached: true,
          specialist: specialist.name,
        });
      }

      // Chamar Groq com fallback
      const result = await callGroq(optimized.messages, optimized.systemPrompt);

      const response = {
        ...result,
        specialist: specialist.name,
        cached: false,
        optimized: true,
        stats: optimized.stats,
      };

      // Cachear resposta
      cacheResponse(messages, response);

      return res.status(200).json(response);
    }

    // Tipo não suportado
    return res.status(400).json({
      error: 'Invalid type',
      message: `Type "${type}" is not supported`,
      hint: 'Use type: "genius", "chat", "hybrid", or "specialist"',
    });

  } catch (error) {
    console.error('❌ [AI] Fatal error:', error);
    console.error('❌ [AI] Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Vercel configuration
export const config = {
  api: {
    bodyParser: true,
    responseLimit: '10mb',
  },
};
