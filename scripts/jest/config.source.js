'use strict';

module.exports = {
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/rollup/shims/',
    '<rootDir>/scripts/bench/',
  ],
  transform: {
    '.*': require.resolve('./preprocessor.js'),
  },
  setupFiles: [
    require.resolve('./setup.js'),
    require.resolve('./environment.js'),
  ],
  setupTestFrameworkScriptFile: require.resolve('./test-framework-setup.js'),
  testRegex: '/__tests__/.*(\\.js|\\.coffee|[^d]\\.ts)$',
  moduleFileExtensions: ['js', 'json', 'node', 'coffee', 'ts'],
  rootDir: process.cwd(),
  roots: ['<rootDir>/packages', '<rootDir>/scripts'],
  collectCoverageFrom: ['packages/**/*.js'],
  timers: 'fake',
};
