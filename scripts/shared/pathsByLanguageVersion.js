/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const sourcePath = [
  // Internal forwarding modules
  'packages/*/*.js',
  // Source files
  'packages/*/src/**/*.js',
  'packages/shared/**/*.js',
  // shims & flow
  'scripts/flow/*.js',
  'scripts/rollup/shims/**/*.js',
];

const nodePath = ['scripts/**/*.js', 'fixtures/**/*.js'];

const npmPath = [
  // Forwarding modules that get published to npm (must be ES5)
  'packages/*/npm/**/*.js',
];

module.exports = {
  sourcePath,
  nodePath,
  npmPath,
};
