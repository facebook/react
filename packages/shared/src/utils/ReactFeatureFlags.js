/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFeatureFlags
 * @flow
 */

'use strict';

export type FeatureFlags = {|
  enableAsyncSubtreeAPI: boolean,
  enableAsyncSchedulingByDefaultInReactDOM: boolean,
|};

var ReactFeatureFlags: FeatureFlags = {
  enableAsyncSubtreeAPI: true,
  enableAsyncSchedulingByDefaultInReactDOM: false,
};

if (__DEV__) {
  if (Object.freeze) {
    Object.freeze(ReactFeatureFlags);
  }
}

module.exports = ReactFeatureFlags;
