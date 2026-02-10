module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/api/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/automation/**/__tests__/**/*.{js,jsx}'
      ],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
      },
      collectCoverageFrom: [
        'api/**/*.{js,jsx}',
        'src/automation/**/*.{js,jsx}',
        '!**/__tests__/**',
        '!**/node_modules/**',
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
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/automation/**/__tests__/**',
      ],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      collectCoverageFrom: [
        'src/components/**/*.{js,jsx}',
        'src/**/*.{js,jsx}',
        '!src/automation/**/*.{js,jsx}',
        '!**/__tests__/**',
        '!**/node_modules/**',
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
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
};
