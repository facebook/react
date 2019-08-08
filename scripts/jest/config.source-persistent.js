'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  modulePathIgnorePatterns: [
    'ReactIncrementalPerf',
    'ReactIncrementalUpdatesMinimalism',
    'ReactIncrementalTriangle',
    'ReactIncrementalReflection',
    'forwardRef',
    // ReactFreshBabelPlugin is only available for dev.
    // We need two tests here because otherwise, ReactFreshBabelPlugin-test will
    // fail due to obsolete snapshots
    process.env.NODE_ENV === 'development'
      ? '<rootDir>/packages/react-refresh/src/__tests__/ReactFreshBabelPluginProd-test.js'
      : '<rootDir>/packages/react-refresh/src/__tests__/ReactFreshBabelPlugin-test.js',
  ],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupTests.persistent.js'),
    require.resolve('./setupHostConfigs.js'),
  ],
});
