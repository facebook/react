/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var React = require('ReactEntry');

// Add existing internal dependencies from www codebase.
// The goal is to get rid of these with time or turn them into public APIs.
Object.assign(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
  ReactChildren: require('ReactChildren'),
  getComponentName: require('getComponentName'),
  flattenChildren: require('flattenChildren'),
});

module.exports = React;
