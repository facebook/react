/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

// In www, these flags are controlled by GKs. Because most GKs have some
// population running in either mode, we should run our tests that way, too,
//
// Use __VARIANT__ to simulate a GK. The tests will be run twice: once
// with the __VARIANT__ set to `true`, and once set to `false`.

export const alwaysThrottleRetries = __VARIANT__;
export const disableDefaultPropsExceptForClasses = __VARIANT__;
export const disableLegacyContextForFunctionComponents = __VARIANT__;
export const disableSchedulerTimeoutInWorkLoop = __VARIANT__;
export const enableDO_NOT_USE_disableStrictPassiveEffect = __VARIANT__;
export const enableHiddenSubtreeInsertionEffectCleanup = __VARIANT__;
export const enableNoCloningMemoCache = __VARIANT__;
export const enableObjectFiber = __VARIANT__;
export const enableRenderableContext = __VARIANT__;
export const enableRetryLaneExpiration = __VARIANT__;
export const enableTransitionTracing = __VARIANT__;
export const favorSafetyOverHydrationPerf = __VARIANT__;
export const renameElementSymbol = __VARIANT__;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

export const enableSchedulingProfiler = __VARIANT__;

export const enableInfiniteRenderLoopDetection = __VARIANT__;
export const enableSiblingPrerendering = __VARIANT__;

export const enableUseEffectCRUDOverload = __VARIANT__;
export const enableFastAddPropertiesInDiffing = __VARIANT__;
export const enableLazyPublicInstanceInFabric = false;
export const enableViewTransition = __VARIANT__;
export const enableComponentPerformanceTrack = __VARIANT__;
export const enableScrollEndPolyfill = __VARIANT__;
export const enableFragmentRefs = __VARIANT__;

export const ownerStackLimit: number = __VARIANT__
  ? // Some value that doesn't impact existing tests
    500
  : 1e4;

// TODO: These flags are hard-coded to the default values used in open source.
// Update the tests so that they pass in either mode, then set these
// to __VARIANT__.
export const enableTrustedTypesIntegration = false;
// You probably *don't* want to add more hardcoded ones.
// Instead, try to add them above with the __VARIANT__ value.
