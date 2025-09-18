module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['<rootDir>/tests/installation.test.js'],
  collectCoverageFrom: [
    'tests/**/*.js',
    '!tests/**/*.test.js',
    '!tests/setup.js',
    'lib/**/*.js',
    'bin/**/*.js',
    '!**/node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/lib/metrics/',
    '<rootDir>/lib/installer.js',
    '<rootDir>/lib/file-mapping.js',
    '<rootDir>/lib/merge-strategies.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test result processors
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml'
    }]
  ]
};