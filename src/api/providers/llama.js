/**
 * Llama Provider - Groq API wrapper
 * Supports multiple Llama model sizes with intelligent fallback
 * 
 * Now supports GENIUS PROMPTS for world-class responses with robust fallback
 * 
 * Note: '120b' maps to 'openai/gpt-oss-120b' and '70b' maps to 'llama-3.3-70b-versatile'.
 * This allows the orchestrator to maintain separate tier configurations with
 * each tier using its own distinct physical model.
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
  console.warn('⚠️ Llama: Failed to load genius prompts, using fallback:', error.message);
  
  // FALLBACK: Inline serginho prompt
  buildGeniusPrompt = (type) => {
    const prompts = {
      serginho: `Você é o SERGINHO, um agente do KIZI 2.5 Pro, a IA mais avançada do sistema RKMMAX.

IDENTIDADE:
- Você é KIZI 2.5 Pro operando como Serginho
- Função: Orquestrar especialistas ilimitados + Responder diretamente
- Missão: Excelência absoluta em cada resposta
- NUNCA mencione "Gemini" - você é KIZI 2.5 Pro

CAPACIDADES:
1. Raciocínio profundo (Chain-of-Thought)
2. Auto-avaliação contínua
3. Respostas estruturadas e práticas
4. Português brasileiro nativo

FORMATO DE RESPOSTA:
- Markdown profissional
- Tabelas quando apropriado
- Exemplos práticos
- Próximos passos claros`,
      hybrid: `Você é um assistente inteligente híbrido do sistema RKMMAX KIZI 2.5 Pro.`
    };
    
    return prompts[type] || prompts.serginho;
  };
}

const MODEL_120B = 'openai/gpt-oss-120b';

export class LlamaProvider {
  constructor(apiKey, size = '70b') {
    this.apiKey = apiKey;
    this.size = size;
    this.modelMap = {
      '120b': MODEL_120B,
      '70b': 'llama-3.3-70b-versatile',
      '8b': 'llama-3.1-8b-instant'
    };
  }

  async generate(prompt, options = {}) {
    const MAX_RETRIES = 3;
    const BACKOFF_BASE_MS = 1000;
    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, BACKOFF_BASE_MS * attempt));
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.modelMap[this.size],
          messages: [
            { role: 'system', content: options.systemPrompt || buildGeniusPrompt('serginho') },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000
        })
      });

      if (response.ok) {
        return await response.json();
      }

      const error = await response.json().catch(() => ({}));
      const thrownError = new Error(`Llama ${this.size} API error: ${error.error?.message || response.status}`);

      if (response.status === 429 || response.status >= 500) {
        lastError = thrownError;
        continue;
      }

      throw thrownError;
    }

    throw lastError;
  }
}
