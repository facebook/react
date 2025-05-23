'use strict';

module.exports = {
  globalSetup: require.resolve('./setupGlobal.js'),
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/rollup/shims/',
    '<rootDir>/scripts/bench/',
  ],
  transform: {
    '^.+babel-plugin-react-compiler/dist/index.js$': [
      'babel-jest',
      {
        configFile: require.resolve('../../babel.config-react-compiler.js'),
      },
    ],
    '^.+\\.ts$': [
      'babel-jest',
      {configFile: require.resolve('../../babel.config-ts.js')},
    ],
    '.(?!ts$)': require.resolve('./preprocessor.js'),
  },
  prettierPath: require.resolve('prettier-2'),
  setupFiles: [require.resolve('./setupEnvironment.js')],
  setupFilesAfterEnv: [require.resolve('./setupTests.js')],
  // Only include files directly in __tests__, not in nested folders.
  testRegex: '/__tests__/[^/]*(\\.js|\\.coffee|[^d]\\.ts)$',
  moduleFileExtensions: ['js', 'json', 'node', 'coffee', 'ts'],
  rootDir: process.cwd(),
  roots: ['<rootDir>/packages', '<rootDir>/scripts'],
  collectCoverageFrom: ['packages/**/*.js'],
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: true,
  },
  snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],

  testEnvironment: '<rootDir>/scripts/jest/ReactJSDOMEnvironment',

  testRunner: 'jest-circus/runner',
};
