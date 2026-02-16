import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Global fetch mock with timeout simulation
global.fetch = jest.fn((url, options) => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve('OK'),
      });
    }, 10); // Small delay for realistic testing
  });
});

// Reset mocks between tests
beforeEach(() => {
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear();
  }
});
