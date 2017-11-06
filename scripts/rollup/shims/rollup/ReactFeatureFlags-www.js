/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as FeatureFlagsShimType from './ReactFeatureFlags-www';

// Re-export dynamic flags from the www version.
export const {
  enableAsyncSchedulingByDefaultInReactDOM,
} = require('ReactFeatureFlags');

// The rest of the flags are static for better dead code elimination.
export const enableAsyncSubtreeAPI = true;
export const enableReactFragment = false;
export const enableCreateRoot = false;

// The www bundles only use the mutating reconciler.
export const enableMutatingReconciler = true;
export const enableNoopReconciler = false;
export const enablePersistentReconciler = false;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y=_X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<FeatureFlagsShimType, FeatureFlagsType>);
