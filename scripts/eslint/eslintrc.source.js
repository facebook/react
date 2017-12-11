/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const eslintrc = require('../../.eslintrc');

const ERROR = 2;

module.exports = Object.assign({}, eslintrc, {
  rules: Object.assign({}, eslintrc.rules, {
    'no-var': ERROR,
  }),
});
