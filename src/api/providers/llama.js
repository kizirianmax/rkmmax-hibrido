/**
 * Llama Provider - Groq API wrapper
 * Supports multiple Llama model sizes with intelligent fallback
 * 
 * Note: Currently, both '120b' and '70b' map to 'llama-3.3-70b-versatile'
 * because Groq doesn't yet have a 120B model available. This allows the
 * orchestrator to maintain separate tier configurations while using the
 * same underlying model, enabling future upgrades when 120B becomes available.
 */

// TODO: Update to actual Llama 3.3 120B model when available on Groq
const TEMPORARY_120B_MODEL = 'llama-3.3-70b-versatile';

export class LlamaProvider {
  constructor(apiKey, size = '70b') {
    this.apiKey = apiKey;
    this.size = size;
    this.modelMap = {
      '120b': TEMPORARY_120B_MODEL,
      '70b': 'llama-3.3-70b-versatile',
      '8b': 'llama-3.1-8b-instant'
    };
  }

  async generate(prompt, options = {}) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelMap[this.size],
        messages: [
          { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Llama ${this.size} API error: ${error.error?.message || response.status}`);
    }

    return response.json();
  }
}
