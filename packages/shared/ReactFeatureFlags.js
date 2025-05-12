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

// None

// -----------------------------------------------------------------------------
// Killswitch
//
// Flags that exist solely to turn off a change in case it causes a regression
// when it rolls out to prod. We should remove these as soon as possible.
// -----------------------------------------------------------------------------

export const enableHydrationLaneScheduling = true;

// -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------

// TODO: Finish rolling out in www
export const favorSafetyOverHydrationPerf = true;

// Need to remove didTimeout argument from Scheduler before landing
export const disableSchedulerTimeoutInWorkLoop = false;

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

// Yield to the browser event loop and not just the scheduler event loop before passive effects.
// Fix gated tests that fail with this flag enabled before turning it back on.
export const enableYieldingBeforePassive = false;

// Experiment to intentionally yield less to block high framerate animations.
export const enableThrottledScheduling = false;

export const enableLegacyCache = __EXPERIMENTAL__;

export const enableAsyncIterableChildren = __EXPERIMENTAL__;

export const enableTaint = __EXPERIMENTAL__;

export const enablePostpone = __EXPERIMENTAL__;

export const enableHalt = __EXPERIMENTAL__;

export const enableViewTransition = __EXPERIMENTAL__;

export const enableSwipeTransition = __EXPERIMENTAL__;

export const enableScrollEndPolyfill = __EXPERIMENTAL__;

/**
 * Switches Fiber creation to a simple object instead of a constructor.
 */
export const enableObjectFiber = false;

export const enableTransitionTracing = false;

// FB-only usage. The new API has different semantics.
export const enableLegacyHidden = false;

// Enables unstable_avoidThisFallback feature in Fiber
export const enableSuspenseAvoidThisFallback = false;

export const enableCPUSuspense = __EXPERIMENTAL__;

// Test this at Meta before enabling.
export const enableNoCloningMemoCache = false;

export const enableUseEffectEventHook = __EXPERIMENTAL__;

// Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts
export const enableFizzExternalRuntime = __EXPERIMENTAL__;

export const alwaysThrottleRetries = true;

export const passChildrenWhenCloningPersistedNodes = false;

/**
 * Enables a new Fiber flag used in persisted mode to reduce the number
 * of cloned host components.
 */
export const enablePersistedModeClonedFlag = false;

export const enableShallowPropDiffing = false;

export const enableSiblingPrerendering = true;

export const enableEagerAlternateStateNodeCleanup = true;

/**
 * Enables an expiration time for retry lanes to avoid starvation.
 */
export const enableRetryLaneExpiration = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

/**
 * Enables a new error detection for infinite render loops from updates caused
 * by setState or similar outside of the component owning the state.
 */
export const enableInfiniteRenderLoopDetection = false;

/**
 * Experimental new hook for better managing resources in effects.
 */
export const enableUseEffectCRUDOverload = false;

export const enableFastAddPropertiesInDiffing = true;
export const enableLazyPublicInstanceInFabric = false;

export const enableFragmentRefs = __EXPERIMENTAL__;

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
 * Enables a fix to run insertion effect cleanup on hidden subtrees.
 */
export const enableHiddenSubtreeInsertionEffectCleanup = false;

/**
 * Removes legacy style context defined using static `contextTypes` and consumed with static `childContextTypes`.
 */
export const disableLegacyContext = true;
/**
 * Removes legacy style context just from function components.
 */
export const disableLegacyContextForFunctionComponents = true;

// Enable the moveBefore() alternative to insertBefore(). This preserves states of moves.
export const enableMoveBefore = __EXPERIMENTAL__;

// Disabled caching behavior of `react/cache` in client runtimes.
export const disableClientCache = true;

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

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __PROFILE__;

// Adds performance.measure() marks using Chrome extensions to allow formatted
// Component rendering tracks to show up in the Performance tab.
// This flag will be used for both Server Component and Client Component tracks.
// All calls should also be gated on enableProfilerTimer.
export const enableComponentPerformanceTrack = __EXPERIMENTAL__;

// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler: boolean =
  !enableComponentPerformanceTrack && __PROFILE__;

// Record durations for commit and passive effects phases.
export const enableProfilerCommitHooks = __PROFILE__;

// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
export const enableProfilerNestedUpdatePhase = __PROFILE__;

export const enableAsyncDebugInfo = __EXPERIMENTAL__;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = __PROFILE__;

// Internal only.
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;

export const ownerStackLimit = 1e4;
