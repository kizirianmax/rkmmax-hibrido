import { jest } from '@jest/globals';

/**
 * Mock Fetch Helper for Serginho Orchestrator Tests
 * 
 * Provides robust mocking of fetch calls with provider-specific responses
 */

/**
 * Creates a mock fetch function that returns appropriate responses based on provider
 * @param {Object} options - Mock configuration options
 * @param {Object} options.failProviders - Map of provider names to fail (e.g., { 'llama-8b': true })
 * @param {Object} options.customResponses - Custom responses per provider
 * @returns {Function} Mock fetch function
 */
export function createMockFetch(options = {}) {
  const { failProviders = {}, customResponses = {} } = options;

  return jest.fn().mockImplementation((url, requestOptions) => {
    // Parse request body to determine which provider is being called
    const body = JSON.parse(requestOptions.body);
    const model = body.model;

    // Map model to provider name
    const providerMap = {
      'llama-3.3-70b-versatile': 'llama-120b',
      'llama-3.1-70b-versatile': 'llama-70b',
      'llama-3.1-8b-instant': 'llama-8b',
      'mixtral-8x7b-32768': 'groq-fallback',
    };

    const providerName = providerMap[model] || 'unknown';

    // Check if this provider should fail
    if (failProviders[providerName] || failProviders[model]) {
      return Promise.reject(new Error(`Provider ${providerName} failed`));
    }

    // Use custom response if provided
    if (customResponses[providerName]) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(customResponses[providerName]),
        text: jest.fn().mockResolvedValue('OK'),
      });
    }

    // Default successful response (Groq/OpenAI format)
    return Promise.resolve({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: `Mock response from ${providerName}`
          }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      }),
      text: jest.fn().mockResolvedValue('OK'),
    });
  });
}

/**
 * Creates a mock fetch for Gemini API
 * @returns {Function} Mock fetch function for Gemini
 */
export function createGeminiMockFetch() {
  return jest.fn().mockImplementation((url, requestOptions) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{ text: 'Mock response from Gemini' }]
          }
        }],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30
        }
      }),
      text: jest.fn().mockResolvedValue('OK'),
    });
  });
}

/**
 * Creates a mock fetch that always fails
 * @param {string} errorMessage - Error message to return
 * @returns {Function} Mock fetch function that always fails
 */
export function createFailingMockFetch(errorMessage = 'All providers down') {
  return jest.fn().mockImplementation(() => {
    return Promise.reject(new Error(errorMessage));
  });
}
