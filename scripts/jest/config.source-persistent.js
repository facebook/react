'use strict';

const path = require('path');
const {find, grep} = require('shelljs');
const baseConfig = require('./config.base');

// Search for all the test files that reference react-noop-renderer
const packagesDir = path.join(process.cwd(), 'packages');
const testRegex = new RegExp(baseConfig.testRegex);
const testFiles = find('packages').filter(filename => testRegex.test(filename));
const testMatchFilesThatReferenceNoop = grep(
  '-l',
  'react-noop-renderer',
  testFiles
)
  .split('\n')
  .map(filename => `**/${path.relative(packagesDir, filename)}`);

module.exports = Object.assign({}, baseConfig, {
  // Override base regex so that we only match the files we found above.
  testRegex: null,
  testMatch: testMatchFilesThatReferenceNoop,
  modulePathIgnorePatterns: [
    ...baseConfig.modulePathIgnorePatterns,
    // These files only work in mutation mode
    'ReactIncrementalPerf',
    'ReactIncrementalUpdatesMinimalism',
    'ReactIncrementalTriangle',
    'ReactIncrementalReflection',
    'forwardRef',
  ],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupPersistent.js'),
    require.resolve('./setupHostConfigs.js'),
  ],
});
