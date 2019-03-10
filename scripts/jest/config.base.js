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
    'packages/((?!__tests__).)*\\.js$': require.resolve(
      './preprocessorForSourceFiles.js'
    ),
    '__tests__.*\\.js$': require.resolve('./preprocessorForTestFiles.js'),
    '\\.coffee$': require.resolve('./preprocessorForCoffeeScript.js'),
    '\\.ts$': require.resolve('./preprocessorForTypeScript.js'),
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
};
