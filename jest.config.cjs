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
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // ============================================
  // TIMEOUT E PERFORMANCE
  // ============================================
  testTimeout: 10000,
  maxWorkers: '50%',
  forceExit: true,
  detectOpenHandles: true,
  
  // ============================================
  // COBERTURA - AJUSTADA PARA NOVO CÓDIGO
  // ============================================
  collectCoverage: false,
  collectCoverageFrom: [
    'api/**/*.{js,jsx}',
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  
  // ============================================
  // PADRÕES DE ARQUIVO
  // ============================================
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/.vercel/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // ============================================
  // PROJECTS - NODE AND JSDOM ENVIRONMENTS
  // ============================================
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/api/**/__tests__/**/*.{js,jsx}'],
      coverageThreshold: {
        global: {
          statements: 5,
          branches: 5,
          functions: 5,
          lines: 5
        }
      }
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx}'],
      coverageThreshold: {
        global: {
          statements: 5,
          branches: 5,
          functions: 5,
          lines: 5
        }
      }
    }
  ],
  
  // ============================================
  // TRANSFORMAÇÃO
  // ============================================
  transform: {
    '^.+\.(js|jsx)$': 'babel-jest',
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
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
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
