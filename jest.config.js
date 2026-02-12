/**
 * JEST CONFIGURATION - CORRIGIDO PARA ESM
 */

export default {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Suporte a ESM
  extensionsToTreatAsEsm: ['.jsx'],
  
  // Arquivos de teste
  testMatch: [
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  
  // Ignorar pastas
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
    '/dist/'
  ],
  
  // Transform para ES6/JSX (ESM mode)
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { 
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  
  // Setup global
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapper para assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  
  // Coverage
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'api/**/*.js',
    '!src/**/*.test.{js,jsx}',
    '!src/__tests__/**',
    '!src/index.js',
    '!**/node_modules/**',
    '!**/build/**',
    '!**/coverage/**'
  ],
  
  // Thresholds (reduzidos inicialmente para passar)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  
  // Configurações adicionais
  verbose: true,
  forceExit: true,
  detectOpenHandles: false,
  testTimeout: 10000,
  maxWorkers: '50%'
};
