/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const eslintrc = require('../../.eslintrc');

const ERROR = 2;

// We apply these settings to files that should run on Node.
// They can't use JSX or ES6 modules, and must be in strict mode.
// They can, however, use other ES6 features.

module.exports = Object.assign({}, eslintrc, {
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'script',
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  rules: Object.assign({}, eslintrc.rules, {
    'no-var': ERROR,
    strict: ERROR,
  }),
});
