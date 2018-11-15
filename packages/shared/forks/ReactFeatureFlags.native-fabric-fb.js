/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as FabricFeatureFlagsType from './ReactFeatureFlags.native-fabric-fb';

export const debugRenderPhaseSideEffects = false;
export const debugRenderPhaseSideEffectsForStrictMode = false;
export const enableUserTimingAPI = __DEV__;
export const enableHooks = false;
export const warnAboutDeprecatedLifecycles = false;
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;
export const enableProfilerTimer = __PROFILE__;
export const enableSchedulerTracing = __PROFILE__;
export const enableSuspenseServerRenderer = false;
export const disableInputAttributeSyncing = false;
export const enableStableConcurrentModeAPIs = false;
export const warnAboutShorthandPropertyCollision = false;

// Only used in www builds.
export function addUserTimingListener() {
  invariant(false, 'Not implemented.');
}

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<FabricFeatureFlagsType, FeatureFlagsType>);
