/**
 * Groq Fallback Provider
 * Uses Mixtral as a reliable fallback when Llama models are unavailable
 */
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
          { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
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
