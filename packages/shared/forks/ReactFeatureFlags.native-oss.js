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
import typeof * as FeatureFlagsShimType from './ReactFeatureFlags.native-oss';

export const debugRenderPhaseSideEffectsForStrictMode = false;
export const enableUserTimingAPI = __DEV__;
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;
export const warnAboutDeprecatedLifecycles = true;
export const enableProfilerTimer = __PROFILE__;
export const enableSchedulerTracing = __PROFILE__;
export const enableSuspenseServerRenderer = false;
export const enableSelectiveHydration = false;
export const enableChunksAPI = false;
export const disableJavaScriptURLs = false;
export const disableInputAttributeSyncing = false;
export const exposeConcurrentModeAPIs = __EXPERIMENTAL__;
export const warnAboutShorthandPropertyCollision = true;
export const enableSchedulerDebugging = false;
export const enableDeprecatedFlareAPI = false;
export const enableFundamentalAPI = false;
export const enableScopeAPI = false;
export const enableJSXTransformAPI = false;
export const warnAboutUnmockedScheduler = false;
export const flushSuspenseFallbacksInTests = true;
export const enableSuspenseCallback = false;
export const warnAboutDefaultPropsOnFunctionComponents = false;
export const warnAboutStringRefs = false;
export const disableLegacyContext = false;
export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;
export const enableTrainModelFix = true;
export const enableTrustedTypesIntegration = false;
export const enableNativeTargetAsInstance = false;
export const disableCreateFactory = false;
export const disableLegacyReactDOMAPIs = false;
export const disableTextareaChildren = false;
export const disableMapsAsChildren = false;
export const disableUnstableRenderSubtreeIntoContainer = false;
export const warnUnstableRenderSubtreeIntoContainer = false;
export const disableUnstableCreatePortal = false;
export const deferPassiveEffectCleanupDuringUnmount = false;
export const isTestEnvironment = false;

// Only used in www builds.
export function addUserTimingListener() {
  invariant(false, 'Not implemented.');
}

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<FeatureFlagsShimType, FeatureFlagsType>);
