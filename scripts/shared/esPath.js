/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const es6Path = [
  // Internal forwarding modules
  'packages/*/*.js',
  // Source files
  'packages/*/src/**/*.js',
  'packages/shared/**/*.js',
];

const es5Path = [
  // Forwarding modules that get published to npm (must be ES5)
  'packages/*/npm/**/*.js',
  // Need to work on Node
  'scripts/**/*.js',
  'fixtures/**/*.js',
];

module.exports = {
  es6Path,
  es5Path,
};
