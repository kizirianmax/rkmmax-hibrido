module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/api/**/__tests__/**/*.{js,jsx}',
      ],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { rootMode: 'upward' }],
      },
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
        '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
      ],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { rootMode: 'upward' }],
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
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
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!api/**/*.test.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
};
