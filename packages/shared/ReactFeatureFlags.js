/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

export const enableUserTimingAPI = __DEV__;

// Helps identify side effects in begin-phase lifecycle hooks and setState reducers:
export const debugRenderPhaseSideEffects = false;

// In some cases, StrictMode should also double-render lifecycles.
// This can be confusing for tests though,
// And it can be bad for performance in production.
// This feature flag can be used to control the behavior:
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

// Only used in www builds.
export const enableSuspenseServerRenderer = false; // TODO: __DEV__? Here it might just be false.

// Only used in www builds.
export const enableSchedulerDebugging = false;

// Only used in www builds.
export function addUserTimingListener() {
  throw new Error('Not implemented.');
}

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

// Disables yielding during render in Concurrent Mode. Used for debugging only.
export const disableYielding = false;

// React Fire: prevent the value and checked attributes from syncing
// with their related DOM properties
export const disableInputAttributeSyncing = false;

// These APIs will no longer be "unstable" in the upcoming 16.7 release,
// Control this behavior with a flag to support 16.6 minor releases in the meanwhile.
export const enableStableConcurrentModeAPIs = false;

export const warnAboutShorthandPropertyCollision = false;

// See https://github.com/react-native-community/discussions-and-proposals/issues/72 for more information
// This is a flag so we can fix warnings in RN core before turning it on
export const warnAboutDeprecatedSetNativeProps = false;

// Experimental React Events support. Only used in www builds for now.
export const enableEventAPI = false;

// New API for JSX transforms to target - https://github.com/reactjs/rfcs/pull/107
export const enableJSXTransformAPI = false;

// We will enforce mocking scheduler with scheduler/unstable_mock at some point. (v17?)
// Till then, we warn about the missing mock, but still fallback to a sync mode compatible version
export const warnAboutMissingMockScheduler = false;
// Temporary flag to revert the fix in #15650
export const revertPassiveEffectsChange = false;

// Changes priority of some events like mousemove to user-blocking priority,
// but without making them discrete. The flag exists in case it causes
// starvation problems.
export const enableUserBlockingEvents = false;
