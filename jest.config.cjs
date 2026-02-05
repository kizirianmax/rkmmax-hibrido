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
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
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
  // TRANSFORMAÇÃO
  // ============================================
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(recharts|victory|d3-.*|internmap|delaunay-triangulate|robust-predicates)/)',
  ],
  
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
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: true,
      },
    ],
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

