'use strict';

const semver = require('semver');

const NODE_MODULES_DIR =
  process.env.RELEASE_CHANNEL === 'stable' ? 'oss-stable' : 'oss-experimental';

const REACT_VERSION = process.env.REACT_VERSION;

const moduleNameMapper = {};

if (semver.satisfies(REACT_VERSION, '16.5')) {
  moduleNameMapper[
    `^schedule$`
  ] = `<rootDir>/build/${NODE_MODULES_DIR}/schedule`;
  moduleNameMapper[
    '^schedule/tracing$'
  ] = `<rootDir>/build/${NODE_MODULES_DIR}/schedule/tracing-profiling`;
} else {
  moduleNameMapper[
    '^scheduler/tracing$'
  ] = `<rootDir>/build/${NODE_MODULES_DIR}/scheduler/tracing-profiling`;
}

if (semver.satisfies(REACT_VERSION, '<18.0')) {
  moduleNameMapper[
    '^react-dom/client$'
  ] = `<rootDir>/build/${NODE_MODULES_DIR}/react-dom`;
}

module.exports = {
  moduleNameMapper,
  setupFiles: [require.resolve('./setupTests.build-devtools-regression')],
};
