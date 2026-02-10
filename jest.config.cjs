module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/api/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/automation/**/__tests__/**/*.{js,jsx}',
      ],
      coverageThreshold: {
        global: {
          statements: 5,
          branches: 5,
          functions: 5,
          lines: 5,
        },
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/__tests__/**/*.{js,jsx}',
      ],
      coverageThreshold: {
        global: {
          statements: 5,
          branches: 5,
          functions: 5,
          lines: 5,
        },
      },
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'api/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!jest.config.cjs',
    '!jest.setup.cjs',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'clover'],
};
