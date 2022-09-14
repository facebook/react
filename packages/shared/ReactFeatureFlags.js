/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

// -----------------------------------------------------------------------------
// Land or remove (zero effort)
//
// Flags that can likely be deleted or landed without consequences
// -----------------------------------------------------------------------------

export const warnAboutDeprecatedLifecycles = true;
export const enableComponentStackLocations = true;
export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;

// -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------

// This rolled out to 10% public in www, so we should be able to land, but some
// internal tests need to be updated. The open source behavior is correct.
export const skipUnmountedBoundaries = true;

// TODO: Finish rolling out in www
export const enableClientRenderFallbackOnTextMismatch = true;

// TODO: Need to review this code one more time before landing
export const enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay = true;

// Recoil still uses useMutableSource in www, need to delete
export const enableUseMutableSource = false;

// Not sure if www still uses this. We don't have a replacement but whatever we
// replace it with will likely be different than what's already there, so we
// probably should just delete it as long as nothing in www relies on it.
export const enableSchedulerDebugging = false;

// Need to remove didTimeout argument from Scheduler before landing
export const disableSchedulerTimeoutInWorkLoop = false;

// -----------------------------------------------------------------------------
// Slated for removal in the future (significant effort)
//
// These are experiments that didn't work out, and never shipped, but we can't
// delete from the codebase until we migrate internal callers.
// -----------------------------------------------------------------------------

// Add a callback property to suspense to notify which promises are currently
// in the update queue. This allows reporting and tracing of what is causing
// the user to see a loading state.
//
// Also allows hydration callbacks to fire when a dehydrated boundary gets
// hydrated or deleted.
//
// This will eventually be replaced by the Transition Tracing proposal.
export const enableSuspenseCallback = false;

// Experimental Scope support.
export const enableScopeAPI = false;

// Experimental Create Event Handle API.
export const enableCreateEventHandleAPI = false;

// This controls whether you get the `.old` modules or the `.new` modules in
// the react-reconciler package.
export const enableNewReconciler = false;

// Support legacy Primer support on internal FB www
export const enableLegacyFBSupport = false;

// -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------

export const enableCache = __EXPERIMENTAL__;
export const enableCacheElement = __EXPERIMENTAL__;

export const enableTransitionTracing = false;

// No known bugs, but needs performance testing
export const enableLazyContextPropagation = false;

// FB-only usage. The new API has different semantics.
export const enableLegacyHidden = false;

// Enables unstable_avoidThisFallback feature in Fiber
export const enableSuspenseAvoidThisFallback = false;
// Enables unstable_avoidThisFallback feature in Fizz
export const enableSuspenseAvoidThisFallbackFizz = false;

export const enableCPUSuspense = __EXPERIMENTAL__;

// When a node is unmounted, recurse into the Fiber subtree and clean out
// references. Each level cleans up more fiber fields than the previous level.
// As far as we know, React itself doesn't leak, but because the Fiber contains
// cycles, even a single leak in product code can cause us to retain large
// amounts of memory.
//
// The long term plan is to remove the cycles, but in the meantime, we clear
// additional fields to mitigate.
//
// It's an enum so that we can experiment with different levels of
// aggressiveness.
export const deletedTreeCleanUpLevel = 3;

export const enableFloat = __EXPERIMENTAL__;
export const enableUseHook = __EXPERIMENTAL__;

// Enables unstable_useMemoCache hook, intended as a compilation target for
// auto-memoization.
export const enableUseMemoCacheHook = __EXPERIMENTAL__;

export const enableUseEventHook = __EXPERIMENTAL__;

// -----------------------------------------------------------------------------
// Chopping Block
//
// Planned feature deprecations and breaking changes. Sorted roughly in order of
// when we we plan to enable them.
// -----------------------------------------------------------------------------

// This flag enables Strict Effects by default. We're not turning this on until
// after 18 because it requires migration work. Recommendation is to use
// <StrictMode /> to gradually upgrade components.
// If TRUE, trees rendered with createRoot will be StrictEffectsMode.
// If FALSE, these trees will be StrictLegacyMode.
export const createRootStrictEffectsByDefault = false;

export const disableModulePatternComponents = false;

export const disableLegacyContext = false;

export const enableUseRefAccessWarning = false;

// Enables time slicing for updates that aren't wrapped in startTransition.
export const enableSyncDefaultUpdates = true;

// Adds an opt-in to time slicing for updates that aren't wrapped in
// startTransition. Only relevant when enableSyncDefaultUpdates is disabled.
export const allowConcurrentByDefault = false;

// Updates that occur in the render phase are not officially supported. But when
// they do occur, we defer them to a subsequent render by picking a lane that's
// not currently rendering. We treat them the same as if they came from an
// interleaved event. Remove this flag once we have migrated to the
// new behavior.
// NOTE: Not sure if we'll end up doing this or not.
export const deferRenderPhaseUpdateToNextBatch = false;

// -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------

// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.
export const disableCommentsAsDOMContainers = true;

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

export const enableTrustedTypesIntegration = false;

// Prevent the value and checked attributes from syncing with their related
// DOM properties
export const disableInputAttributeSyncing = false;

// Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.
export const enableFilterEmptyStringAttributesDOM = false;

// Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347
export const enableCustomElementPropertySupport = __EXPERIMENTAL__;

// Disables children for <textarea> elements
export const disableTextareaChildren = false;

// -----------------------------------------------------------------------------
// JSX Chopping Block
//
// Similar to main Chopping Block but only flags related to JSX. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------

// New API for JSX transforms to target - https://github.com/reactjs/rfcs/pull/107

// Part of the simplification of React.createElement so we can eventually move
// from React.createElement to React.jsx
// https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md
export const warnAboutDefaultPropsOnFunctionComponents = false; // deprecate later, not 18.0

// Enables a warning when trying to spread a 'key' to an element;
// a deprecated pattern we want to get rid of in the future
export const warnAboutSpreadingKeyToJSX = false;

export const warnAboutStringRefs = false;

// -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------

// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler = __PROFILE__;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// Helps identify code that is not safe for planned Offscreen API and Suspense semantics;
// this feature flag only impacts StrictEffectsMode.
export const enableStrictEffects = __DEV__;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __PROFILE__;

// Record durations for commit and passive effects phases.
export const enableProfilerCommitHooks = __PROFILE__;

// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
export const enableProfilerNestedUpdatePhase = __PROFILE__;

// Adds verbose console logging for e.g. state updates, suspense, and work loop
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.
export const enableDebugTracing = false;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = __PROFILE__;

// Only enabled in RN, related to enableComponentStackLocations
export const disableNativeComponentFrames = false;
export const enableServerContext = __EXPERIMENTAL__;

// Internal only.
export const enableGetInspectorDataForInstanceInProduction = false;

// Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.
export const enableProfilerNestedUpdateScheduledHook = false;

export const consoleManagedByDevToolsDuringStrictMode = true;
