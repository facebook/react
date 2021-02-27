/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var React = require('./React');

// `version` will be added here by the React module.
var ReactUMDEntry = _assign(React, {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner: require('./ReactCurrentOwner')
  }
});

if (process.env.NODE_ENV !== 'production') {
  _assign(ReactUMDEntry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    // ReactComponentTreeHook should not be included in production.
    ReactComponentTreeHook: require('./ReactComponentTreeHook'),
    getNextDebugID: require('./getNextDebugID')
  });
}

module.exports = ReactUMDEntry;