import { jest } from '@jest/globals';
import { LlamaProvider } from '../llama.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('LlamaProvider', () => {
  let provider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new LlamaProvider(mockApiKey, '70b');
  });

  describe('Constructor', () => {
    test('Initializes with correct model size', () => {
      expect(provider.size).toBe('70b');
      expect(provider.apiKey).toBe(mockApiKey);
    });

    test('Uses correct model mapping', () => {
      const provider120b = new LlamaProvider(mockApiKey, '120b');
      const provider70b = new LlamaProvider(mockApiKey, '70b');
      const provider8b = new LlamaProvider(mockApiKey, '8b');

      expect(provider120b.modelMap['120b']).toBe('llama-3.3-70b-versatile');
      expect(provider70b.modelMap['70b']).toBe('llama-3.3-70b-versatile');
      expect(provider8b.modelMap['8b']).toBe('llama-3.1-8b-instant');
    });
  });

  describe('generate', () => {
    test('Makes correct API call with default options', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }
        })
      );
    });

    test('Uses custom system prompt when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt', {
        systemPrompt: 'Custom system prompt'
      });

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.messages[0]).toEqual({
        role: 'system',
        content: 'Custom system prompt'
      });
    });

    test('Uses custom temperature when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt', { temperature: 0.9 });

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.temperature).toBe(0.9);
    });

    test('Uses custom maxTokens when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt', { maxTokens: 3000 });

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.max_tokens).toBe(3000);
    });

    test('Returns response data correctly', async () => {
      const mockData = {
        choices: [{ message: { content: 'Test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await provider.generate('Test prompt');

      expect(result).toEqual(mockData);
    });

    test('Throws error when API returns error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: { message: 'API Error' }
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(provider.generate('Test prompt')).rejects.toThrow('Llama 70b API error: API Error');
    });

    test('Handles JSON parse error gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        json: jest.fn().mockRejectedValue(new Error('Parse error'))
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(provider.generate('Test prompt')).rejects.toThrow('Llama 70b API error: 503');
    });
  });

  describe('Model Selection', () => {
    test('120B uses correct model', () => {
      const provider120b = new LlamaProvider(mockApiKey, '120b');
      expect(provider120b.modelMap['120b']).toBe('llama-3.3-70b-versatile');
    });

    test('70B uses correct model', () => {
      const provider70b = new LlamaProvider(mockApiKey, '70b');
      expect(provider70b.modelMap['70b']).toBe('llama-3.3-70b-versatile');
    });

    test('8B uses correct model', () => {
      const provider8b = new LlamaProvider(mockApiKey, '8b');
      expect(provider8b.modelMap['8b']).toBe('llama-3.1-8b-instant');
    });
  });
});
