/**
 * JEST CONFIGURATION - PARTE 2
 * Configuração básica do Jest (sem thresholds de coverage ainda)
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
  
  // IMPORTANTE: SEM coverageThresholds ainda (Parte 3)
};
