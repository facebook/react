/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactUMDEntry
 */

'use strict';

var React = require('React');

// `version` will be added here by the React module.
var ReactUMDEntry = Object.assign(React, {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner: require('ReactCurrentOwner'),
  },
});

if (__DEV__) {
  Object.assign(
    ReactUMDEntry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    {
      // ReactComponentTreeHook should not be included in production.
      ReactComponentTreeHook: require('ReactComponentTreeHook'),
      getNextDebugID: require('getNextDebugID'),
    },
  );
}

module.exports = ReactUMDEntry;
