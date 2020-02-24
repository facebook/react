/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

export const enableUserTimingAPI = __DEV__;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in Strict Mode.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// Warn about deprecated, async-unsafe lifecycles; relates to RFC #6:
export const warnAboutDeprecatedLifecycles = true;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __PROFILE__;

// Trace which interactions trigger each commit.
export const enableSchedulerTracing = __PROFILE__;

// SSR experiments
export const enableSuspenseServerRenderer = __EXPERIMENTAL__;
export const enableSelectiveHydration = __EXPERIMENTAL__;

// Flight experiments
export const enableBlocksAPI = __EXPERIMENTAL__;

// Only used in www builds.
export const enableSchedulerDebugging = false;

// Only used in www builds.
export function addUserTimingListener() {
  throw new Error('Not implemented.');
}

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

// Warns when a combination of updates on a dom can cause a style declaration
// that clashes with a previous one https://github.com/facebook/react/pull/14181
export const warnAboutShorthandPropertyCollision = true;

// Experimental React Flare event system and event components support.
export const enableDeprecatedFlareAPI = false;

// Experimental Host Component support.
export const enableFundamentalAPI = false;

// Experimental Scope support.
export const enableScopeAPI = false;

// New API for JSX transforms to target - https://github.com/reactjs/rfcs/pull/107

// We will enforce mocking scheduler with scheduler/unstable_mock at some point. (v17?)
// Till then, we warn about the missing mock, but still fallback to a legacy mode compatible version
export const warnAboutUnmockedScheduler = false;

// For tests, we flush suspense fallbacks in an act scope;
// *except* in some of our own tests, where we test incremental loading states.
export const flushSuspenseFallbacksInTests = true;

// Add a callback property to suspense to notify which promises are currently
// in the update queue. This allows reporting and tracing of what is causing
// the user to see a loading state.
// Also allows hydration callbacks to fire when a dehydrated boundary gets
// hydrated or deleted.
export const enableSuspenseCallback = false;

// Part of the simplification of React.createElement so we can eventually move
// from React.createElement to React.jsx
// https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md
export const warnAboutDefaultPropsOnFunctionComponents = false;

export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;

export const enableTrainModelFix = true;

export const enableTrustedTypesIntegration = false;

// Flag to turn event.target and event.currentTarget in ReactNative from a reactTag to a component instance
export const enableNativeTargetAsInstance = false;

// Controls sequence of passive effect destroy and create functions.
// If this flag is off, destroy and create functions may be interleaved.
// When the flag is on, all destroy functions will be run (for all fibers)
// before any create functions are run, similar to how layout effects work.
// This flag provides a killswitch if that proves to break existing code somehow.
export const runAllPassiveEffectDestroysBeforeCreates = false;

// Controls behavior of deferred effect destroy functions during unmount.
// Previously these functions were run during commit (along with layout effects).
// Ideally we should delay these until after commit for performance reasons.
// This flag provides a killswitch if that proves to break existing code somehow.
//
// WARNING This flag only has an affect if used with runAllPassiveEffectDestroysBeforeCreates.
export const deferPassiveEffectCleanupDuringUnmount = false;

// Enables a warning when trying to spread a 'key' to an element;
// a deprecated pattern we want to get rid of in the future
export const warnAboutSpreadingKeyToJSX = false;

// --------------------------
// Future APIs to be deprecated
// --------------------------

// Prevent the value and checked attributes from syncing
// with their related DOM properties
export const disableInputAttributeSyncing = false;

export const warnAboutStringRefs = false;

export const disableLegacyContext = false;

// Disables children for <textarea> elements
export const disableTextareaChildren = false;

// Disables Maps as ReactElement children
export const disableMapsAsChildren = false;

// We should remove this flag once the above flag becomes enabled
export const warnUnstableRenderSubtreeIntoContainer = false;

// Modern event system where events get registered at roots
export const enableModernEventSystem = false;
