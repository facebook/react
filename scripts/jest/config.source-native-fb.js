'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  modulePathIgnorePatterns: [
    ...baseConfig.modulePathIgnorePatterns,
    'packages/react-devtools-extensions',
    'packages/react-devtools-shared',
    'ReactIncrementalPerf',
    'ReactIncrementalUpdatesMinimalism',
    'ReactIncrementalTriangle',
    'ReactIncrementalReflection',
    'forwardRef',
  ],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupTests.native-fb.js'),
    require.resolve('./setupHostConfigs.js'),
  ],
});
