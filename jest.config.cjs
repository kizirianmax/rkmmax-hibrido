/**
 * JEST CONFIGURATION - OTIMIZADO PARA ESTABILIDADE
 * 
 * Configuração robusta para evitar problemas de:
 * - EMFILE: Too many open files
 * - Memory leaks
 * - Timeouts
 * - Watch mode infinito
 */

module.exports = {
  // ============================================
  // AMBIENTE E SETUP
  // ============================================
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // ============================================
  // ESM SUPPORT
  // ============================================
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { 
      presets: [
        ['@babel/preset-env', { 
          targets: { node: 'current' },
          modules: 'auto'
        }],
        '@babel/preset-react'
      ]
    }]
  },
  
  // ============================================
  // TIMEOUT E PERFORMANCE
  // ============================================
  testTimeout: 10000, // 10 segundos
  maxWorkers: '50%', // Usar 50% dos CPUs
  forceExit: true, // Sair após testes (evita hang)
  detectOpenHandles: true, // Detectar handles abertos
  
  // ============================================
  // COBERTURA
  // ============================================
  collectCoverage: false, // Desativar por padrão (lento)
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    // Critical modules with high coverage requirements
    'src/utils/costOptimization.js': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    'src/utils/intelligentRouter.js': {
      branches: 60,
      functions: 100,
      lines: 80,
      statements: 80,
    },
  },
  
  // ============================================
  // PADRÕES DE ARQUIVO
  // ============================================
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/.vercel/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // ============================================
  // CACHE
  // ============================================
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // ============================================
  // LIMPEZA
  // ============================================
  clearMocks: true, // Limpar mocks entre testes
  resetMocks: true, // Reset mocks entre testes
  restoreMocks: true, // Restaurar mocks entre testes
  
  // ============================================
  // REPORTERS
  // ============================================
  reporters: [
    'default',
  ],
  
  // ============================================
  // VERBOSE
  // ============================================
  verbose: true,
  
  // ============================================
  // GLOBALS
  // ============================================
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

