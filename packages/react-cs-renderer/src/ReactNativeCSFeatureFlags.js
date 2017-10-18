/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeCSFeatureFlags
 * @flow
 */

'use strict';

import type {FeatureFlags} from 'ReactFeatureFlags';

var ReactNativeCSFeatureFlags: FeatureFlags = {
  enableAsyncSubtreeAPI: true,
  enableAsyncSchedulingByDefaultInReactDOM: false,
  // React Native CS uses persistent reconciler.
  enableMutatingReconciler: false,
  enableNoopReconciler: false,
  enablePersistentReconciler: true,
};

module.exports = ReactNativeCSFeatureFlags;
