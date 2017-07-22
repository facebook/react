/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFeatureFlags
 * @flow
 */

'use strict';

var ReactFeatureFlags = {
  disableNewFiberFeatures: false,
  enableAsyncSubtreeAPI: false,
  // We set this to true when running unit tests
  forceInvokeGuardedCallbackDev: false,
};

module.exports = ReactFeatureFlags;
