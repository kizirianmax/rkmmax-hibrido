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
  
  // Usar projects para separar ambientes de teste
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/api/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/api/**/*.{spec,test}.{js,jsx}',
        '<rootDir>/src/automation/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/automation/**/*.{spec,test}.{js,jsx}',
      ],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/components/**/*.{spec,test}.{js,jsx}',
      ],
    },
  ],
  
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
    'api/**/*.{js,jsx}',
    'src/**/*.{js,jsx}',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.test.{js,jsx}',
    '!**/*.spec.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/pages/**',  // Excluir páginas (sem testes por enquanto)
    '!src/prompts/**', // Excluir prompts (sem testes por enquanto)
  ],
  coverageThreshold: {
    global: {
      branches: 5,  // TODO: Aumentar para 20% conforme mais testes forem adicionados
      functions: 5,  // TODO: Aumentar para 20% conforme mais testes forem adicionados
      lines: 5,  // TODO: Aumentar para 20% conforme mais testes forem adicionados
      statements: 5,  // TODO: Aumentar para 20% conforme mais testes forem adicionados
    },
  },
  
  // ============================================
  // PADRÕES DE ARQUIVO (definidos em projects acima)
  // ============================================
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

