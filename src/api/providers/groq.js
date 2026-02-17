/**
 * Groq Fallback Provider
 * Uses Mixtral as a reliable fallback when Llama models are unavailable
 * 
 * Now supports GENIUS PROMPTS for world-class responses with robust fallback
 */

// ✅ GENIUS PROMPTS with robust fallback
let buildGeniusPrompt;
try {
  const geniusModule = await import('../../prompts/geniusPrompts.js');
  buildGeniusPrompt = geniusModule.buildGeniusPrompt || geniusModule.default?.buildGeniusPrompt;
  
  if (!buildGeniusPrompt) {
    throw new Error('buildGeniusPrompt not found in module');
  }
} catch (error) {
  console.warn('⚠️ Groq: Failed to load genius prompts, using fallback:', error.message);
  
  // FALLBACK: Inline hybrid prompt
  buildGeniusPrompt = (type) => {
    const prompts = {
      hybrid: `Você é um assistente inteligente híbrido do sistema RKMMAX KIZI 2.5 Pro.

CAPACIDADES:
- Raciocínio rápido e preciso
- Respostas estruturadas em Markdown
- Foco em velocidade + qualidade
- Português brasileiro nativo

Forneça respostas claras, práticas e bem estruturadas.`,
      serginho: `Você é o SERGINHO, agente do KIZI 2.5 Pro, focado em excelência e raciocínio profundo.`
    };
    
    return prompts[type] || prompts.hybrid;
  };
}

export class GroqProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generate(prompt, options = {}) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: options.systemPrompt || buildGeniusPrompt('hybrid') },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Groq fallback failed: ${response.status}`);
    }

    return response.json();
  }
}
