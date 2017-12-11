/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const eslintrc = require('../../.eslintrc');

module.exports = Object.assign({}, eslintrc, {
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script',
  },
});
