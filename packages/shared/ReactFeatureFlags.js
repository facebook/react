/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

// Filter certain DOM attributes (e.g. src, href) if their values are empty strings.
// This prevents e.g. <img src=""> from making an unnecessary HTTP request for certain browsers.
export const enableFilterEmptyStringAttributesDOM = false;

// Adds verbose console logging for e.g. state updates, suspense, and work loop stuff.
// Intended to enable React core members to more easily debug scheduling issues in DEV builds.
export const enableDebugTracing = false;

// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler = __PROFILE__;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// Helps identify code that is not safe for planned Offscreen API and Suspense semantics;
// this feature flag only impacts StrictEffectsMode.
export const enableStrictEffects = __DEV__;

// If TRUE, trees rendered with createRoot will be StrictEffectsMode.
// If FALSE, these trees will be StrictLegacyMode.
export const createRootStrictEffectsByDefault = false;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// Warn about deprecated, async-unsafe lifecycles; relates to RFC #6:
export const warnAboutDeprecatedLifecycles = true;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __PROFILE__;

// Record durations for commit and passive effects phases.
export const enableProfilerCommitHooks = __PROFILE__;

// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
export const enableProfilerNestedUpdatePhase = __PROFILE__;

// Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.
export const enableProfilerNestedUpdateScheduledHook = false;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = __PROFILE__;

// SSR experiments
export const enableSuspenseServerRenderer = true;
export const enableSelectiveHydration = true;

// Flight experiments
export const enableLazyElements = true;
export const enableCache = __EXPERIMENTAL__;

// Only used in www builds.
export const enableSchedulerDebugging = false;

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

// Experimental Scope support.
export const enableScopeAPI = false;

// Experimental Create Event Handle API.
export const enableCreateEventHandleAPI = false;

// New API for JSX transforms to target - https://github.com/reactjs/rfcs/pull/107

// We will enforce mocking scheduler with scheduler/unstable_mock at some point. (v18?)
// Till then, we warn about the missing mock, but still fallback to a legacy mode compatible version

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

export const enableTrustedTypesIntegration = false;

// Enables a warning when trying to spread a 'key' to an element;
// a deprecated pattern we want to get rid of in the future
export const warnAboutSpreadingKeyToJSX = false;

export const warnOnSubscriptionInsideStartTransition = false;

export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseAvoidThisFallbackFizz = false;

export const enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay = true;

export const enableClientRenderFallbackOnHydrationMismatch = true;

export const enableComponentStackLocations = true;

export const enableNewReconciler = false;

export const disableNativeComponentFrames = false;

// Internal only.
export const enableGetInspectorDataForInstanceInProduction = false;

// Errors that are thrown while unmounting (or after in the case of passive effects)
// should bypass any error boundaries that are also unmounting (or have unmounted)
// and be handled by the nearest still-mounted boundary.
// If there are no still-mounted boundaries, the errors should be rethrown.
export const skipUnmountedBoundaries = false;

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

// Destroy layout effects for components that are hidden because something suspended in an update
// and recreate them when they are shown again (after the suspended boundary has resolved).
// Note that this should be an uncommon use case and can be avoided by using the transition API.
export const enableSuspenseLayoutEffectSemantics = true;

// Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347
export const enableCustomElementPropertySupport = __EXPERIMENTAL__;

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

export const disableModulePatternComponents = false;

// We should remove this flag once the above flag becomes enabled
export const warnUnstableRenderSubtreeIntoContainer = false;

// Support legacy Primer support on internal FB www
export const enableLegacyFBSupport = false;

// Updates that occur in the render phase are not officially supported. But when
// they do occur, we defer them to a subsequent render by picking a lane that's
// not currently rendering. We treat them the same as if they came from an
// interleaved event. Remove this flag once we have migrated to the
// new behavior.
export const deferRenderPhaseUpdateToNextBatch = false;

export const enableUseRefAccessWarning = false;

export const disableSchedulerTimeoutInWorkLoop = false;

export const enableLazyContextPropagation = false;

export const enableSyncDefaultUpdates = true;

export const allowConcurrentByDefault = false;

export const enablePersistentOffscreenHostContainer = false;

export const consoleManagedByDevToolsDuringStrictMode = true;

// Only enabled in www builds
export const enableUseMutableSource = false;

export const enableTransitionTracing = false;
