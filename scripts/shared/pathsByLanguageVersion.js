/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

// Files that are transformed and can use ES6/Flow/JSX.
const sourcePaths = [
  // Internal forwarding modules
  'packages/*/*.js',
  // Source files
  'packages/*/src/**/*.js',
  'packages/shared/**/*.js',
  // Shims & flow
  'scripts/flow/*.js',
  'scripts/rollup/shims/**/*.js',
];

// Our internal scripts that should run on Node.
const nodePaths = ['scripts/**/*.js', 'fixtures/**/*.js'];

// Files that we distribute on npm that should be ES5-only.
const npmPaths = [
  // Forwarding modules that get published to npm (must be ES5)
  'packages/*/npm/**/*.js',
];

module.exports = {
  sourcePaths,
  nodePaths,
  npmPaths,
};
