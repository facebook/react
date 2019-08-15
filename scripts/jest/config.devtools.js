'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  testRegex: 'packages/react-devtools-shared/src/__tests__/[^]+.test.js$',
  modulePathIgnorePatterns: [],
  snapshotSerializers: [
    require.resolve(
      '../../packages/react-devtools-shared/src/__tests__/inspectedElementSerializer.js'
    ),
    require.resolve(
      '../../packages/react-devtools-shared/src/__tests__/storeSerializer.js'
    ),
  ],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupHostConfigs.js'),
    require.resolve(
      '../../packages/react-devtools-shared/src/__tests__/setupEnv.js'
    ),
  ],
  // TODO (Jest v24) Rename "setupFilesAfterEnv" after Jest upgrade
  setupTestFrameworkScriptFile: require.resolve(
    '../../packages/react-devtools-shared/src/__tests__/setupTests.js'
  ),
});
