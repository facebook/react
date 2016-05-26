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

module.exports = {
  includePattern: 'src/**/*.js',
  ignorePatterns: [
    'src/**/__benchmarks__/**/*.js',
    'src/**/__tests__/**/*.js',
    'src/**/__mocks__/**/*.js',
    'src/shared/vendor/**/*.js',
  ],
};
