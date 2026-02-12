/**
 * JEST CONFIGURATION - PARTE 3 (Coverage Thresholds)
 * Configuração completa do Jest com thresholds de coverage
 */

module.exports = {
  // Ambiente de teste (Node.js)
  testEnvironment: 'node',
  
  // Arquivos de teste
  testMatch: [
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  
  // Ignorar node_modules
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/'
  ],
  
  // Transform para ES6/JSX
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Setup global (detecção de exceções)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // Verbose output
  verbose: true,
  
  // Forçar saída em CI
  forceExit: true,
  
  // Detectar handles abertos
  detectOpenHandles: true,
  
  // Timeout para testes
  testTimeout: 10000,
  
  // ============================================
  // COVERAGE CONFIGURATION (PARTE 3)
  // ============================================
  
  // Diretório de saída do coverage
  coverageDirectory: 'coverage',
  
  // Arquivos a serem incluídos no coverage
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
  
  // THRESHOLDS DE COVERAGE (>= 80%)
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Reporters de coverage
  coverageReporters: [
    'text',           // Output no terminal
    'text-summary',   // Resumo no terminal
    'lcov',           // Para tools como Codecov
    'html'            // Relatório HTML navegável
  ],
};

