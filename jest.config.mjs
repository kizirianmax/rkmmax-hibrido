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
      // Threshold progressivo: aumentado de 5% -> 40% apos auditoria de cobertura real.
      // Cobertura real medida (Mar 2026): ~44% stmts, ~42% branches, ~40% funcs.
      // Margem de seguranca de ~4pp para evitar falsos negativos em CI.
      // Proxima meta sugerida: 50% (quando modulos de src/pages forem cobertos).
      statements: 40,
      branches: 35,
      functions: 35,
      lines: 40
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
