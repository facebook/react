/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.www';

// Re-export dynamic flags from the www version.
export const {
  debugRenderPhaseSideEffectsForStrictMode,
  deferPassiveEffectCleanupDuringUnmount,
  disableInputAttributeSyncing,
  enableTrustedTypesIntegration,
  runAllPassiveEffectDestroysBeforeCreates,
  warnAboutShorthandPropertyCollision,
  disableSchedulerTimeoutBasedOnReactExpirationTime,
  warnAboutSpreadingKeyToJSX,
} = require('ReactFeatureFlags');

// On WWW, __EXPERIMENTAL__ is used for a new modern build.
// It's not used anywhere in production yet.

// In www, we have experimental support for gathering data
// from User Timing API calls in production. By default, we
// only emit performance.mark/measure calls in __DEV__. But if
// somebody calls addUserTimingListener() which is exposed as an
// experimental FB-only export, we call performance.mark/measure
// as long as there is more than a single listener.
export let enableUserTimingAPI = __DEV__ && !__EXPERIMENTAL__;

export const enableProfilerTimer = __PROFILE__;
export const enableSchedulerTracing = __PROFILE__;
export const enableSchedulerDebugging = true;

export const replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
export const warnAboutDeprecatedLifecycles = true;
export const disableLegacyContext = __EXPERIMENTAL__;
export const warnAboutStringRefs = false;
export const warnAboutDefaultPropsOnFunctionComponents = false;

export const enableTrainModelFix = true;

export const enableSuspenseServerRenderer = true;
export const enableSelectiveHydration = true;

export const enableBlocksAPI = true;

export const disableJavaScriptURLs = true;

let refCount = 0;
export function addUserTimingListener() {
  if (__DEV__) {
    // Noop.
    return () => {};
  }
  refCount++;
  updateFlagOutsideOfReactCallStack();
  return () => {
    refCount--;
    updateFlagOutsideOfReactCallStack();
  };
}

// The flag is intentionally updated in a timeout.
// We don't support toggling it during reconciliation or
// commit since that would cause mismatching user timing API calls.
let timeout = null;
function updateFlagOutsideOfReactCallStack() {
  if (!timeout) {
    timeout = setTimeout(() => {
      timeout = null;
      enableUserTimingAPI = refCount > 0;
    });
  }
}

export const enableDeprecatedFlareAPI = true;

export const enableFundamentalAPI = false;

export const enableScopeAPI = true;

export const warnAboutUnmockedScheduler = true;

export const enableSuspenseCallback = true;

export const flushSuspenseFallbacksInTests = true;

export const enableNativeTargetAsInstance = false;

export const disableTextareaChildren = __EXPERIMENTAL__;

export const disableMapsAsChildren = __EXPERIMENTAL__;

export const warnUnstableRenderSubtreeIntoContainer = false;

export const enableModernEventSystem = false;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<ExportsType, FeatureFlagsType>);
