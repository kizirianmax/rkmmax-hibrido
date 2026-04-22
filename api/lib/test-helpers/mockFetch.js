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

  // Track how many times each model has been called (for dual-mapping of llama-3.1-8b-instant)
  const modelCallCount = {};

  return jest.fn().mockImplementation((url, requestOptions) => {
    // Parse request body to determine which provider is being called
    const body = JSON.parse(requestOptions.body);
    const isGemini = url.includes('generativelanguage.googleapis.com');
    const model = isGemini ? url.match(/models\/([^:]+)/)?.[1] : body.model;

    // Track call count per model
    modelCallCount[model] = (modelCallCount[model] || 0) + 1;

    // Map model to provider name
    const providerMap = {
      'openai/gpt-oss-120b': 'llama-120b',
      'llama-3.3-70b-versatile': 'llama-70b',
      'llama-3.1-70b-versatile': 'llama-70b',
      'gemini-3-flash-preview': 'gemini-3-flash',
      'gemini-3.1-pro-preview': 'gemini-3.1-pro',
      'gemini-2.5-pro': 'gemini-pro',
    };

    let providerName;
    if (model === 'llama-3.1-8b-instant') {
      providerName = modelCallCount[model] <= 1 ? 'llama-8b' : 'llama-8b';
    } else {
      providerName = providerMap[model] || 'unknown';
    }

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

    // Return format based on provider type
    if (isGemini) {
      // Google Gemini response format
      return Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{ text: `Mock response from ${providerName}` }],
              role: 'model'
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
 * Creates a mock fetch that always fails
 * @param {string} errorMessage - Error message to return
 * @returns {Function} Mock fetch function that always fails
 */
export function createFailingMockFetch(errorMessage = 'All providers down') {
  return jest.fn().mockImplementation(() => {
    return Promise.reject(new Error(errorMessage));
  });
}
