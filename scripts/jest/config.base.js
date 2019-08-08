'use strict';

module.exports = {
  haste: {
    hasteImplModulePath: require.resolve('./noHaste.js'),
  },
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/rollup/shims/',
    '<rootDir>/scripts/bench/',
    // ReactFreshBabelPlugin is only available for dev.
    // We need two tests here because otherwise, ReactFreshBabelPlugin-test will
    // fail due to obsolete snapshots
    process.env.NODE_ENV === 'development'
      ? '<rootDir>/packages/react-refresh/src/__tests__/ReactFreshBabelPluginProd-test.js'
      : '<rootDir>/packages/react-refresh/src/__tests__/ReactFreshBabelPlugin-test.js',
  ],
  transform: {
    '.*': require.resolve('./preprocessor.js'),
  },
  setupFiles: [require.resolve('./setupEnvironment.js')],
  setupTestFrameworkScriptFile: require.resolve('./setupTests.js'),
  // Only include files directly in __tests__, not in nested folders.
  testRegex: '/__tests__/[^/]*(\\.js|\\.coffee|[^d]\\.ts)$',
  moduleFileExtensions: ['js', 'json', 'node', 'coffee', 'ts'],
  rootDir: process.cwd(),
  roots: ['<rootDir>/packages', '<rootDir>/scripts'],
  collectCoverageFrom: ['packages/**/*.js'],
  timers: 'fake',
  snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],
};
