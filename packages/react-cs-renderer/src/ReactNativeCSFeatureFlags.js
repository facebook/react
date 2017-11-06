/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as CSFeatureFlagsType from './ReactNativeCSFeatureFlags';

export const enableAsyncSubtreeAPI = true;
export const enableAsyncSchedulingByDefaultInReactDOM = false;
export const enableReactFragment = false;
export const enableCreateRoot = false;

// React Native CS uses persistent reconciler.
export const enableMutatingReconciler = false;
export const enableNoopReconciler = false;
export const enablePersistentReconciler = true;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y=_X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<CSFeatureFlagsType, FeatureFlagsType>);
