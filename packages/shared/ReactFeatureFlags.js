/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

export const enableComponentStackLocations = true;

// -----------------------------------------------------------------------------
// Killswitch
//
// Flags that exist solely to turn off a change in case it causes a regression
// when it rolls out to prod. We should remove these as soon as possible.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------

// TODO: Finish rolling out in www
export const favorSafetyOverHydrationPerf = true;
export const enableAsyncActions = true;

// Need to remove didTimeout argument from Scheduler before landing
export const disableSchedulerTimeoutInWorkLoop = false;

// This will break some internal tests at Meta so we need to gate this until
// those can be fixed.
export const enableDeferRootSchedulingToMicrotask = true;

// TODO: Land at Meta before removing.
export const disableDefaultPropsExceptForClasses = true;

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

// Support legacy Primer support on internal FB www
export const enableLegacyFBSupport = false;

// -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------

export const enableCache = true;
export const enableLegacyCache = __EXPERIMENTAL__;

export const enableBinaryFlight = true;
export const enableFlightReadableStream = true;
export const enableAsyncIterableChildren = __EXPERIMENTAL__;

export const enableTaint = __EXPERIMENTAL__;

export const enablePostpone = __EXPERIMENTAL__;

export const enableHalt = __EXPERIMENTAL__;

/**
 * Switches the Fabric API from doing layout in commit work instead of complete work.
 */
export const enableFabricCompleteRootInCommitPhase = false;

/**
 * Switches Fiber creation to a simple object instead of a constructor.
 */
export const enableObjectFiber = false;

export const enableTransitionTracing = false;

// Shipped on FB, waiting for next stable release to roll out to OSS
export const enableLazyContextPropagation = __EXPERIMENTAL__;

// Expose unstable useContext for performance testing
export const enableContextProfiling = false;

// FB-only usage. The new API has different semantics.
export const enableLegacyHidden = false;

// Enables unstable_avoidThisFallback feature in Fiber
export const enableSuspenseAvoidThisFallback = false;
// Enables unstable_avoidThisFallback feature in Fizz
export const enableSuspenseAvoidThisFallbackFizz = false;

export const enableCPUSuspense = __EXPERIMENTAL__;

// Enables useMemoCache hook, intended as a compilation target for
// auto-memoization.
export const enableUseMemoCacheHook = true;
// Test this at Meta before enabling.
export const enableNoCloningMemoCache = false;

export const enableUseEffectEventHook = __EXPERIMENTAL__;

// Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts
export const enableFizzExternalRuntime = __EXPERIMENTAL__;

export const alwaysThrottleRetries = true;

export const passChildrenWhenCloningPersistedNodes = false;

export const enableServerComponentLogs = __EXPERIMENTAL__;

/**
 * Enables a new Fiber flag used in persisted mode to reduce the number
 * of cloned host components.
 */
export const enablePersistedModeClonedFlag = false;

export const enableAddPropertiesFastPath = false;

export const enableOwnerStacks = __EXPERIMENTAL__;

export const enableShallowPropDiffing = false;

export const enableSiblingPrerendering = __EXPERIMENTAL__;

/**
 * Enables an expiration time for retry lanes to avoid starvation.
 */
export const enableRetryLaneExpiration = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

// -----------------------------------------------------------------------------
// Ready for next major.
//
// Alias __NEXT_MAJOR__ to __EXPERIMENTAL__ for easier skimming.
// -----------------------------------------------------------------------------

// TODO: Anything that's set to `true` in this section should either be cleaned
// up (if it's on everywhere, including Meta and RN builds) or moved to a
// different section of this file.

// const __NEXT_MAJOR__ = __EXPERIMENTAL__;

// Renames the internal symbol for elements since they have changed signature/constructor
export const renameElementSymbol = true;

/**
 * Removes legacy style context defined using static `contextTypes` and consumed with static `childContextTypes`.
 */
export const disableLegacyContext = true;
/**
 * Removes legacy style context just from function components.
 */
export const disableLegacyContextForFunctionComponents = true;

// Not ready to break experimental yet.
// Modern <StrictMode /> behaviour aligns more with what components
// components will encounter in production, especially when used With <Offscreen />.
// TODO: clean up legacy <StrictMode /> once tests pass WWW.
export const useModernStrictMode = true;

// Not ready to break experimental yet.
// Remove IE and MsApp specific workarounds for innerHTML
export const disableIEWorkarounds = true;

// Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.
export const enableFilterEmptyStringAttributesDOM = true;

// Disabled caching behavior of `react/cache` in client runtimes.
export const disableClientCache = true;

/**
 * Enables a new error detection for infinite render loops from updates caused
 * by setState or similar outside of the component owning the state.
 */
export const enableInfiniteRenderLoopDetection = true;

// Subtle breaking changes to JSX runtime to make it faster, like passing `ref`
// as a normal prop instead of stripping it from the props object.

// Passes `ref` as a normal prop instead of stripping it from the props object
// during element creation.
export const enableRefAsProp = true;
export const disableStringRefs = true;

// Warn on any usage of ReactTestRenderer
export const enableReactTestRendererWarning = true;

// Disables legacy mode
// This allows us to land breaking changes to remove legacy mode APIs in experimental builds
// before removing them in stable in the next Major
export const disableLegacyMode = true;

// Make <Context> equivalent to <Context.Provider> instead of <Context.Consumer>
export const enableRenderableContext = true;

// -----------------------------------------------------------------------------
// Chopping Block
//
// Planned feature deprecations and breaking changes. Sorted roughly in order of
// when we plan to enable them.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------

// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.
export const disableCommentsAsDOMContainers = true;

export const enableTrustedTypesIntegration = false;

// Prevent the value and checked attributes from syncing with their related
// DOM properties
export const disableInputAttributeSyncing = false;

// Disables children for <textarea> elements
export const disableTextareaChildren = false;

// -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------

// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler = __PROFILE__;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

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

export const enableAsyncDebugInfo = __EXPERIMENTAL__;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = __PROFILE__;

// Internal only.
export const enableGetInspectorDataForInstanceInProduction = false;

export const consoleManagedByDevToolsDuringStrictMode = true;

export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
