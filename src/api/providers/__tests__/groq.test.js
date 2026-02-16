import { jest } from '@jest/globals';
import { GroqProvider } from '../groq.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('GroqProvider', () => {
  let provider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new GroqProvider(mockApiKey);
  });

  describe('Constructor', () => {
    test('Initializes with API key', () => {
      expect(provider.apiKey).toBe(mockApiKey);
    });
  });

  describe('generate', () => {
    test('Makes correct API call with Mixtral model', async () => {
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

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe('mixtral-8x7b-32768');
    });

    test('Uses fixed temperature of 0.5', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt');

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.temperature).toBe(0.5);
    });

    test('Uses fixed max_tokens of 1500', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt');

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.max_tokens).toBe(1500);
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
        systemPrompt: 'Custom fallback prompt'
      });

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.messages[0]).toEqual({
        role: 'system',
        content: 'Custom fallback prompt'
      });
    });

    test('Uses default system prompt when not provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt');

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.messages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant.'
      });
    });

    test('Returns response data correctly', async () => {
      const mockData = {
        choices: [{ message: { content: 'Fallback response' } }],
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

    test('Throws error when API fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(provider.generate('Test prompt')).rejects.toThrow('Groq fallback failed: 500');
    });

    test('Throws error on network failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(provider.generate('Test prompt')).rejects.toThrow('Network error');
    });
  });

  describe('Fallback Behavior', () => {
    test('Uses consistent configuration for reliability', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.generate('Test prompt');

      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      // Verify conservative settings for fallback reliability
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(1500);
      expect(body.model).toBe('mixtral-8x7b-32768');
    });
  });
});
