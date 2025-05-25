/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// TODO: this doesn't make sense for an ESLint rule.
// We need to fix our build process to not create bundles for "raw" packages like this.
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/eslint-plugin-react-hooks.production.js');
} else {
  module.exports = require('./cjs/eslint-plugin-react-hooks.development.js');
}
