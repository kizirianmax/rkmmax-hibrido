export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'api/**/*.js',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 5,
      branches: 5,
      functions: 5,
      lines: 5
    }
  },
  setupFilesAfterEnv: ['./jest.setup.mjs'],
  
  // ✅ Fix worker leak and hanging tests
  testEnvironmentOptions: { 
    html: false 
  },
  maxWorkers: 2,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000
};
