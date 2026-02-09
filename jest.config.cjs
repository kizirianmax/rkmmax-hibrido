module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testTimeout: 10000,
  maxWorkers: '50%',
  forceExit: true,
  detectOpenHandles: true,
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
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
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
        '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/build/',
        '/.vercel/',
        '/src/automation/',
      ],
    },
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/.vercel/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(recharts|victory|d3-.*|internmap|delaunay-triangulate|robust-predicates)/)',
  ],
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
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
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
