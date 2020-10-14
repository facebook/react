'use strict';

const {readdirSync, statSync} = require('fs');
const {join} = require('path');
const baseConfig = require('./config.base');

// Find all folders in packages/* with package.json
const packagesRoot = join(__dirname, '..', '..', 'packages');
const packages = readdirSync(packagesRoot).filter(dir => {
  if (dir.charAt(0) === '.') {
    return false;
  }
  if (dir.includes('react-devtools')) {
    return false;
  }
  const packagePath = join(packagesRoot, dir, 'package.json');
  let stat;
  try {
    stat = statSync(packagePath);
  } catch (err) {
    return false;
  }
  return stat.isFile();
});

// Create a module map to point React packages to the build output
const moduleNameMapper = {};

moduleNameMapper['react-devtools-feature-flags'] =
  '<rootDir>/packages/react-devtools-shared/src/config/DevToolsFeatureFlags.default';

// Map packages to bundles
packages.forEach(name => {
  // Root entry point
  moduleNameMapper[`^${name}$`] = `<rootDir>/build/node_modules/${name}`;
  // Named entry points
  moduleNameMapper[
    `^${name}\/([^\/]+)$`
  ] = `<rootDir>/build/node_modules/${name}/$1`;
});

// Allow tests to import shared code (e.g. feature flags, getStackByFiberInDevAndProd)
moduleNameMapper['^shared/([^/]+)$'] = '<rootDir>/packages/shared/$1';
moduleNameMapper['^react-reconciler/([^/]+)$'] =
  '<rootDir>/packages/react-reconciler/$1';

module.exports = Object.assign({}, baseConfig, {
  // Redirect imports to the compiled bundles
  moduleNameMapper,
  // Don't run bundle tests on -test.internal.* files
  testPathIgnorePatterns: ['/node_modules/', '-test.internal.js$'],
  // Exclude the build output from transforms
  transformIgnorePatterns: ['/node_modules/', '<rootDir>/build/'],
  testRegex: 'packages/react-devtools-shared/src/__tests__/[^]+.test.js$',
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
    require.resolve('./setupTests.build.js'),
    require.resolve(
      '../../packages/react-devtools-shared/src/__tests__/setupEnv.js'
    ),
  ],
  setupFilesAfterEnv: [
    require.resolve(
      '../../packages/react-devtools-shared/src/__tests__/setupTests.js'
    ),
  ],
});
