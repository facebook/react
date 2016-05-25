/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var glob = require('glob');

var includePattern = 'src/**/*.js';
var ignorePatterns = [
  'src/**/__benchmarks__/**/*.js',
  'src/**/__tests__/**/*.js',
  'src/**/__mocks__/**/*.js',
  'src/shared/vendor/**/*.js',
];

function countFiles()/* : number */ {
  return glob.sync(includePattern, {
    ignore: ignorePatterns,
  }).length;
}

module.exports = countFiles;
