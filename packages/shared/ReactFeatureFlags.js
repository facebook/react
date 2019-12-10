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

// Only used in www builds.
export const enableSchedulerDebugging = false;

// Only used in www builds.
export function addUserTimingListener() {
  throw new Error('Not implemented.');
}

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

// React Fire: prevent the value and checked attributes from syncing
// with their related DOM properties
export const disableInputAttributeSyncing = false;

// These APIs will no longer be "unstable" in the upcoming 16.7 release,
// Control this behavior with a flag to support 16.6 minor releases in the meanwhile.
export const exposeConcurrentModeAPIs = __EXPERIMENTAL__;

export const warnAboutShorthandPropertyCollision = false;

// Experimental React Flare event system and event components support.
export const enableFlareAPI = false;

// Experimental Host Component support.
export const enableFundamentalAPI = false;

// Experimental Scope support.
export const enableScopeAPI = false;

// New API for JSX transforms to target - https://github.com/reactjs/rfcs/pull/107
export const enableJSXTransformAPI = false;

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
export const warnAboutStringRefs = false;

export const disableLegacyContext = false;

export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;

export const enableTrainModelFix = __EXPERIMENTAL__;

export const enableTrustedTypesIntegration = false;

// Flag to turn event.target and event.currentTarget in ReactNative from a reactTag to a component instance
export const enableNativeTargetAsInstance = false;
