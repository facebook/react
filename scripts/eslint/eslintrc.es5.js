/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const eslintrc = require('../../.eslintrc');

const ERROR = 2;

// We apply these settings to files that we ship through npm.
// They must be ES5.

module.exports = Object.assign({}, eslintrc, {
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script',
  },
  rules: {
    strict: ERROR,
  },
});
