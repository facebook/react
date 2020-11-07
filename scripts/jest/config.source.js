'use strict';

const baseConfig = require('./config.base');

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

const preferredExtension = __EXPERIMENTAL__ ? '.js' : '.stable.js';

const moduleNameMapper = {};
moduleNameMapper[
  '^react$'
] = `<rootDir>/packages/react/index${preferredExtension}`;
moduleNameMapper[
  '^react-dom$'
] = `<rootDir>/packages/react-dom/index${preferredExtension}`;

module.exports = Object.assign({}, baseConfig, {
  // Prefer the stable forks for tests.
  moduleNameMapper,
  modulePathIgnorePatterns: [
    ...baseConfig.modulePathIgnorePatterns,
    'packages/react-devtools-shared',
  ],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupHostConfigs.js'),
  ],
});
