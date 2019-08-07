'use strict';

module.exports = {
  haste: {
    hasteImplModulePath: require.resolve('./noHaste.js'),
  },
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/rollup/shims/',
    '<rootDir>/scripts/bench/',
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
  // Jest changed from `about:blank` to `http://localhost` default in 24.5 (https://github.com/facebook/jest/pull/6792)
  // in order to address https://github.com/facebook/jest/issues/6766. If one uses `about:blank` in JSDOM@11.12 or
  // newer, it fails with `SecurityError: localStorage is not available for opaque origins`. However, some of React's
  // tests depend on `about:blank` being the domain (for e.g. `url` in `img` tags). So we set `about:blank` here to
  // keep the current behavior and make sure to keep the version of JSDOM to version lower than 11.12. This will have
  // to be addressed properly when Jest 25 is released, as it will come with a newer version of JSDOM.
  testURL: 'about:blank',
};
