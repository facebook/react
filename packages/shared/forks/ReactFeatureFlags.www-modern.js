/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as FeatureFlagsShimType from './ReactFeatureFlags.www-modern';

// Re-export dynamic flags from the www version.
export const {
  debugRenderPhaseSideEffectsForStrictMode,
  disableInputAttributeSyncing,
  enableTrustedTypesIntegration,
  deferPassiveEffectCleanupDuringUnmount,
  warnAboutShorthandPropertyCollision,
} = require('ReactFeatureFlags');

export let enableUserTimingAPI = false;

export const enableProfilerTimer = __PROFILE__;
export const enableSchedulerTracing = __PROFILE__;
export const enableSchedulerDebugging = true;

export const replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
export const warnAboutDeprecatedLifecycles = true;
export const disableLegacyContext = true;
export const warnAboutStringRefs = false;
export const warnAboutDefaultPropsOnFunctionComponents = false;
export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;

export const enableTrainModelFix = true;

export const exposeConcurrentModeAPIs = __EXPERIMENTAL__;

export const enableSuspenseServerRenderer = true;
export const enableSelectiveHydration = true;

export const enableChunksAPI = __EXPERIMENTAL__;

export const disableJavaScriptURLs = true;

export function addUserTimingListener() {
  throw new Error('Not implemented.');
}

export const enableDeprecatedFlareAPI = true;

export const enableFundamentalAPI = false;

export const enableScopeAPI = true;

export const enableJSXTransformAPI = true;

export const warnAboutUnmockedScheduler = true;

export const enableSuspenseCallback = true;

export const flushSuspenseFallbacksInTests = true;

export const enableNativeTargetAsInstance = false;

export const disableCreateFactory = false;

export const disableTextareaChildren = true;

export const disableMapsAsChildren = true;

export const disableUnstableRenderSubtreeIntoContainer = true;

export const warnUnstableRenderSubtreeIntoContainer = false;

export const disableUnstableCreatePortal = true;

export const isTestEnvironment = false;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<FeatureFlagsShimType, FeatureFlagsType>);
