/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactGlobalSharedState
 */

'use strict';

var ReactInternals = require('react')
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

var ReactGlobalSharedState = {
  ReactCurrentOwner: ReactInternals.ReactCurrentOwner,
};

if (__DEV__) {
  Object.assign(ReactGlobalSharedState, {
    ReactDebugCurrentFrame: ReactInternals.ReactDebugCurrentFrame,
  });
}

module.exports = ReactGlobalSharedState;
