/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function createConfig({releaseChannel, env, variant, persistent}) {
  let displayName = `${releaseChannel}-${env}`;
  if (variant === true) {
    displayName += '-variant';
  }
  if (persistent) {
    displayName += '-persistent';
  }

  const setupFiles = [];
  if (variant) {
    setupFiles.push(require.resolve('./scripts/jest/setupEnvVariant.js'));
  }
  switch (env) {
    case 'development':
      setupFiles.push(require.resolve('./scripts/jest/setupEnvDevelopment.js'));
      break;
    case 'production':
      setupFiles.push(require.resolve('./scripts/jest/setupEnvProduction.js'));
      break;
    default:
      throw new Error(`Unexpected env: ${env}`);
  }
  setupFiles.push(require.resolve('./scripts/jest/setupEnvironment.js'));
  if (persistent) {
    setupFiles.push(require.resolve('./scripts/jest/setupTests.persistent.js'));
  } else {
    switch (releaseChannel) {
      case 'www-classic':
      case 'www-modern':
        setupFiles.push(require.resolve('./scripts/jest/setupTests.www.js'));
        break;
      case 'experimental':
      case 'stable':
        // no special setup files
        break;
      default:
        throw new Error(`Unexpected release channel: ${releaseChannel}`);
    }
  }
  setupFiles.push(require.resolve('./scripts/jest/setupHostConfigs.js'));

  const modulePathIgnorePatterns = [
    '<rootDir>/scripts/rollup/shims/',
    '<rootDir>/scripts/bench/',
    'packages/react-devtools-extensions',
    'packages/react-devtools-shared',
  ];

  if (persistent) {
    modulePathIgnorePatterns.push(
      'ReactIncrementalPerf',
      'ReactIncrementalUpdatesMinimalism',
      'ReactIncrementalTriangle',
      'ReactIncrementalReflection',
      'forwardRef'
    );
  }

  return {
    displayName,
    setupFiles,
    modulePathIgnorePatterns,
    transform: {
      '.*':
        env === 'development'
          ? require.resolve('./scripts/jest/preprocessor.dev.js')
          : require.resolve('./scripts/jest/preprocessor.prod.js'),
    },
    prettierPath: require.resolve('prettier-2'),
    setupFilesAfterEnv: [require.resolve('./scripts/jest/setupTests.js')],
    // Only include files directly in __tests__, not in nested folders.
    testRegex: '/__tests__/[^/]*(\\.js|\\.coffee|[^d]\\.ts)$',
    moduleFileExtensions: ['js', 'json', 'node', 'coffee', 'ts'],
    rootDir: process.cwd(),
    roots: ['<rootDir>/packages', '<rootDir>/scripts'],
    fakeTimers: {
      enableGlobally: true,
      legacyFakeTimers: true,
    },
    snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],
    testEnvironment: 'jsdom',
    testRunner: 'jest-circus/runner',
  };
}

module.exports = {
  globalSetup: require.resolve('./scripts/jest/setupGlobal.js'),
  collectCoverageFrom: ['packages/**/*.js'],

  projects: [
    createConfig({
      releaseChannel: 'stable',
      env: 'development',
    }),
    createConfig({
      releaseChannel: 'stable',
      env: 'production',
    }),
    createConfig({
      releaseChannel: 'stable',
      env: 'development',
      persistent: true,
    }),

    createConfig({
      releaseChannel: 'experimental',
      env: 'development',
    }),
    createConfig({
      releaseChannel: 'experimental',
      env: 'production',
    }),
    createConfig({
      releaseChannel: 'experimental',
      env: 'development',
      persistent: true,
    }),

    createConfig({
      releaseChannel: 'www-classic',
      env: 'development',
      variant: false,
    }),
    createConfig({
      releaseChannel: 'www-classic',
      env: 'production',
      variant: false,
    }),
    createConfig({
      releaseChannel: 'www-classic',
      env: 'development',
      variant: true,
    }),
    createConfig({
      releaseChannel: 'www-classic',
      env: 'production',
      variant: true,
    }),

    createConfig({
      releaseChannel: 'www-modern',
      env: 'development',
      variant: false,
    }),
    createConfig({
      releaseChannel: 'www-modern',
      env: 'production',
      variant: false,
    }),
    createConfig({
      releaseChannel: 'www-modern',
      env: 'development',
      variant: true,
    }),
    createConfig({
      releaseChannel: 'www-modern',
      env: 'production',
      variant: true,
    }),
  ],
};
