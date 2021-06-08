/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

export const warnAboutSpreadingKeyToJSX = __VARIANT__;
export const disableInputAttributeSyncing = __VARIANT__;
export const enableFilterEmptyStringAttributesDOM = __VARIANT__;
export const enableLegacyFBSupport = __VARIANT__;
export const skipUnmountedBoundaries = __VARIANT__;
export const enableSuspenseLayoutEffectSemantics = __VARIANT__;

// Enable this flag to help with concurrent mode debugging.
// It logs information to the console about React scheduling, rendering, and commit phases.
//
// NOTE: This feature will only work in DEV mode; all callsites are wrapped with __DEV__.
export const enableDebugTracing = __EXPERIMENTAL__;

export const enableSchedulingProfiler = __VARIANT__;

// This only has an effect in the new reconciler. But also, the new reconciler
// is only enabled when __VARIANT__ is true. So this is set to the opposite of
// __VARIANT__ so that it's `false` when running against the new reconciler.
// Ideally we would test both against the new reconciler, but until then, we
// should test the value that is used in www. Which is `false`.
//
// Once Lanes has landed in both reconciler forks, we'll get coverage of
// both branches.
export const deferRenderPhaseUpdateToNextBatch = !__VARIANT__;

// These are already tested in both modes using the build type dimension,
// so we don't need to use __VARIANT__ to get extra coverage.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// TODO: These flags are hard-coded to the default values used in open source.
// Update the tests so that they pass in either mode, then set these
// to __VARIANT__.
export const enableTrustedTypesIntegration = false;
export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;
export const disableNativeComponentFrames = false;

export const createRootStrictEffectsByDefault = false;
export const enableStrictEffects = false;
export const enableUseRefAccessWarning = __VARIANT__;
export const deletedTreeCleanUpLevel = __VARIANT__ ? 3 : 1;

export const enableProfilerNestedUpdateScheduledHook = __VARIANT__;
export const disableSchedulerTimeoutInWorkLoop = __VARIANT__;
export const enableLazyContextPropagation = __VARIANT__;
export const enableSyncDefaultUpdates = __VARIANT__;
export const allowConcurrentByDefault = true;
