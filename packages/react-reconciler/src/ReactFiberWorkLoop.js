/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_STRICT_MODE_TYPE} from 'shared/ReactSymbols';

import type {Wakeable, Thenable} from 'shared/ReactTypes';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {Lanes, Lane} from './ReactFiberLane';
import type {SuspenseState} from './ReactFiberSuspenseComponent';
import type {FunctionComponentUpdateQueue} from './ReactFiberHooks';
import type {EventPriority} from './ReactEventPriorities';
import type {
  PendingTransitionCallbacks,
  PendingBoundaries,
  Transition,
  TransitionAbort,
} from './ReactFiberTracingMarkerComponent';
import type {OffscreenInstance} from './ReactFiberActivityComponent';
import type {RenderTaskFn} from './ReactFiberRootScheduler';
import type {Resource} from './ReactFiberConfig';

import {
  enableCreateEventHandleAPI,
  enableProfilerTimer,
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableDebugTracing,
  enableSchedulingProfiler,
  disableSchedulerTimeoutInWorkLoop,
  enableUpdaterTracking,
  enableCache,
  enableTransitionTracing,
  useModernStrictMode,
  disableLegacyContext,
  alwaysThrottleRetries,
  enableInfiniteRenderLoopDetection,
  disableLegacyMode,
  disableDefaultPropsExceptForClasses,
  disableStringRefs,
} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import is from 'shared/objectIs';

import {
  // Aliased because `act` will override and push to an internal queue
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  requestPaint,
  now,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from './Scheduler';
import {
  logCommitStarted,
  logCommitStopped,
  logLayoutEffectsStarted,
  logLayoutEffectsStopped,
  logPassiveEffectsStarted,
  logPassiveEffectsStopped,
  logRenderStarted,
  logRenderStopped,
} from './DebugTracing';

import {
  resetAfterCommit,
  scheduleTimeout,
  cancelTimeout,
  noTimeout,
  afterActiveInstanceBlur,
  startSuspendingCommit,
  waitForCommitToBeReady,
  preloadInstance,
  preloadResource,
  supportsHydration,
  setCurrentUpdatePriority,
  getCurrentUpdatePriority,
  resolveUpdatePriority,
} from './ReactFiberConfig';

import {createWorkInProgress, resetWorkInProgress} from './ReactFiber';
import {isRootDehydrated} from './ReactFiberShellHydration';
import {getIsHydrating} from './ReactFiberHydrationContext';
import {
  NoMode,
  ProfileMode,
  ConcurrentMode,
  StrictLegacyMode,
  StrictEffectsMode,
  NoStrictPassiveEffectsMode,
} from './ReactTypeOfMode';
import {
  HostRoot,
  ClassComponent,
  SuspenseComponent,
  SuspenseListComponent,
  OffscreenComponent,
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
  HostComponent,
  HostHoistable,
  HostSingleton,
} from './ReactWorkTags';
import {ConcurrentRoot, LegacyRoot} from './ReactRootTags';
import type {Flags} from './ReactFiberFlags';
import {
  NoFlags,
  Incomplete,
  StoreConsistency,
  HostEffectMask,
  ForceClientRender,
  BeforeMutationMask,
  MutationMask,
  LayoutMask,
  PassiveMask,
  PlacementDEV,
  Visibility,
  MountPassiveDev,
  MountLayoutDev,
  DidDefer,
  ShouldSuspendCommit,
  MaySuspendCommit,
} from './ReactFiberFlags';
import {
  NoLanes,
  NoLane,
  SyncLane,
  claimNextRetryLane,
  includesSyncLane,
  isSubsetOfLanes,
  mergeLanes,
  removeLanes,
  pickArbitraryLane,
  includesNonIdleWork,
  includesOnlyRetries,
  includesOnlyTransitions,
  includesBlockingLane,
  includesExpiredLane,
  getNextLanes,
  getEntangledLanes,
  getLanesToRetrySynchronouslyOnError,
  upgradePendingLanesToSync,
  markRootSuspended as _markRootSuspended,
  markRootUpdated as _markRootUpdated,
  markRootPinged as _markRootPinged,
  markRootFinished,
  addFiberToLanesMap,
  movePendingFibersToMemoized,
  addTransitionToLanesMap,
  getTransitionsForLanes,
  includesSomeLane,
  OffscreenLane,
  SyncUpdateLanes,
  UpdateLanes,
  claimNextTransitionLane,
} from './ReactFiberLane';
import {
  DiscreteEventPriority,
  DefaultEventPriority,
  lowerEventPriority,
  lanesToEventPriority,
  eventPriorityToLane,
} from './ReactEventPriorities';
import {requestCurrentTransition} from './ReactFiberTransition';
import {
  SelectiveHydrationException,
  beginWork,
  replayFunctionComponent,
} from './ReactFiberBeginWork';
import {completeWork} from './ReactFiberCompleteWork';
import {unwindWork, unwindInterruptedWork} from './ReactFiberUnwindWork';
import {
  throwException,
  createRootErrorUpdate,
  createClassErrorUpdate,
  initializeClassErrorUpdate,
} from './ReactFiberThrow';
import {
  commitBeforeMutationEffects,
  commitLayoutEffects,
  commitMutationEffects,
  commitPassiveEffectDurations,
  commitPassiveMountEffects,
  commitPassiveUnmountEffects,
  disappearLayoutEffects,
  reconnectPassiveEffects,
  reappearLayoutEffects,
  disconnectPassiveEffect,
  invokeLayoutEffectMountInDEV,
  invokePassiveEffectMountInDEV,
  invokeLayoutEffectUnmountInDEV,
  invokePassiveEffectUnmountInDEV,
  accumulateSuspenseyCommit,
} from './ReactFiberCommitWork';
import {enqueueUpdate} from './ReactFiberClassUpdateQueue';
import {resetContextDependencies} from './ReactFiberNewContext';
import {
  resetHooksAfterThrow,
  resetHooksOnUnwind,
  ContextOnlyDispatcher,
} from './ReactFiberHooks';
import {DefaultAsyncDispatcher} from './ReactFiberAsyncDispatcher';
import {
  createCapturedValueAtFiber,
  type CapturedValue,
} from './ReactCapturedValue';
import {
  enqueueConcurrentRenderForLane,
  finishQueueingConcurrentUpdates,
  getConcurrentlyUpdatedLanes,
} from './ReactFiberConcurrentUpdates';

import {
  markNestedUpdateScheduled,
  recordCommitTime,
  resetNestedUpdateFlag,
  startProfilerTimer,
  stopProfilerTimerIfRunningAndRecordDelta,
  syncNestedUpdateFlag,
} from './ReactProfilerTimer';

// DEV stuff
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import {
  isRendering as ReactCurrentDebugFiberIsRenderingInDEV,
  resetCurrentFiber,
  runWithFiberInDEV,
} from './ReactCurrentFiber';
import {
  isDevToolsPresent,
  markCommitStarted,
  markCommitStopped,
  markComponentRenderStopped,
  markComponentSuspended,
  markComponentErrored,
  markLayoutEffectsStarted,
  markLayoutEffectsStopped,
  markPassiveEffectsStarted,
  markPassiveEffectsStopped,
  markRenderStarted,
  markRenderYielded,
  markRenderStopped,
  onCommitRoot as onCommitRootDevTools,
  onPostCommitRoot as onPostCommitRootDevTools,
  setIsStrictModeForDevtools,
} from './ReactFiberDevToolsHook';
import {onCommitRoot as onCommitRootTestSelector} from './ReactTestSelectors';
import {releaseCache} from './ReactFiberCacheComponent';
import {
  isLegacyActEnvironment,
  isConcurrentActEnvironment,
} from './ReactFiberAct';
import {processTransitionCallbacks} from './ReactFiberTracingMarkerComponent';
import {
  SuspenseException,
  SuspenseyCommitException,
  getSuspendedThenable,
  isThenableResolved,
} from './ReactFiberThenable';
import {schedulePostPaintCallback} from './ReactPostPaintCallback';
import {
  getSuspenseHandler,
  getShellBoundary,
} from './ReactFiberSuspenseContext';
import {resolveDefaultPropsOnNonClassComponent} from './ReactFiberLazyComponent';
import {resetChildReconcilerOnUnwind} from './ReactChildFiber';
import {
  ensureRootIsScheduled,
  flushSyncWorkOnAllRoots,
  flushSyncWorkOnLegacyRootsOnly,
  getContinuationForRoot,
  requestTransitionLane,
} from './ReactFiberRootScheduler';
import {getMaskedContext, getUnmaskedContext} from './ReactFiberContext';
import {peekEntangledActionLane} from './ReactFiberAsyncAction';
import {logUncaughtError} from './ReactFiberErrorLogger';

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const RootInProgress = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;
const RootDidNotComplete = 6;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;
// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

opaque type SuspendedReason = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
const NotSuspended: SuspendedReason = 0;
const SuspendedOnError: SuspendedReason = 1;
const SuspendedOnData: SuspendedReason = 2;
const SuspendedOnImmediate: SuspendedReason = 3;
const SuspendedOnInstance: SuspendedReason = 4;
const SuspendedOnInstanceAndReadyToContinue: SuspendedReason = 5;
const SuspendedOnDeprecatedThrowPromise: SuspendedReason = 6;
const SuspendedAndReadyToContinue: SuspendedReason = 7;
const SuspendedOnHydration: SuspendedReason = 8;

// When this is true, the work-in-progress fiber just suspended (or errored) and
// we've yet to unwind the stack. In some cases, we may yield to the main thread
// after this happens. If the fiber is pinged before we resume, we can retry
// immediately instead of unwinding the stack.
let workInProgressSuspendedReason: SuspendedReason = NotSuspended;
let workInProgressThrownValue: mixed = null;

// Whether a ping listener was attached during this render. This is slightly
// different that whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).
let workInProgressRootDidAttachPingListener: boolean = false;

// A contextual version of workInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with entangledRenderLanes.
export let entangledRenderLanes: Lanes = NoLanes;

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootInProgress;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootInterleavedUpdatedLanes: Lanes = NoLanes;
// Lanes that were updated during the render phase (*not* an interleaved event).
let workInProgressRootRenderPhaseUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;
// If this lane scheduled deferred work, this is the lane of the deferred task.
let workInProgressDeferredLane: Lane = NoLane;
// Errors that are thrown during the render phase.
let workInProgressRootConcurrentErrors: Array<CapturedValue<mixed>> | null =
  null;
// These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.
let workInProgressRootRecoverableErrors: Array<CapturedValue<mixed>> | null =
  null;

// Tracks when an update occurs during the render phase.
let workInProgressRootDidIncludeRecursiveRenderUpdate: boolean = false;
// Thacks when an update occurs during the commit phase. It's a separate
// variable from the one for renders because the commit phase may run
// concurrently to a render phase.
let didIncludeCommitPhaseUpdate: boolean = false;

// The most recent time we either committed a fallback, or when a fallback was
// filled in with the resolved UI. This lets us throttle the appearance of new
// content as it streams in, to minimize jank.
// TODO: Think of a better name for this variable?
let globalMostRecentFallbackTime: number = 0;
const FALLBACK_THROTTLE_MS: number = 300;

// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime: number = Infinity;
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
const RENDER_TIMEOUT_MS = 500;

let workInProgressTransitions: Array<Transition> | null = null;
export function getWorkInProgressTransitions(): null | Array<Transition> {
  return workInProgressTransitions;
}

let currentPendingTransitionCallbacks: PendingTransitionCallbacks | null = null;
let currentEndTime: number | null = null;

export function addTransitionStartCallbackToPendingTransition(
  transition: Transition,
) {
  if (enableTransitionTracing) {
    if (currentPendingTransitionCallbacks === null) {
      currentPendingTransitionCallbacks = {
        transitionStart: [],
        transitionProgress: null,
        transitionComplete: null,
        markerProgress: null,
        markerIncomplete: null,
        markerComplete: null,
      };
    }

    if (currentPendingTransitionCallbacks.transitionStart === null) {
      currentPendingTransitionCallbacks.transitionStart =
        ([]: Array<Transition>);
    }

    currentPendingTransitionCallbacks.transitionStart.push(transition);
  }
}

export function addMarkerProgressCallbackToPendingTransition(
  markerName: string,
  transitions: Set<Transition>,
  pendingBoundaries: PendingBoundaries,
) {
  if (enableTransitionTracing) {
    if (currentPendingTransitionCallbacks === null) {
      currentPendingTransitionCallbacks = ({
        transitionStart: null,
        transitionProgress: null,
        transitionComplete: null,
        markerProgress: new Map(),
        markerIncomplete: null,
        markerComplete: null,
      }: PendingTransitionCallbacks);
    }

    if (currentPendingTransitionCallbacks.markerProgress === null) {
      currentPendingTransitionCallbacks.markerProgress = new Map();
    }

    currentPendingTransitionCallbacks.markerProgress.set(markerName, {
      pendingBoundaries,
      transitions,
    });
  }
}

export function addMarkerIncompleteCallbackToPendingTransition(
  markerName: string,
  transitions: Set<Transition>,
  aborts: Array<TransitionAbort>,
) {
  if (enableTransitionTracing) {
    if (currentPendingTransitionCallbacks === null) {
      currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: null,
        transitionComplete: null,
        markerProgress: null,
        markerIncomplete: new Map(),
        markerComplete: null,
      };
    }

    if (currentPendingTransitionCallbacks.markerIncomplete === null) {
      currentPendingTransitionCallbacks.markerIncomplete = new Map();
    }

    currentPendingTransitionCallbacks.markerIncomplete.set(markerName, {
      transitions,
      aborts,
    });
  }
}

export function addMarkerCompleteCallbackToPendingTransition(
  markerName: string,
  transitions: Set<Transition>,
) {
  if (enableTransitionTracing) {
    if (currentPendingTransitionCallbacks === null) {
      currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: null,
        transitionComplete: null,
        markerProgress: null,
        markerIncomplete: null,
        markerComplete: new Map(),
      };
    }

    if (currentPendingTransitionCallbacks.markerComplete === null) {
      currentPendingTransitionCallbacks.markerComplete = new Map();
    }

    currentPendingTransitionCallbacks.markerComplete.set(
      markerName,
      transitions,
    );
  }
}

export function addTransitionProgressCallbackToPendingTransition(
  transition: Transition,
  boundaries: PendingBoundaries,
) {
  if (enableTransitionTracing) {
    if (currentPendingTransitionCallbacks === null) {
      currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: new Map(),
        transitionComplete: null,
        markerProgress: null,
        markerIncomplete: null,
        markerComplete: null,
      };
    }

    if (currentPendingTransitionCallbacks.transitionProgress === null) {
      currentPendingTransitionCallbacks.transitionProgress = new Map();
    }

    currentPendingTransitionCallbacks.transitionProgress.set(
      transition,
      boundaries,
    );
  }
}

export function addTransitionCompleteCallbackToPendingTransition(
  transition: Transition,
) {
  if (enableTransitionTracing) {
    if (currentPendingTransitionCallbacks === null) {
      currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: null,
        transitionComplete: [],
        markerProgress: null,
        markerIncomplete: null,
        markerComplete: null,
      };
    }

    if (currentPendingTransitionCallbacks.transitionComplete === null) {
      currentPendingTransitionCallbacks.transitionComplete =
        ([]: Array<Transition>);
    }

    currentPendingTransitionCallbacks.transitionComplete.push(transition);
  }
}

function resetRenderTimer() {
  workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS;
}

export function getRenderTargetTime(): number {
  return workInProgressRootRenderTargetTime;
}

let legacyErrorBoundariesThatAlreadyFailed: Set<mixed> | null = null;

let rootDoesHavePassiveEffects: boolean = false;
let rootWithPendingPassiveEffects: FiberRoot | null = null;
let pendingPassiveEffectsLanes: Lanes = NoLanes;
let pendingPassiveProfilerEffects: Array<Fiber> = [];
let pendingPassiveEffectsRemainingLanes: Lanes = NoLanes;
let pendingPassiveTransitions: Array<Transition> | null = null;

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;
let isFlushingPassiveEffects = false;
let didScheduleUpdateDuringPassiveEffects = false;

const NESTED_PASSIVE_UPDATE_LIMIT = 50;
let nestedPassiveUpdateCount: number = 0;
let rootWithPassiveNestedUpdates: FiberRoot | null = null;

let isRunningInsertionEffect = false;

export function getWorkInProgressRoot(): FiberRoot | null {
  return workInProgressRoot;
}

export function getWorkInProgressRootRenderLanes(): Lanes {
  return workInProgressRootRenderLanes;
}

export function isWorkLoopSuspendedOnData(): boolean {
  return workInProgressSuspendedReason === SuspendedOnData;
}

export function getCurrentTime(): number {
  return now();
}

export function requestUpdateLane(fiber: Fiber): Lane {
  // Special cases
  const mode = fiber.mode;
  if (!disableLegacyMode && (mode & ConcurrentMode) === NoMode) {
    return (SyncLane: Lane);
  } else if (
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    // This is a render phase update. These are not officially supported. The
    // old behavior is to give this the same "thread" (lanes) as
    // whatever is currently rendering. So if you call `setState` on a component
    // that happens later in the same render, it will flush. Ideally, we want to
    // remove the special case and treat them as if they came from an
    // interleaved event. Regardless, this pattern is not officially supported.
    // This behavior is only a fallback. The flag only exists until we can roll
    // out the setState warning, since existing code might accidentally rely on
    // the current behavior.
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  const transition = requestCurrentTransition();
  if (transition !== null) {
    if (__DEV__) {
      if (!transition._updatedFibers) {
        transition._updatedFibers = new Set();
      }
      transition._updatedFibers.add(fiber);
    }

    const actionScopeLane = peekEntangledActionLane();
    return actionScopeLane !== NoLane
      ? // We're inside an async action scope. Reuse the same lane.
        actionScopeLane
      : // We may or may not be inside an async action scope. If we are, this
        // is the first update in that scope. Either way, we need to get a
        // fresh transition lane.
        requestTransitionLane(transition);
  }

  return eventPriorityToLane(resolveUpdatePriority());
}

function requestRetryLane(fiber: Fiber) {
  // This is a fork of `requestUpdateLane` designed specifically for Suspense
  // "retries" — a special update that attempts to flip a Suspense boundary
  // from its placeholder state to its primary/resolved state.

  // Special cases
  const mode = fiber.mode;
  if (!disableLegacyMode && (mode & ConcurrentMode) === NoMode) {
    return (SyncLane: Lane);
  }

  return claimNextRetryLane();
}

export function requestDeferredLane(): Lane {
  if (workInProgressDeferredLane === NoLane) {
    // If there are multiple useDeferredValue hooks in the same render, the
    // tasks that they spawn should all be batched together, so they should all
    // receive the same lane.

    // Check the priority of the current render to decide the priority of the
    // deferred task.

    // OffscreenLane is used for prerendering, but we also use OffscreenLane
    // for incremental hydration. It's given the lowest priority because the
    // initial HTML is the same as the final UI. But useDeferredValue during
    // hydration is an exception — we need to upgrade the UI to the final
    // value. So if we're currently hydrating, we treat it like a transition.
    const isPrerendering =
      includesSomeLane(workInProgressRootRenderLanes, OffscreenLane) &&
      !getIsHydrating();
    if (isPrerendering) {
      // There's only one OffscreenLane, so if it contains deferred work, we
      // should just reschedule using the same lane.
      workInProgressDeferredLane = OffscreenLane;
    } else {
      // Everything else is spawned as a transition.
      workInProgressDeferredLane = claimNextTransitionLane();
    }
  }

  // Mark the parent Suspense boundary so it knows to spawn the deferred lane.
  const suspenseHandler = getSuspenseHandler();
  if (suspenseHandler !== null) {
    // TODO: As an optimization, we shouldn't entangle the lanes at the root; we
    // can entangle them using the baseLanes of the Suspense boundary instead.
    // We only need to do something special if there's no Suspense boundary.
    suspenseHandler.flags |= DidDefer;
  }

  return workInProgressDeferredLane;
}

export function peekDeferredLane(): Lane {
  return workInProgressDeferredLane;
}

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
) {
  if (__DEV__) {
    if (isRunningInsertionEffect) {
      console.error('useInsertionEffect must not schedule updates.');
    }
  }

  if (__DEV__) {
    if (isFlushingPassiveEffects) {
      didScheduleUpdateDuringPassiveEffects = true;
    }
  }

  // Check if the work loop is currently suspended and waiting for data to
  // finish loading.
  if (
    // Suspended render phase
    (root === workInProgressRoot &&
      workInProgressSuspendedReason === SuspendedOnData) ||
    // Suspended commit phase
    root.cancelPendingCommit !== null
  ) {
    // The incoming update might unblock the current render. Interrupt the
    // current attempt and restart from the top.
    prepareFreshStack(root, NoLanes);
    markRootSuspended(
      root,
      workInProgressRootRenderLanes,
      workInProgressDeferredLane,
    );
  }

  // Mark that the root has a pending update.
  markRootUpdated(root, lane);

  if (
    (executionContext & RenderContext) !== NoLanes &&
    root === workInProgressRoot
  ) {
    // This update was dispatched during the render phase. This is a mistake
    // if the update originates from user space (with the exception of local
    // hook updates, which are handled differently and don't reach this
    // function), but there are some internal React features that use this as
    // an implementation detail, like selective hydration.
    warnAboutRenderPhaseUpdatesInDEV(fiber);

    // Track lanes that were updated during the render phase
    workInProgressRootRenderPhaseUpdatedLanes = mergeLanes(
      workInProgressRootRenderPhaseUpdatedLanes,
      lane,
    );
  } else {
    // This is a normal update, scheduled from outside the render phase. For
    // example, during an input event.
    if (enableUpdaterTracking) {
      if (isDevToolsPresent) {
        addFiberToLanesMap(root, fiber, lane);
      }
    }

    warnIfUpdatesNotWrappedWithActDEV(fiber);

    if (enableTransitionTracing) {
      const transition = ReactSharedInternals.T;
      if (transition !== null && transition.name != null) {
        if (transition.startTime === -1) {
          transition.startTime = now();
        }

        // $FlowFixMe[prop-missing]: The BatchConfigTransition and Transition types are incompatible but was previously untyped and thus uncaught
        // $FlowFixMe[incompatible-call]: "
        addTransitionToLanesMap(root, transition, lane);
      }
    }

    if (root === workInProgressRoot) {
      // Received an update to a tree that's in the middle of rendering. Mark
      // that there was an interleaved update work on this root.
      if ((executionContext & RenderContext) === NoContext) {
        workInProgressRootInterleavedUpdatedLanes = mergeLanes(
          workInProgressRootInterleavedUpdatedLanes,
          lane,
        );
      }
      if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
        // The root already suspended with a delay, which means this render
        // definitely won't finish. Since we have a new update, let's mark it as
        // suspended now, right before marking the incoming update. This has the
        // effect of interrupting the current render and switching to the update.
        // TODO: Make sure this doesn't override pings that happen while we've
        // already started rendering.
        markRootSuspended(
          root,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane,
        );
      }
    }

    ensureRootIsScheduled(root);
    if (
      lane === SyncLane &&
      executionContext === NoContext &&
      !disableLegacyMode &&
      (fiber.mode & ConcurrentMode) === NoMode
    ) {
      if (__DEV__ && ReactSharedInternals.isBatchingLegacy) {
        // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
      } else {
        // Flush the synchronous work now, unless we're already working or inside
        // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
        // scheduleCallbackForFiber to preserve the ability to schedule a callback
        // without immediately flushing it. We only do this for user-initiated
        // updates, to preserve historical behavior of legacy mode.
        resetRenderTimer();
        flushSyncWorkOnLegacyRootsOnly();
      }
    }
  }
}

export function scheduleInitialHydrationOnRoot(root: FiberRoot, lane: Lane) {
  // This is a special fork of scheduleUpdateOnFiber that is only used to
  // schedule the initial hydration of a root that has just been created. Most
  // of the stuff in scheduleUpdateOnFiber can be skipped.
  //
  // The main reason for this separate path, though, is to distinguish the
  // initial children from subsequent updates. In fully client-rendered roots
  // (createRoot instead of hydrateRoot), all top-level renders are modeled as
  // updates, but hydration roots are special because the initial render must
  // match what was rendered on the server.
  const current = root.current;
  current.lanes = lane;
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

export function isUnsafeClassRenderPhaseUpdate(fiber: Fiber): boolean {
  // Check if this is a render phase update. Only called by class components,
  // which special (deprecated) behavior for UNSAFE_componentWillReceive props.
  return (executionContext & RenderContext) !== NoContext;
}

// This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.
export function performConcurrentWorkOnRoot(
  root: FiberRoot,
  didTimeout: boolean,
): RenderTaskFn | null {
  if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
    resetNestedUpdateFlag();
  }

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.');
  }

  // Flush any pending passive effects before deciding which lanes to work on,
  // in case they schedule additional work.
  const originalCallbackNode = root.callbackNode;
  const didFlushPassiveEffects = flushPassiveEffects();
  if (didFlushPassiveEffects) {
    // Something in the passive effect phase may have canceled the current task.
    // Check if the task node for this root was changed.
    if (root.callbackNode !== originalCallbackNode) {
      // The current task was canceled. Exit. We don't need to call
      // `ensureRootIsScheduled` because the check above implies either that
      // there's a new task, or that there's no remaining work on this root.
      return null;
    } else {
      // Current task was not canceled. Continue.
    }
  }

  // Determine the next lanes to work on, using the fields stored
  // on the root.
  // TODO: This was already computed in the caller. Pass it as an argument.
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  );
  if (lanes === NoLanes) {
    // Defensive coding. This is never expected to happen.
    return null;
  }

  // We disable time-slicing in some cases: if the work has been CPU-bound
  // for too long ("expired" work, to prevent starvation), or we're in
  // sync-updates-by-default mode.
  // TODO: We only check `didTimeout` defensively, to account for a Scheduler
  // bug we're still investigating. Once the bug in Scheduler is fixed,
  // we can remove this, since we track expiration ourselves.
  const shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes) &&
    (disableSchedulerTimeoutInWorkLoop || !didTimeout);
  let exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);

  if (exitStatus !== RootInProgress) {
    let renderWasConcurrent = shouldTimeSlice;
    do {
      if (exitStatus === RootDidNotComplete) {
        // The render unwound without completing the tree. This happens in special
        // cases where need to exit the current render without producing a
        // consistent tree or committing.
        markRootSuspended(root, lanes, NoLane);
      } else {
        // The render completed.

        // Check if this render may have yielded to a concurrent event, and if so,
        // confirm that any newly rendered stores are consistent.
        // TODO: It's possible that even a concurrent render may never have yielded
        // to the main thread, if it was fast enough, or if it expired. We could
        // skip the consistency check in that case, too.
        const finishedWork: Fiber = (root.current.alternate: any);
        if (
          renderWasConcurrent &&
          !isRenderConsistentWithExternalStores(finishedWork)
        ) {
          // A store was mutated in an interleaved event. Render again,
          // synchronously, to block further mutations.
          exitStatus = renderRootSync(root, lanes);
          // We assume the tree is now consistent because we didn't yield to any
          // concurrent events.
          renderWasConcurrent = false;
          // Need to check the exit status again.
          continue;
        }

        // Check if something threw
        if (exitStatus === RootErrored) {
          const lanesThatJustErrored = lanes;
          const errorRetryLanes = getLanesToRetrySynchronouslyOnError(
            root,
            lanesThatJustErrored,
          );
          if (errorRetryLanes !== NoLanes) {
            lanes = errorRetryLanes;
            exitStatus = recoverFromConcurrentError(
              root,
              lanesThatJustErrored,
              errorRetryLanes,
            );
            renderWasConcurrent = false;
            // Need to check the exit status again.
            if (exitStatus !== RootErrored) {
              // The root did not error this time. Restart the exit algorithm
              // from the beginning.
              // TODO: Refactor the exit algorithm to be less confusing. Maybe
              // more branches + recursion instead of a loop. I think the only
              // thing that causes it to be a loop is the RootDidNotComplete
              // check. If that's true, then we don't need a loop/recursion
              // at all.
              continue;
            } else {
              // The root errored yet again. Proceed to commit the tree.
            }
          }
        }
        if (exitStatus === RootFatalErrored) {
          prepareFreshStack(root, NoLanes);
          markRootSuspended(root, lanes, NoLane);
          break;
        }

        // We now have a consistent tree. The next step is either to commit it,
        // or, if something suspended, wait to commit it after a timeout.
        root.finishedWork = finishedWork;
        root.finishedLanes = lanes;
        finishConcurrentRender(root, exitStatus, finishedWork, lanes);
      }
      break;
    } while (true);
  }

  ensureRootIsScheduled(root);
  return getContinuationForRoot(root, originalCallbackNode);
}

function recoverFromConcurrentError(
  root: FiberRoot,
  originallyAttemptedLanes: Lanes,
  errorRetryLanes: Lanes,
) {
  // If an error occurred during hydration, discard server response and fall
  // back to client side render.

  // Before rendering again, save the errors from the previous attempt.
  const errorsFromFirstAttempt = workInProgressRootConcurrentErrors;

  const wasRootDehydrated = supportsHydration && isRootDehydrated(root);
  if (wasRootDehydrated) {
    // The shell failed to hydrate. Set a flag to force a client rendering
    // during the next attempt. To do this, we call prepareFreshStack now
    // to create the root work-in-progress fiber. This is a bit weird in terms
    // of factoring, because it relies on renderRootSync not calling
    // prepareFreshStack again in the call below, which happens because the
    // root and lanes haven't changed.
    //
    // TODO: I think what we should do is set ForceClientRender inside
    // throwException, like we do for nested Suspense boundaries. The reason
    // it's here instead is so we can switch to the synchronous work loop, too.
    // Something to consider for a future refactor.
    const rootWorkInProgress = prepareFreshStack(root, errorRetryLanes);
    rootWorkInProgress.flags |= ForceClientRender;
  }

  const exitStatus = renderRootSync(root, errorRetryLanes);
  if (exitStatus !== RootErrored) {
    // Successfully finished rendering on retry

    if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
      // During the synchronous render, we attached additional ping listeners.
      // This is highly suggestive of an uncached promise (though it's not the
      // only reason this would happen). If it was an uncached promise, then
      // it may have masked a downstream error from ocurring without actually
      // fixing it. Example:
      //
      //    use(Promise.resolve('uncached'))
      //    throw new Error('Oops!')
      //
      // When this happens, there's a conflict between blocking potential
      // concurrent data races and unwrapping uncached promise values. We
      // have to choose one or the other. Because the data race recovery is
      // a last ditch effort, we'll disable it.
      root.errorRecoveryDisabledLanes = mergeLanes(
        root.errorRecoveryDisabledLanes,
        originallyAttemptedLanes,
      );

      // Mark the current render as suspended and force it to restart. Once
      // these lanes finish successfully, we'll re-enable the error recovery
      // mechanism for subsequent updates.
      workInProgressRootInterleavedUpdatedLanes |= originallyAttemptedLanes;
      return RootSuspendedWithDelay;
    }

    // The errors from the failed first attempt have been recovered. Add
    // them to the collection of recoverable errors. We'll log them in the
    // commit phase.
    const errorsFromSecondAttempt = workInProgressRootRecoverableErrors;
    workInProgressRootRecoverableErrors = errorsFromFirstAttempt;
    // The errors from the second attempt should be queued after the errors
    // from the first attempt, to preserve the causal sequence.
    if (errorsFromSecondAttempt !== null) {
      queueRecoverableErrors(errorsFromSecondAttempt);
    }
  } else {
    // The UI failed to recover.
  }
  return exitStatus;
}

export function queueRecoverableErrors(errors: Array<CapturedValue<mixed>>) {
  if (workInProgressRootRecoverableErrors === null) {
    workInProgressRootRecoverableErrors = errors;
  } else {
    // $FlowFixMe[method-unbinding]
    workInProgressRootRecoverableErrors.push.apply(
      workInProgressRootRecoverableErrors,
      errors,
    );
  }
}

function finishConcurrentRender(
  root: FiberRoot,
  exitStatus: RootExitStatus,
  finishedWork: Fiber,
  lanes: Lanes,
) {
  // TODO: The fact that most of these branches are identical suggests that some
  // of the exit statuses are not best modeled as exit statuses and should be
  // tracked orthogonally.
  switch (exitStatus) {
    case RootInProgress:
    case RootFatalErrored: {
      throw new Error('Root did not complete. This is a bug in React.');
    }
    case RootSuspendedWithDelay: {
      if (includesOnlyTransitions(lanes)) {
        // This is a transition, so we should exit without committing a
        // placeholder and without scheduling a timeout. Delay indefinitely
        // until we receive more data.
        markRootSuspended(root, lanes, workInProgressDeferredLane);
        return;
      }
      // Commit the placeholder.
      break;
    }
    case RootErrored: {
      // This render errored. Ignore any recoverable errors because we weren't actually
      // able to recover. Instead, whatever the final errors were is the ones we log.
      // This ensures that we only log the actual client side error if it's just a plain
      // error thrown from a component on the server and the client.
      workInProgressRootRecoverableErrors = null;
      break;
    }
    case RootSuspended:
    case RootCompleted: {
      break;
    }
    default: {
      throw new Error('Unknown root exit status.');
    }
  }

  if (shouldForceFlushFallbacksInDEV()) {
    // We're inside an `act` scope. Commit immediately.
    commitRoot(
      root,
      workInProgressRootRecoverableErrors,
      workInProgressTransitions,
      workInProgressRootDidIncludeRecursiveRenderUpdate,
      workInProgressDeferredLane,
    );
  } else {
    if (
      includesOnlyRetries(lanes) &&
      (alwaysThrottleRetries || exitStatus === RootSuspended)
    ) {
      // This render only included retries, no updates. Throttle committing
      // retries so that we don't show too many loading states too quickly.
      const msUntilTimeout =
        globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now();

      // Don't bother with a very short suspense time.
      if (msUntilTimeout > 10) {
        markRootSuspended(root, lanes, workInProgressDeferredLane);

        const nextLanes = getNextLanes(root, NoLanes);
        if (nextLanes !== NoLanes) {
          // There's additional work we can do on this root. We might as well
          // attempt to work on that while we're suspended.
          return;
        }

        // The render is suspended, it hasn't timed out, and there's no
        // lower priority work to do. Instead of committing the fallback
        // immediately, wait for more data to arrive.
        // TODO: Combine retry throttling with Suspensey commits. Right now they
        // run one after the other.
        root.timeoutHandle = scheduleTimeout(
          commitRootWhenReady.bind(
            null,
            root,
            finishedWork,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions,
            workInProgressRootDidIncludeRecursiveRenderUpdate,
            lanes,
            workInProgressDeferredLane,
          ),
          msUntilTimeout,
        );
        return;
      }
    }
    commitRootWhenReady(
      root,
      finishedWork,
      workInProgressRootRecoverableErrors,
      workInProgressTransitions,
      workInProgressRootDidIncludeRecursiveRenderUpdate,
      lanes,
      workInProgressDeferredLane,
    );
  }
}

function commitRootWhenReady(
  root: FiberRoot,
  finishedWork: Fiber,
  recoverableErrors: Array<CapturedValue<mixed>> | null,
  transitions: Array<Transition> | null,
  didIncludeRenderPhaseUpdate: boolean,
  lanes: Lanes,
  spawnedLane: Lane,
) {
  // TODO: Combine retry throttling with Suspensey commits. Right now they run
  // one after the other.
  const BothVisibilityAndMaySuspendCommit = Visibility | MaySuspendCommit;
  const subtreeFlags = finishedWork.subtreeFlags;
  if (
    subtreeFlags & ShouldSuspendCommit ||
    (subtreeFlags & BothVisibilityAndMaySuspendCommit) ===
      BothVisibilityAndMaySuspendCommit
  ) {
    // Before committing, ask the renderer whether the host tree is ready.
    // If it's not, we'll wait until it notifies us.
    startSuspendingCommit();
    // This will walk the completed fiber tree and attach listeners to all
    // the suspensey resources. The renderer is responsible for accumulating
    // all the load events. This all happens in a single synchronous
    // transaction, so it track state in its own module scope.
    accumulateSuspenseyCommit(finishedWork);
    // At the end, ask the renderer if it's ready to commit, or if we should
    // suspend. If it's not ready, it will return a callback to subscribe to
    // a ready event.
    const schedulePendingCommit = waitForCommitToBeReady();
    if (schedulePendingCommit !== null) {
      // NOTE: waitForCommitToBeReady returns a subscribe function so that we
      // only allocate a function if the commit isn't ready yet. The other
      // pattern would be to always pass a callback to waitForCommitToBeReady.

      // Not yet ready to commit. Delay the commit until the renderer notifies
      // us that it's ready. This will be canceled if we start work on the
      // root again.
      root.cancelPendingCommit = schedulePendingCommit(
        commitRoot.bind(
          null,
          root,
          recoverableErrors,
          transitions,
          didIncludeRenderPhaseUpdate,
        ),
      );
      markRootSuspended(root, lanes, spawnedLane);
      return;
    }
  }

  // Otherwise, commit immediately.
  commitRoot(
    root,
    recoverableErrors,
    transitions,
    didIncludeRenderPhaseUpdate,
    spawnedLane,
  );
}

function isRenderConsistentWithExternalStores(finishedWork: Fiber): boolean {
  // Search the rendered tree for external store reads, and check whether the
  // stores were mutated in a concurrent event. Intentionally using an iterative
  // loop instead of recursion so we can exit early.
  let node: Fiber = finishedWork;
  while (true) {
    if (node.flags & StoreConsistency) {
      const updateQueue: FunctionComponentUpdateQueue | null =
        (node.updateQueue: any);
      if (updateQueue !== null) {
        const checks = updateQueue.stores;
        if (checks !== null) {
          for (let i = 0; i < checks.length; i++) {
            const check = checks[i];
            const getSnapshot = check.getSnapshot;
            const renderedValue = check.value;
            try {
              if (!is(getSnapshot(), renderedValue)) {
                // Found an inconsistent store.
                return false;
              }
            } catch (error) {
              // If `getSnapshot` throws, return `false`. This will schedule
              // a re-render, and the error will be rethrown during render.
              return false;
            }
          }
        }
      }
    }
    const child = node.child;
    if (node.subtreeFlags & StoreConsistency && child !== null) {
      child.return = node;
      node = child;
      continue;
    }
    if (node === finishedWork) {
      return true;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === finishedWork) {
        return true;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  // Flow doesn't know this is unreachable, but eslint does
  // eslint-disable-next-line no-unreachable
  return true;
}

// The extra indirections around markRootUpdated and markRootSuspended is
// needed to avoid a circular dependency between this module and
// ReactFiberLane. There's probably a better way to split up these modules and
// avoid this problem. Perhaps all the root-marking functions should move into
// the work loop.

function markRootUpdated(root: FiberRoot, updatedLanes: Lanes) {
  _markRootUpdated(root, updatedLanes);

  if (enableInfiniteRenderLoopDetection) {
    // Check for recursive updates
    if (executionContext & RenderContext) {
      workInProgressRootDidIncludeRecursiveRenderUpdate = true;
    } else if (executionContext & CommitContext) {
      didIncludeCommitPhaseUpdate = true;
    }

    throwIfInfiniteUpdateLoopDetected();
  }
}

function markRootPinged(root: FiberRoot, pingedLanes: Lanes) {
  _markRootPinged(root, pingedLanes);

  if (enableInfiniteRenderLoopDetection) {
    // Check for recursive pings. Pings are conceptually different from updates in
    // other contexts but we call it an "update" in this context because
    // repeatedly pinging a suspended render can cause a recursive render loop.
    // The relevant property is that it can result in a new render attempt
    // being scheduled.
    if (executionContext & RenderContext) {
      workInProgressRootDidIncludeRecursiveRenderUpdate = true;
    } else if (executionContext & CommitContext) {
      didIncludeCommitPhaseUpdate = true;
    }

    throwIfInfiniteUpdateLoopDetected();
  }
}

function markRootSuspended(
  root: FiberRoot,
  suspendedLanes: Lanes,
  spawnedLane: Lane,
) {
  // When suspending, we should always exclude lanes that were pinged or (more
  // rarely, since we try to avoid it) updated during the render phase.
  suspendedLanes = removeLanes(suspendedLanes, workInProgressRootPingedLanes);
  suspendedLanes = removeLanes(
    suspendedLanes,
    workInProgressRootInterleavedUpdatedLanes,
  );
  _markRootSuspended(root, suspendedLanes, spawnedLane);
}

// This is the entry point for synchronous tasks that don't go
// through Scheduler
export function performSyncWorkOnRoot(root: FiberRoot, lanes: Lanes): null {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.');
  }

  const didFlushPassiveEffects = flushPassiveEffects();
  if (didFlushPassiveEffects) {
    // If passive effects were flushed, exit to the outer work loop in the root
    // scheduler, so we can recompute the priority.
    // TODO: We don't actually need this `ensureRootIsScheduled` call because
    // this path is only reachable if the root is already part of the schedule.
    // I'm including it only for consistency with the other exit points from
    // this function. Can address in a subsequent refactor.
    ensureRootIsScheduled(root);
    return null;
  }

  if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
    syncNestedUpdateFlag();
  }

  let exitStatus = renderRootSync(root, lanes);
  if (
    (disableLegacyMode || root.tag !== LegacyRoot) &&
    exitStatus === RootErrored
  ) {
    // If something threw an error, try rendering one more time. We'll render
    // synchronously to block concurrent data mutations, and we'll includes
    // all pending updates are included. If it still fails after the second
    // attempt, we'll give up and commit the resulting tree.
    const originallyAttemptedLanes = lanes;
    const errorRetryLanes = getLanesToRetrySynchronouslyOnError(
      root,
      originallyAttemptedLanes,
    );
    if (errorRetryLanes !== NoLanes) {
      lanes = errorRetryLanes;
      exitStatus = recoverFromConcurrentError(
        root,
        originallyAttemptedLanes,
        errorRetryLanes,
      );
    }
  }

  if (exitStatus === RootFatalErrored) {
    prepareFreshStack(root, NoLanes);
    markRootSuspended(root, lanes, NoLane);
    ensureRootIsScheduled(root);
    return null;
  }

  if (exitStatus === RootDidNotComplete) {
    // The render unwound without completing the tree. This happens in special
    // cases where need to exit the current render without producing a
    // consistent tree or committing.
    markRootSuspended(root, lanes, workInProgressDeferredLane);
    ensureRootIsScheduled(root);
    return null;
  }

  // We now have a consistent tree. Because this is a sync render, we
  // will commit it even if something suspended.
  const finishedWork: Fiber = (root.current.alternate: any);
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;
  commitRoot(
    root,
    workInProgressRootRecoverableErrors,
    workInProgressTransitions,
    workInProgressRootDidIncludeRecursiveRenderUpdate,
    workInProgressDeferredLane,
  );

  // Before exiting, make sure there's a callback scheduled for the next
  // pending level.
  ensureRootIsScheduled(root);

  return null;
}

export function flushRoot(root: FiberRoot, lanes: Lanes) {
  if (lanes !== NoLanes) {
    upgradePendingLanesToSync(root, lanes);
    ensureRootIsScheduled(root);
    if ((executionContext & (RenderContext | CommitContext)) === NoContext) {
      resetRenderTimer();
      // TODO: For historical reasons this flushes all sync work across all
      // roots. It shouldn't really matter either way, but we could change this
      // to only flush the given root.
      flushSyncWorkOnAllRoots();
    }
  }
}

export function getExecutionContext(): ExecutionContext {
  return executionContext;
}

export function deferredUpdates<A>(fn: () => A): A {
  const prevTransition = ReactSharedInternals.T;
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(DefaultEventPriority);
    ReactSharedInternals.T = null;
    return fn();
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactSharedInternals.T = prevTransition;
  }
}

export function batchedUpdates<A, R>(fn: A => R, a: A): R {
  if (disableLegacyMode) {
    // batchedUpdates is a no-op now, but there's still some internal react-dom
    // code calling it, that we can't remove until we remove legacy mode.
    return fn(a);
  } else {
    const prevExecutionContext = executionContext;
    executionContext |= BatchedContext;
    try {
      return fn(a);
    } finally {
      executionContext = prevExecutionContext;
      // If there were legacy sync updates, flush them at the end of the outer
      // most batchedUpdates-like method.
      if (
        executionContext === NoContext &&
        // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
        !(__DEV__ && ReactSharedInternals.isBatchingLegacy)
      ) {
        resetRenderTimer();
        flushSyncWorkOnLegacyRootsOnly();
      }
    }
  }
}

export function discreteUpdates<A, B, C, D, R>(
  fn: (A, B, C, D) => R,
  a: A,
  b: B,
  c: C,
  d: D,
): R {
  const prevTransition = ReactSharedInternals.T;
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    ReactSharedInternals.T = null;
    return fn(a, b, c, d);
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactSharedInternals.T = prevTransition;
    if (executionContext === NoContext) {
      resetRenderTimer();
    }
  }
}

// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
declare function flushSyncFromReconciler<R>(fn: () => R): R;
declare function flushSyncFromReconciler(void): void;
export function flushSyncFromReconciler<R>(fn: (() => R) | void): R | void {
  // In legacy mode, we flush pending passive effects at the beginning of the
  // next event, not at the end of the previous one.
  if (
    rootWithPendingPassiveEffects !== null &&
    !disableLegacyMode &&
    rootWithPendingPassiveEffects.tag === LegacyRoot &&
    (executionContext & (RenderContext | CommitContext)) === NoContext
  ) {
    flushPassiveEffects();
  }

  const prevExecutionContext = executionContext;
  executionContext |= BatchedContext;

  const prevTransition = ReactSharedInternals.T;
  const previousPriority = getCurrentUpdatePriority();

  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    ReactSharedInternals.T = null;
    if (fn) {
      return fn();
    } else {
      return undefined;
    }
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactSharedInternals.T = prevTransition;

    executionContext = prevExecutionContext;
    // Flush the immediate callbacks that were scheduled during this batch.
    // Note that this will happen even if batchedUpdates is higher up
    // the stack.
    if ((executionContext & (RenderContext | CommitContext)) === NoContext) {
      flushSyncWorkOnAllRoots();
    }
  }
}

// If called outside of a render or commit will flush all sync work on all roots
// Returns whether the the call was during a render or not
export function flushSyncWork(): boolean {
  if ((executionContext & (RenderContext | CommitContext)) === NoContext) {
    flushSyncWorkOnAllRoots();
    return false;
  }
  return true;
}

export function isAlreadyRendering(): boolean {
  // Used by the renderer to print a warning if certain APIs are called from
  // the wrong context.
  return (
    __DEV__ &&
    (executionContext & (RenderContext | CommitContext)) !== NoContext
  );
}

export function isInvalidExecutionContextForEventFunction(): boolean {
  // Used to throw if certain APIs are called from the wrong context.
  return (executionContext & RenderContext) !== NoContext;
}

// This is called by the HiddenContext module when we enter or leave a
// hidden subtree. The stack logic is managed there because that's the only
// place that ever modifies it. Which module it lives in doesn't matter for
// performance because this function will get inlined regardless
export function setEntangledRenderLanes(newEntangledRenderLanes: Lanes) {
  entangledRenderLanes = newEntangledRenderLanes;
}

export function getEntangledRenderLanes(): Lanes {
  return entangledRenderLanes;
}

function resetWorkInProgressStack() {
  if (workInProgress === null) return;
  let interruptedWork;
  if (workInProgressSuspendedReason === NotSuspended) {
    // Normal case. Work-in-progress hasn't started yet. Unwind all
    // its parents.
    interruptedWork = workInProgress.return;
  } else {
    // Work-in-progress is in suspended state. Reset the work loop and unwind
    // both the suspended fiber and all its parents.
    resetSuspendedWorkLoopOnUnwind(workInProgress);
    interruptedWork = workInProgress;
  }
  while (interruptedWork !== null) {
    const current = interruptedWork.alternate;
    unwindInterruptedWork(
      current,
      interruptedWork,
      workInProgressRootRenderLanes,
    );
    interruptedWork = interruptedWork.return;
  }
  workInProgress = null;
}

function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    // The root previous suspended and scheduled a timeout to commit a fallback
    // state. Now that we have additional work, cancel the timeout.
    root.timeoutHandle = noTimeout;
    // $FlowFixMe[incompatible-call] Complains noTimeout is not a TimeoutID, despite the check above
    cancelTimeout(timeoutHandle);
  }
  const cancelPendingCommit = root.cancelPendingCommit;
  if (cancelPendingCommit !== null) {
    root.cancelPendingCommit = null;
    cancelPendingCommit();
  }

  resetWorkInProgressStack();
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  workInProgressRootRenderLanes = lanes;
  workInProgressSuspendedReason = NotSuspended;
  workInProgressThrownValue = null;
  workInProgressRootDidAttachPingListener = false;
  workInProgressRootExitStatus = RootInProgress;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootInterleavedUpdatedLanes = NoLanes;
  workInProgressRootRenderPhaseUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
  workInProgressDeferredLane = NoLane;
  workInProgressRootConcurrentErrors = null;
  workInProgressRootRecoverableErrors = null;
  workInProgressRootDidIncludeRecursiveRenderUpdate = false;

  // Get the lanes that are entangled with whatever we're about to render. We
  // track these separately so we can distinguish the priority of the render
  // task from the priority of the lanes it is entangled with. For example, a
  // transition may not be allowed to finish unless it includes the Sync lane,
  // which is currently suspended. We should be able to render the Transition
  // and Sync lane in the same batch, but at Transition priority, because the
  // Sync lane already suspended.
  entangledRenderLanes = getEntangledLanes(root, lanes);

  finishQueueingConcurrentUpdates();

  if (__DEV__) {
    ReactStrictModeWarnings.discardPendingWarnings();
  }

  return rootWorkInProgress;
}

function resetSuspendedWorkLoopOnUnwind(fiber: Fiber) {
  // Reset module-level state that was set during the render phase.
  resetContextDependencies();
  resetHooksOnUnwind(fiber);
  resetChildReconcilerOnUnwind();
}

function handleThrow(root: FiberRoot, thrownValue: any): void {
  // A component threw an exception. Usually this is because it suspended, but
  // it also includes regular program errors.
  //
  // We're either going to unwind the stack to show a Suspense or error
  // boundary, or we're going to replay the component again. Like after a
  // promise resolves.
  //
  // Until we decide whether we're going to unwind or replay, we should preserve
  // the current state of the work loop without resetting anything.
  //
  // If we do decide to unwind the stack, module-level variables will be reset
  // in resetSuspendedWorkLoopOnUnwind.

  // These should be reset immediately because they're only supposed to be set
  // when React is executing user code.
  resetHooksAfterThrow();
  if (__DEV__ || !disableStringRefs) {
    resetCurrentFiber();
  }

  if (thrownValue === SuspenseException) {
    // This is a special type of exception used for Suspense. For historical
    // reasons, the rest of the Suspense implementation expects the thrown value
    // to be a thenable, because before `use` existed that was the (unstable)
    // API for suspending. This implementation detail can change later, once we
    // deprecate the old API in favor of `use`.
    thrownValue = getSuspendedThenable();
    workInProgressSuspendedReason =
      shouldRemainOnPreviousScreen() &&
      // Check if there are other pending updates that might possibly unblock this
      // component from suspending. This mirrors the check in
      // renderDidSuspendDelayIfPossible. We should attempt to unify them somehow.
      // TODO: Consider unwinding immediately, using the
      // SuspendedOnHydration mechanism.
      !includesNonIdleWork(workInProgressRootSkippedLanes) &&
      !includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes)
        ? // Suspend work loop until data resolves
          SuspendedOnData
        : // Don't suspend work loop, except to check if the data has
          // immediately resolved (i.e. in a microtask). Otherwise, trigger the
          // nearest Suspense fallback.
          SuspendedOnImmediate;
  } else if (thrownValue === SuspenseyCommitException) {
    thrownValue = getSuspendedThenable();
    workInProgressSuspendedReason = SuspendedOnInstance;
  } else if (thrownValue === SelectiveHydrationException) {
    // An update flowed into a dehydrated boundary. Before we can apply the
    // update, we need to finish hydrating. Interrupt the work-in-progress
    // render so we can restart at the hydration lane.
    //
    // The ideal implementation would be able to switch contexts without
    // unwinding the current stack.
    //
    // We could name this something more general but as of now it's the only
    // case where we think this should happen.
    workInProgressSuspendedReason = SuspendedOnHydration;
  } else {
    // This is a regular error.
    const isWakeable =
      thrownValue !== null &&
      typeof thrownValue === 'object' &&
      typeof thrownValue.then === 'function';

    workInProgressSuspendedReason = isWakeable
      ? // A wakeable object was thrown by a legacy Suspense implementation.
        // This has slightly different behavior than suspending with `use`.
        SuspendedOnDeprecatedThrowPromise
      : // This is a regular error. If something earlier in the component already
        // suspended, we must clear the thenable state to unblock the work loop.
        SuspendedOnError;
  }

  workInProgressThrownValue = thrownValue;

  const erroredWork = workInProgress;
  if (erroredWork === null) {
    // This is a fatal error
    workInProgressRootExitStatus = RootFatalErrored;
    logUncaughtError(
      root,
      createCapturedValueAtFiber(thrownValue, root.current),
    );
    return;
  }

  if (enableProfilerTimer && erroredWork.mode & ProfileMode) {
    // Record the time spent rendering before an error was thrown. This
    // avoids inaccurate Profiler durations in the case of a
    // suspended render.
    stopProfilerTimerIfRunningAndRecordDelta(erroredWork, true);
  }

  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
    switch (workInProgressSuspendedReason) {
      case SuspendedOnError: {
        markComponentErrored(
          erroredWork,
          thrownValue,
          workInProgressRootRenderLanes,
        );
        break;
      }
      case SuspendedOnData:
      case SuspendedOnImmediate:
      case SuspendedOnDeprecatedThrowPromise:
      case SuspendedAndReadyToContinue: {
        const wakeable: Wakeable = (thrownValue: any);
        markComponentSuspended(
          erroredWork,
          wakeable,
          workInProgressRootRenderLanes,
        );
        break;
      }
      case SuspendedOnInstance: {
        // This is conceptually like a suspend, but it's not associated with
        // a particular wakeable. It's associated with a host resource (e.g.
        // a CSS file or an image) that hasn't loaded yet. DevTools doesn't
        // handle this currently.
        break;
      }
      case SuspendedOnHydration: {
        // This is conceptually like a suspend, but it's not associated with
        // a particular wakeable. DevTools doesn't seem to care about this case,
        // currently. It's similar to if the component were interrupted, which
        // we don't mark with a special function.
        break;
      }
    }
  }
}

export function shouldRemainOnPreviousScreen(): boolean {
  // This is asking whether it's better to suspend the transition and remain
  // on the previous screen, versus showing a fallback as soon as possible. It
  // takes into account both the priority of render and also whether showing a
  // fallback would produce a desirable user experience.

  const handler = getSuspenseHandler();
  if (handler === null) {
    // There's no Suspense boundary that can provide a fallback. We have no
    // choice but to remain on the previous screen.
    // NOTE: We do this even for sync updates, for lack of any better option. In
    // the future, we may change how we handle this, like by putting the whole
    // root into a "detached" mode.
    return true;
  }

  // TODO: Once `use` has fully replaced the `throw promise` pattern, we should
  // be able to remove the equivalent check in finishConcurrentRender, and rely
  // just on this one.
  if (includesOnlyTransitions(workInProgressRootRenderLanes)) {
    if (getShellBoundary() === null) {
      // We're rendering inside the "shell" of the app. Activating the nearest
      // fallback would cause visible content to disappear. It's better to
      // suspend the transition and remain on the previous screen.
      return true;
    } else {
      // We're rendering content that wasn't part of the previous screen.
      // Rather than block the transition, it's better to show a fallback as
      // soon as possible. The appearance of any nested fallbacks will be
      // throttled to avoid jank.
      return false;
    }
  }

  if (
    includesOnlyRetries(workInProgressRootRenderLanes) ||
    // In this context, an OffscreenLane counts as a Retry
    // TODO: It's become increasingly clear that Retries and Offscreen are
    // deeply connected. They probably can be unified further.
    includesSomeLane(workInProgressRootRenderLanes, OffscreenLane)
  ) {
    // During a retry, we can suspend rendering if the nearest Suspense boundary
    // is the boundary of the "shell", because we're guaranteed not to block
    // any new content from appearing.
    //
    // The reason we must check if this is a retry is because it guarantees
    // that suspending the work loop won't block an actual update, because
    // retries don't "update" anything; they fill in fallbacks that were left
    // behind by a previous transition.
    return handler === getShellBoundary();
  }

  // For all other Lanes besides Transitions and Retries, we should not wait
  // for the data to load.
  return false;
}

function pushDispatcher(container: any) {
  const prevDispatcher = ReactSharedInternals.H;
  ReactSharedInternals.H = ContextOnlyDispatcher;
  if (prevDispatcher === null) {
    // The React isomorphic package does not include a default dispatcher.
    // Instead the first renderer will lazily attach one, in order to give
    // nicer error messages.
    return ContextOnlyDispatcher;
  } else {
    return prevDispatcher;
  }
}

function popDispatcher(prevDispatcher: any) {
  ReactSharedInternals.H = prevDispatcher;
}

function pushAsyncDispatcher() {
  if (enableCache || __DEV__ || !disableStringRefs) {
    const prevAsyncDispatcher = ReactSharedInternals.A;
    ReactSharedInternals.A = DefaultAsyncDispatcher;
    return prevAsyncDispatcher;
  } else {
    return null;
  }
}

function popAsyncDispatcher(prevAsyncDispatcher: any) {
  if (enableCache || __DEV__ || !disableStringRefs) {
    ReactSharedInternals.A = prevAsyncDispatcher;
  }
}

export function markCommitTimeOfFallback() {
  globalMostRecentFallbackTime = now();
}

export function markSkippedUpdateLanes(lane: Lane | Lanes): void {
  workInProgressRootSkippedLanes = mergeLanes(
    lane,
    workInProgressRootSkippedLanes,
  );
}

export function renderDidSuspend(): void {
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootSuspended;
  }
}

export function renderDidSuspendDelayIfPossible(): void {
  workInProgressRootExitStatus = RootSuspendedWithDelay;

  // Check if there are updates that we skipped tree that might have unblocked
  // this render.
  if (
    (includesNonIdleWork(workInProgressRootSkippedLanes) ||
      includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes)) &&
    workInProgressRoot !== null
  ) {
    // Mark the current render as suspended so that we switch to working on
    // the updates that were skipped. Usually we only suspend at the end of
    // the render phase.
    // TODO: We should probably always mark the root as suspended immediately
    // (inside this function), since by suspending at the end of the render
    // phase introduces a potential mistake where we suspend lanes that were
    // pinged or updated while we were rendering.
    // TODO: Consider unwinding immediately, using the
    // SuspendedOnHydration mechanism.
    markRootSuspended(
      workInProgressRoot,
      workInProgressRootRenderLanes,
      workInProgressDeferredLane,
    );
  }
}

export function renderDidError() {
  if (workInProgressRootExitStatus !== RootSuspendedWithDelay) {
    workInProgressRootExitStatus = RootErrored;
  }
}

export function queueConcurrentError(error: CapturedValue<mixed>) {
  if (workInProgressRootConcurrentErrors === null) {
    workInProgressRootConcurrentErrors = [error];
  } else {
    workInProgressRootConcurrentErrors.push(error);
  }
}

// Called during render to determine if anything has suspended.
// Returns false if we're not sure.
export function renderHasNotSuspendedYet(): boolean {
  // If something errored or completed, we can't really be sure,
  // so those are false.
  return workInProgressRootExitStatus === RootInProgress;
}

// TODO: Over time, this function and renderRootConcurrent have become more
// and more similar. Not sure it makes sense to maintain forked paths. Consider
// unifying them again.
function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher(root.containerInfo);
  const prevAsyncDispatcher = pushAsyncDispatcher();

  // If the root or lanes have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    if (enableUpdaterTracking) {
      if (isDevToolsPresent) {
        const memoizedUpdaters = root.memoizedUpdaters;
        if (memoizedUpdaters.size > 0) {
          restorePendingUpdaters(root, workInProgressRootRenderLanes);
          memoizedUpdaters.clear();
        }

        // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
        // If we bailout on this work, we'll move them back (like above).
        // It's important to move them now in case the work spawns more work at the same priority with different updaters.
        // That way we can keep the current update and future updates separate.
        movePendingFibersToMemoized(root, lanes);
      }
    }

    workInProgressTransitions = getTransitionsForLanes(root, lanes);
    prepareFreshStack(root, lanes);
  }

  if (__DEV__) {
    if (enableDebugTracing) {
      logRenderStarted(lanes);
    }
  }

  if (enableSchedulingProfiler) {
    markRenderStarted(lanes);
  }

  let didSuspendInShell = false;
  outer: do {
    try {
      if (
        workInProgressSuspendedReason !== NotSuspended &&
        workInProgress !== null
      ) {
        // The work loop is suspended. During a synchronous render, we don't
        // yield to the main thread. Immediately unwind the stack. This will
        // trigger either a fallback or an error boundary.
        // TODO: For discrete and "default" updates (anything that's not
        // flushSync), we want to wait for the microtasks the flush before
        // unwinding. Will probably implement this using renderRootConcurrent,
        // or merge renderRootSync and renderRootConcurrent into the same
        // function and fork the behavior some other way.
        const unitOfWork = workInProgress;
        const thrownValue = workInProgressThrownValue;
        switch (workInProgressSuspendedReason) {
          case SuspendedOnHydration: {
            // Selective hydration. An update flowed into a dehydrated tree.
            // Interrupt the current render so the work loop can switch to the
            // hydration lane.
            resetWorkInProgressStack();
            workInProgressRootExitStatus = RootDidNotComplete;
            break outer;
          }
          case SuspendedOnImmediate:
          case SuspendedOnData: {
            if (!didSuspendInShell && getSuspenseHandler() === null) {
              didSuspendInShell = true;
            }
            // Intentional fallthrough
          }
          default: {
            // Unwind then continue with the normal work loop.
            workInProgressSuspendedReason = NotSuspended;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
            break;
          }
        }
      }
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleThrow(root, thrownValue);
    }
  } while (true);

  // Check if something suspended in the shell. We use this to detect an
  // infinite ping loop caused by an uncached promise.
  //
  // Only increment this counter once per synchronous render attempt across the
  // whole tree. Even if there are many sibling components that suspend, this
  // counter only gets incremented once.
  if (didSuspendInShell) {
    root.shellSuspendCounter++;
  }

  resetContextDependencies();

  executionContext = prevExecutionContext;
  popDispatcher(prevDispatcher);
  popAsyncDispatcher(prevAsyncDispatcher);

  if (workInProgress !== null) {
    // This is a sync render, so we should have finished the whole tree.
    throw new Error(
      'Cannot commit an incomplete root. This error is likely caused by a ' +
        'bug in React. Please file an issue.',
    );
  }

  if (__DEV__) {
    if (enableDebugTracing) {
      logRenderStopped();
    }
  }

  if (enableSchedulingProfiler) {
    markRenderStopped();
  }

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;

  // It's safe to process the queue now that the render phase is complete.
  finishQueueingConcurrentUpdates();

  return workInProgressRootExitStatus;
}

// The work loop is an extremely hot path. Tell Closure not to inline it.
/** @noinline */
function workLoopSync() {
  // Perform work without checking if we need to yield between fiber.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function renderRootConcurrent(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher(root.containerInfo);
  const prevAsyncDispatcher = pushAsyncDispatcher();

  // If the root or lanes have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    if (enableUpdaterTracking) {
      if (isDevToolsPresent) {
        const memoizedUpdaters = root.memoizedUpdaters;
        if (memoizedUpdaters.size > 0) {
          restorePendingUpdaters(root, workInProgressRootRenderLanes);
          memoizedUpdaters.clear();
        }

        // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
        // If we bailout on this work, we'll move them back (like above).
        // It's important to move them now in case the work spawns more work at the same priority with different updaters.
        // That way we can keep the current update and future updates separate.
        movePendingFibersToMemoized(root, lanes);
      }
    }

    workInProgressTransitions = getTransitionsForLanes(root, lanes);
    resetRenderTimer();
    prepareFreshStack(root, lanes);
  }

  if (__DEV__) {
    if (enableDebugTracing) {
      logRenderStarted(lanes);
    }
  }

  if (enableSchedulingProfiler) {
    markRenderStarted(lanes);
  }

  outer: do {
    try {
      if (
        workInProgressSuspendedReason !== NotSuspended &&
        workInProgress !== null
      ) {
        // The work loop is suspended. We need to either unwind the stack or
        // replay the suspended component.
        const unitOfWork = workInProgress;
        const thrownValue = workInProgressThrownValue;
        resumeOrUnwind: switch (workInProgressSuspendedReason) {
          case SuspendedOnError: {
            // Unwind then continue with the normal work loop.
            workInProgressSuspendedReason = NotSuspended;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
            break;
          }
          case SuspendedOnData: {
            const thenable: Thenable<mixed> = (thrownValue: any);
            if (isThenableResolved(thenable)) {
              // The data resolved. Try rendering the component again.
              workInProgressSuspendedReason = NotSuspended;
              workInProgressThrownValue = null;
              replaySuspendedUnitOfWork(unitOfWork);
              break;
            }
            // The work loop is suspended on data. We should wait for it to
            // resolve before continuing to render.
            // TODO: Handle the case where the promise resolves synchronously.
            // Usually this is handled when we instrument the promise to add a
            // `status` field, but if the promise already has a status, we won't
            // have added a listener until right here.
            const onResolution = () => {
              // Check if the root is still suspended on this promise.
              if (
                workInProgressSuspendedReason === SuspendedOnData &&
                workInProgressRoot === root
              ) {
                // Mark the root as ready to continue rendering.
                workInProgressSuspendedReason = SuspendedAndReadyToContinue;
              }
              // Ensure the root is scheduled. We should do this even if we're
              // currently working on a different root, so that we resume
              // rendering later.
              ensureRootIsScheduled(root);
            };
            thenable.then(onResolution, onResolution);
            break outer;
          }
          case SuspendedOnImmediate: {
            // If this fiber just suspended, it's possible the data is already
            // cached. Yield to the main thread to give it a chance to ping. If
            // it does, we can retry immediately without unwinding the stack.
            workInProgressSuspendedReason = SuspendedAndReadyToContinue;
            break outer;
          }
          case SuspendedOnInstance: {
            workInProgressSuspendedReason =
              SuspendedOnInstanceAndReadyToContinue;
            break outer;
          }
          case SuspendedAndReadyToContinue: {
            const thenable: Thenable<mixed> = (thrownValue: any);
            if (isThenableResolved(thenable)) {
              // The data resolved. Try rendering the component again.
              workInProgressSuspendedReason = NotSuspended;
              workInProgressThrownValue = null;
              replaySuspendedUnitOfWork(unitOfWork);
            } else {
              // Otherwise, unwind then continue with the normal work loop.
              workInProgressSuspendedReason = NotSuspended;
              workInProgressThrownValue = null;
              throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
            }
            break;
          }
          case SuspendedOnInstanceAndReadyToContinue: {
            let resource: null | Resource = null;
            switch (workInProgress.tag) {
              case HostHoistable: {
                resource = workInProgress.memoizedState;
              }
              // intentional fallthrough
              case HostComponent:
              case HostSingleton: {
                // Before unwinding the stack, check one more time if the
                // instance is ready. It may have loaded when React yielded to
                // the main thread.

                // Assigning this to a constant so Flow knows the binding won't
                // be mutated by `preloadInstance`.
                const hostFiber = workInProgress;
                const type = hostFiber.type;
                const props = hostFiber.pendingProps;
                const isReady = resource
                  ? preloadResource(resource)
                  : preloadInstance(type, props);
                if (isReady) {
                  // The data resolved. Resume the work loop as if nothing
                  // suspended. Unlike when a user component suspends, we don't
                  // have to replay anything because the host fiber
                  // already completed.
                  workInProgressSuspendedReason = NotSuspended;
                  workInProgressThrownValue = null;
                  const sibling = hostFiber.sibling;
                  if (sibling !== null) {
                    workInProgress = sibling;
                  } else {
                    const returnFiber = hostFiber.return;
                    if (returnFiber !== null) {
                      workInProgress = returnFiber;
                      completeUnitOfWork(returnFiber);
                    } else {
                      workInProgress = null;
                    }
                  }
                  break resumeOrUnwind;
                }
                break;
              }
              default: {
                // This will fail gracefully but it's not correct, so log a
                // warning in dev.
                if (__DEV__) {
                  console.error(
                    'Unexpected type of fiber triggered a suspensey commit. ' +
                      'This is a bug in React.',
                  );
                }
                break;
              }
            }
            // Otherwise, unwind then continue with the normal work loop.
            workInProgressSuspendedReason = NotSuspended;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
            break;
          }
          case SuspendedOnDeprecatedThrowPromise: {
            // Suspended by an old implementation that uses the `throw promise`
            // pattern. The newer replaying behavior can cause subtle issues
            // like infinite ping loops. So we maintain the old behavior and
            // always unwind.
            workInProgressSuspendedReason = NotSuspended;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, unitOfWork, thrownValue);
            break;
          }
          case SuspendedOnHydration: {
            // Selective hydration. An update flowed into a dehydrated tree.
            // Interrupt the current render so the work loop can switch to the
            // hydration lane.
            resetWorkInProgressStack();
            workInProgressRootExitStatus = RootDidNotComplete;
            break outer;
          }
          default: {
            throw new Error(
              'Unexpected SuspendedReason. This is a bug in React.',
            );
          }
        }
      }

      if (__DEV__ && ReactSharedInternals.actQueue !== null) {
        // `act` special case: If we're inside an `act` scope, don't consult
        // `shouldYield`. Always keep working until the render is complete.
        // This is not just an optimization: in a unit test environment, we
        // can't trust the result of `shouldYield`, because the host I/O is
        // likely mocked.
        workLoopSync();
      } else {
        workLoopConcurrent();
      }
      break;
    } catch (thrownValue) {
      handleThrow(root, thrownValue);
    }
  } while (true);
  resetContextDependencies();

  popDispatcher(prevDispatcher);
  popAsyncDispatcher(prevAsyncDispatcher);
  executionContext = prevExecutionContext;

  if (__DEV__) {
    if (enableDebugTracing) {
      logRenderStopped();
    }
  }

  // Check if the tree has completed.
  if (workInProgress !== null) {
    // Still work remaining.
    if (enableSchedulingProfiler) {
      markRenderYielded();
    }
    return RootInProgress;
  } else {
    // Completed the tree.
    if (enableSchedulingProfiler) {
      markRenderStopped();
    }

    // Set this to null to indicate there's no in-progress render.
    workInProgressRoot = null;
    workInProgressRootRenderLanes = NoLanes;

    // It's safe to process the queue now that the render phase is complete.
    finishQueueingConcurrentUpdates();

    // Return the final exit status.
    return workInProgressRootExitStatus;
  }
}

/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    // $FlowFixMe[incompatible-call] found when upgrading Flow
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber): void {
  // The current, flushed, state of this fiber is the alternate. Ideally
  // nothing should rely on this, but relying on it here means that we don't
  // need an additional field on the work in progress.
  const current = unitOfWork.alternate;

  let next;
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    if (__DEV__) {
      next = runWithFiberInDEV(
        unitOfWork,
        beginWork,
        current,
        unitOfWork,
        entangledRenderLanes,
      );
    } else {
      next = beginWork(current, unitOfWork, entangledRenderLanes);
    }
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    if (__DEV__) {
      next = runWithFiberInDEV(
        unitOfWork,
        beginWork,
        current,
        unitOfWork,
        entangledRenderLanes,
      );
    } else {
      next = beginWork(current, unitOfWork, entangledRenderLanes);
    }
  }

  if (!disableStringRefs) {
    resetCurrentFiber();
  }
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

function replaySuspendedUnitOfWork(unitOfWork: Fiber): void {
  // This is a fork of performUnitOfWork specifcally for replaying a fiber that
  // just suspended.
  let next;
  if (__DEV__) {
    next = runWithFiberInDEV(unitOfWork, replayBeginWork, unitOfWork);
  } else {
    next = replayBeginWork(unitOfWork);
  }

  // The begin phase finished successfully without suspending. Return to the
  // normal work loop.
  if (!disableStringRefs) {
    resetCurrentFiber();
  }
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

function replayBeginWork(unitOfWork: Fiber): null | Fiber {
  // This is a fork of beginWork specifcally for replaying a fiber that
  // just suspended.

  const current = unitOfWork.alternate;

  let next;
  const isProfilingMode =
    enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode;
  if (isProfilingMode) {
    startProfilerTimer(unitOfWork);
  }
  switch (unitOfWork.tag) {
    case SimpleMemoComponent:
    case FunctionComponent: {
      // Resolve `defaultProps`. This logic is copied from `beginWork`.
      // TODO: Consider moving this switch statement into that module. Also,
      // could maybe use this as an opportunity to say `use` doesn't work with
      // `defaultProps` :)
      const Component = unitOfWork.type;
      const unresolvedProps = unitOfWork.pendingProps;
      const resolvedProps =
        disableDefaultPropsExceptForClasses ||
        unitOfWork.elementType === Component
          ? unresolvedProps
          : resolveDefaultPropsOnNonClassComponent(Component, unresolvedProps);
      let context: any;
      if (!disableLegacyContext) {
        const unmaskedContext = getUnmaskedContext(unitOfWork, Component, true);
        context = getMaskedContext(unitOfWork, unmaskedContext);
      }
      next = replayFunctionComponent(
        current,
        unitOfWork,
        resolvedProps,
        Component,
        context,
        workInProgressRootRenderLanes,
      );
      break;
    }
    case ForwardRef: {
      // Resolve `defaultProps`. This logic is copied from `beginWork`.
      // TODO: Consider moving this switch statement into that module. Also,
      // could maybe use this as an opportunity to say `use` doesn't work with
      // `defaultProps` :)
      const Component = unitOfWork.type.render;
      const unresolvedProps = unitOfWork.pendingProps;
      const resolvedProps =
        disableDefaultPropsExceptForClasses ||
        unitOfWork.elementType === Component
          ? unresolvedProps
          : resolveDefaultPropsOnNonClassComponent(Component, unresolvedProps);

      next = replayFunctionComponent(
        current,
        unitOfWork,
        resolvedProps,
        Component,
        unitOfWork.ref,
        workInProgressRootRenderLanes,
      );
      break;
    }
    case HostComponent: {
      // Some host components are stateful (that's how we implement form
      // actions) but we don't bother to reuse the memoized state because it's
      // not worth the extra code. The main reason to reuse the previous hooks
      // is to reuse uncached promises, but we happen to know that the only
      // promises that a host component might suspend on are definitely cached
      // because they are controlled by us. So don't bother.
      resetHooksOnUnwind(unitOfWork);
      // Fallthrough to the next branch.
    }
    default: {
      // Other types besides function components are reset completely before
      // being replayed. Currently this only happens when a Usable type is
      // reconciled — the reconciler will suspend.
      //
      // We reset the fiber back to its original state; however, this isn't
      // a full "unwind" because we're going to reuse the promises that were
      // reconciled previously. So it's intentional that we don't call
      // resetSuspendedWorkLoopOnUnwind here.
      unwindInterruptedWork(current, unitOfWork, workInProgressRootRenderLanes);
      unitOfWork = workInProgress = resetWorkInProgress(
        unitOfWork,
        entangledRenderLanes,
      );
      next = beginWork(current, unitOfWork, entangledRenderLanes);
      break;
    }
  }
  if (isProfilingMode) {
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  }

  return next;
}

function throwAndUnwindWorkLoop(
  root: FiberRoot,
  unitOfWork: Fiber,
  thrownValue: mixed,
) {
  // This is a fork of performUnitOfWork specifcally for unwinding a fiber
  // that threw an exception.
  //
  // Return to the normal work loop. This will unwind the stack, and potentially
  // result in showing a fallback.
  resetSuspendedWorkLoopOnUnwind(unitOfWork);

  const returnFiber = unitOfWork.return;
  try {
    // Find and mark the nearest Suspense or error boundary that can handle
    // this "exception".
    const didFatal = throwException(
      root,
      returnFiber,
      unitOfWork,
      thrownValue,
      workInProgressRootRenderLanes,
    );
    if (didFatal) {
      panicOnRootError(root, thrownValue);
      return;
    }
  } catch (error) {
    // We had trouble processing the error. An example of this happening is
    // when accessing the `componentDidCatch` property of an error boundary
    // throws an error. A weird edge case. There's a regression test for this.
    // To prevent an infinite loop, bubble the error up to the next parent.
    if (returnFiber !== null) {
      workInProgress = returnFiber;
      throw error;
    } else {
      panicOnRootError(root, thrownValue);
      return;
    }
  }

  if (unitOfWork.flags & Incomplete) {
    // Unwind the stack until we reach the nearest boundary.
    unwindUnitOfWork(unitOfWork);
  } else {
    // Although the fiber suspended, we're intentionally going to commit it in
    // an inconsistent state. We can do this safely in cases where we know the
    // inconsistent tree will be hidden.
    //
    // This currently only applies to Legacy Suspense implementation, but we may
    // port a version of this to concurrent roots, too, when performing a
    // synchronous render. Because that will allow us to mutate the tree as we
    // go instead of buffering mutations until the end. Though it's unclear if
    // this particular path is how that would be implemented.
    completeUnitOfWork(unitOfWork);
  }
}

function panicOnRootError(root: FiberRoot, error: mixed) {
  // There's no ancestor that can handle this exception. This should never
  // happen because the root is supposed to capture all errors that weren't
  // caught by an error boundary. This is a fatal error, or panic condition,
  // because we've run out of ways to recover.
  workInProgressRootExitStatus = RootFatalErrored;
  logUncaughtError(root, createCapturedValueAtFiber(error, root.current));
  // Set `workInProgress` to null. This represents advancing to the next
  // sibling, or the parent if there are no siblings. But since the root
  // has no siblings nor a parent, we set it to null. Usually this is
  // handled by `completeUnitOfWork` or `unwindWork`, but since we're
  // intentionally not calling those, we need set it here.
  // TODO: Consider calling `unwindWork` to pop the contexts.
  workInProgress = null;
}

function completeUnitOfWork(unitOfWork: Fiber): void {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  let completedWork: Fiber = unitOfWork;
  do {
    if (__DEV__) {
      if ((completedWork.flags & Incomplete) !== NoFlags) {
        // NOTE: If we re-enable sibling prerendering in some cases, this branch
        // is where we would switch to the unwinding path.
        console.error(
          'Internal React error: Expected this fiber to be complete, but ' +
            "it isn't. It should have been unwound. This is a bug in React.",
        );
      }
    }

    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;

    let next;
    if (!enableProfilerTimer || (completedWork.mode & ProfileMode) === NoMode) {
      if (__DEV__) {
        next = runWithFiberInDEV(
          completedWork,
          completeWork,
          current,
          completedWork,
          entangledRenderLanes,
        );
      } else {
        next = completeWork(current, completedWork, entangledRenderLanes);
      }
    } else {
      startProfilerTimer(completedWork);
      if (__DEV__) {
        next = runWithFiberInDEV(
          completedWork,
          completeWork,
          current,
          completedWork,
          entangledRenderLanes,
        );
      } else {
        next = completeWork(current, completedWork, entangledRenderLanes);
      }
      // Update render duration assuming we didn't error.
      stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
    }

    if (next !== null) {
      // Completing this fiber spawned new work. Work on that next.
      workInProgress = next;
      return;
    }

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      workInProgress = siblingFiber;
      return;
    }
    // Otherwise, return to the parent
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    completedWork = returnFiber;
    // Update the next thing we're working on in case something throws.
    workInProgress = completedWork;
  } while (completedWork !== null);

  // We've reached the root.
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

function unwindUnitOfWork(unitOfWork: Fiber): void {
  let incompleteWork: Fiber = unitOfWork;
  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = incompleteWork.alternate;

    // This fiber did not complete because something threw. Pop values off
    // the stack without entering the complete phase. If this is a boundary,
    // capture values if possible.
    const next = unwindWork(current, incompleteWork, entangledRenderLanes);

    // Because this fiber did not complete, don't reset its lanes.

    if (next !== null) {
      // Found a boundary that can handle this exception. Re-renter the
      // begin phase. This branch will return us to the normal work loop.
      //
      // Since we're restarting, remove anything that is not a host effect
      // from the effect tag.
      next.flags &= HostEffectMask;
      workInProgress = next;
      return;
    }

    // Keep unwinding until we reach either a boundary or the root.

    if (enableProfilerTimer && (incompleteWork.mode & ProfileMode) !== NoMode) {
      // Record the render duration for the fiber that errored.
      stopProfilerTimerIfRunningAndRecordDelta(incompleteWork, false);

      // Include the time spent working on failed children before continuing.
      let actualDuration = incompleteWork.actualDuration;
      let child = incompleteWork.child;
      while (child !== null) {
        // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
        actualDuration += child.actualDuration;
        child = child.sibling;
      }
      incompleteWork.actualDuration = actualDuration;
    }

    // TODO: Once we stop prerendering siblings, instead of resetting the parent
    // of the node being unwound, we should be able to reset node itself as we
    // unwind the stack. Saves an additional null check.
    const returnFiber = incompleteWork.return;
    if (returnFiber !== null) {
      // Mark the parent fiber as incomplete and clear its subtree flags.
      // TODO: Once we stop prerendering siblings, we may be able to get rid of
      // the Incomplete flag because unwinding to the nearest boundary will
      // happen synchronously.
      returnFiber.flags |= Incomplete;
      returnFiber.subtreeFlags = NoFlags;
      returnFiber.deletions = null;
    }

    // NOTE: If we re-enable sibling prerendering in some cases, here we
    // would switch to the normal completion path: check if a sibling
    // exists, and if so, begin work on it.

    // Otherwise, return to the parent
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    incompleteWork = returnFiber;
    // Update the next thing we're working on in case something throws.
    workInProgress = incompleteWork;
  } while (incompleteWork !== null);

  // We've unwound all the way to the root.
  workInProgressRootExitStatus = RootDidNotComplete;
  workInProgress = null;
}

function commitRoot(
  root: FiberRoot,
  recoverableErrors: null | Array<CapturedValue<mixed>>,
  transitions: Array<Transition> | null,
  didIncludeRenderPhaseUpdate: boolean,
  spawnedLane: Lane,
) {
  // TODO: This no longer makes any sense. We already wrap the mutation and
  // layout phases. Should be able to remove.
  const prevTransition = ReactSharedInternals.T;
  const previousUpdateLanePriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    ReactSharedInternals.T = null;
    commitRootImpl(
      root,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      previousUpdateLanePriority,
      spawnedLane,
    );
  } finally {
    ReactSharedInternals.T = prevTransition;
    setCurrentUpdatePriority(previousUpdateLanePriority);
  }

  return null;
}

function commitRootImpl(
  root: FiberRoot,
  recoverableErrors: null | Array<CapturedValue<mixed>>,
  transitions: Array<Transition> | null,
  didIncludeRenderPhaseUpdate: boolean,
  renderPriorityLevel: EventPriority,
  spawnedLane: Lane,
) {
  do {
    // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
    // means `flushPassiveEffects` will sometimes result in additional
    // passive effects. So we need to keep flushing in a loop until there are
    // no more pending effects.
    // TODO: Might be better if `flushPassiveEffects` did not automatically
    // flush synchronous work at the end, to avoid factoring hazards like this.
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);
  flushRenderPhaseStrictModeWarningsInDEV();

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.');
  }

  const finishedWork = root.finishedWork;
  const lanes = root.finishedLanes;

  if (__DEV__) {
    if (enableDebugTracing) {
      logCommitStarted(lanes);
    }
  }

  if (enableSchedulingProfiler) {
    markCommitStarted(lanes);
  }

  if (finishedWork === null) {
    if (__DEV__) {
      if (enableDebugTracing) {
        logCommitStopped();
      }
    }

    if (enableSchedulingProfiler) {
      markCommitStopped();
    }

    return null;
  } else {
    if (__DEV__) {
      if (lanes === NoLanes) {
        console.error(
          'root.finishedLanes should not be empty during a commit. This is a ' +
            'bug in React.',
        );
      }
    }
  }
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  if (finishedWork === root.current) {
    throw new Error(
      'Cannot commit the same tree as before. This error is likely caused by ' +
        'a bug in React. Please file an issue.',
    );
  }

  // commitRoot never returns a continuation; it always finishes synchronously.
  // So we can clear these now to allow a new callback to be scheduled.
  root.callbackNode = null;
  root.callbackPriority = NoLane;
  root.cancelPendingCommit = null;

  // Check which lanes no longer have any work scheduled on them, and mark
  // those as finished.
  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);

  // Make sure to account for lanes that were updated by a concurrent event
  // during the render phase; don't mark them as finished.
  const concurrentlyUpdatedLanes = getConcurrentlyUpdatedLanes();
  remainingLanes = mergeLanes(remainingLanes, concurrentlyUpdatedLanes);

  markRootFinished(root, remainingLanes, spawnedLane);

  // Reset this before firing side effects so we can detect recursive updates.
  didIncludeCommitPhaseUpdate = false;

  if (root === workInProgressRoot) {
    // We can reset these now that they are finished.
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  } else {
    // This indicates that the last root we worked on is not the same one that
    // we're committing now. This most commonly happens when a suspended root
    // times out.
  }

  // If there are pending passive effects, schedule a callback to process them.
  // Do this as early as possible, so it is queued before anything else that
  // might get scheduled in the commit phase. (See #16714.)
  // TODO: Delete all other places that schedule the passive effect callback
  // They're redundant.
  if (
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
    (finishedWork.flags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true;
      pendingPassiveEffectsRemainingLanes = remainingLanes;
      // workInProgressTransitions might be overwritten, so we want
      // to store it in pendingPassiveTransitions until they get processed
      // We need to pass this through as an argument to commitRoot
      // because workInProgressTransitions might have changed between
      // the previous render and commit if we throttle the commit
      // with setTimeout
      pendingPassiveTransitions = transitions;
      scheduleCallback(NormalSchedulerPriority, () => {
        flushPassiveEffects();
        // This render triggered passive effects: release the root cache pool
        // *after* passive effects fire to avoid freeing a cache pool that may
        // be referenced by a node in the tree (HostRoot, Cache boundary etc)
        return null;
      });
    }
  }

  // Check if there are any effects in the whole tree.
  // TODO: This is left over from the effect list implementation, where we had
  // to check for the existence of `firstEffect` to satisfy Flow. I think the
  // only other reason this optimization exists is because it affects profiling.
  // Reconsider whether this is necessary.
  const subtreeHasEffects =
    (finishedWork.subtreeFlags &
      (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
    NoFlags;
  const rootHasEffect =
    (finishedWork.flags &
      (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
    NoFlags;

  if (subtreeHasEffects || rootHasEffect) {
    const prevTransition = ReactSharedInternals.T;
    ReactSharedInternals.T = null;
    const previousPriority = getCurrentUpdatePriority();
    setCurrentUpdatePriority(DiscreteEventPriority);

    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;

    // The commit phase is broken into several sub-phases. We do a separate pass
    // of the effect list for each phase: all mutation effects come before all
    // layout effects, and so on.

    // The first phase a "before mutation" phase. We use this phase to read the
    // state of the host tree right before we mutate it. This is where
    // getSnapshotBeforeUpdate is called.
    const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(
      root,
      finishedWork,
    );

    if (enableProfilerTimer) {
      // Mark the current commit time to be shared by all Profilers in this
      // batch. This enables them to be grouped later.
      recordCommitTime();
    }

    // The next phase is the mutation phase, where we mutate the host tree.
    commitMutationEffects(root, finishedWork, lanes);

    if (enableCreateEventHandleAPI) {
      if (shouldFireAfterActiveInstanceBlur) {
        afterActiveInstanceBlur();
      }
    }
    resetAfterCommit(root.containerInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the mutation phase, so that the previous tree is still current during
    // componentWillUnmount, but before the layout phase, so that the finished
    // work is current during componentDidMount/Update.
    root.current = finishedWork;

    // The next phase is the layout phase, where we call effects that read
    // the host tree after it's been mutated. The idiomatic use case for this is
    // layout, but class component lifecycles also fire here for legacy reasons.
    if (__DEV__) {
      if (enableDebugTracing) {
        logLayoutEffectsStarted(lanes);
      }
    }
    if (enableSchedulingProfiler) {
      markLayoutEffectsStarted(lanes);
    }
    commitLayoutEffects(finishedWork, root, lanes);
    if (__DEV__) {
      if (enableDebugTracing) {
        logLayoutEffectsStopped();
      }
    }

    if (enableSchedulingProfiler) {
      markLayoutEffectsStopped();
    }

    // Tell Scheduler to yield at the end of the frame, so the browser has an
    // opportunity to paint.
    requestPaint();

    executionContext = prevExecutionContext;

    // Reset the priority to the previous non-sync value.
    setCurrentUpdatePriority(previousPriority);
    ReactSharedInternals.T = prevTransition;
  } else {
    // No effects.
    root.current = finishedWork;
    // Measure these anyway so the flamegraph explicitly shows that there were
    // no effects.
    // TODO: Maybe there's a better way to report this.
    if (enableProfilerTimer) {
      recordCommitTime();
    }
  }

  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

  if (rootDoesHavePassiveEffects) {
    // This commit has passive effects. Stash a reference to them. But don't
    // schedule a callback until after flushing layout work.
    rootDoesHavePassiveEffects = false;
    rootWithPendingPassiveEffects = root;
    pendingPassiveEffectsLanes = lanes;
  } else {
    // There were no passive effects, so we can immediately release the cache
    // pool for this render.
    releaseRootPooledCache(root, remainingLanes);
    if (__DEV__) {
      nestedPassiveUpdateCount = 0;
      rootWithPassiveNestedUpdates = null;
    }
  }

  // Read this again, since an effect might have updated it
  remainingLanes = root.pendingLanes;

  // Check if there's remaining work on this root
  // TODO: This is part of the `componentDidCatch` implementation. Its purpose
  // is to detect whether something might have called setState inside
  // `componentDidCatch`. The mechanism is known to be flawed because `setState`
  // inside `componentDidCatch` is itself flawed — that's why we recommend
  // `getDerivedStateFromError` instead. However, it could be improved by
  // checking if remainingLanes includes Sync work, instead of whether there's
  // any work remaining at all (which would also include stuff like Suspense
  // retries or transitions). It's been like this for a while, though, so fixing
  // it probably isn't that urgent.
  if (remainingLanes === NoLanes) {
    // If there's no remaining work, we can clear the set of already failed
    // error boundaries.
    legacyErrorBoundariesThatAlreadyFailed = null;
  }

  if (__DEV__) {
    if (!rootDidHavePassiveEffects) {
      commitDoubleInvokeEffectsInDEV(root, false);
    }
  }

  onCommitRootDevTools(finishedWork.stateNode, renderPriorityLevel);

  if (enableUpdaterTracking) {
    if (isDevToolsPresent) {
      root.memoizedUpdaters.clear();
    }
  }

  if (__DEV__) {
    onCommitRootTestSelector();
  }

  // Always call this before exiting `commitRoot`, to ensure that any
  // additional work on this root is scheduled.
  ensureRootIsScheduled(root);

  if (recoverableErrors !== null) {
    // There were errors during this render, but recovered from them without
    // needing to surface it to the UI. We log them here.
    const onRecoverableError = root.onRecoverableError;
    for (let i = 0; i < recoverableErrors.length; i++) {
      const recoverableError = recoverableErrors[i];
      const errorInfo = makeErrorInfo(recoverableError.stack);
      if (__DEV__) {
        runWithFiberInDEV(
          recoverableError.source,
          onRecoverableError,
          recoverableError.value,
          errorInfo,
        );
      } else {
        onRecoverableError(recoverableError.value, errorInfo);
      }
    }
  }

  // If the passive effects are the result of a discrete render, flush them
  // synchronously at the end of the current task so that the result is
  // immediately observable. Otherwise, we assume that they are not
  // order-dependent and do not need to be observed by external systems, so we
  // can wait until after paint.
  // TODO: We can optimize this by not scheduling the callback earlier. Since we
  // currently schedule the callback in multiple places, will wait until those
  // are consolidated.
  if (
    includesSyncLane(pendingPassiveEffectsLanes) &&
    (disableLegacyMode || root.tag !== LegacyRoot)
  ) {
    flushPassiveEffects();
  }

  // Read this again, since a passive effect might have updated it
  remainingLanes = root.pendingLanes;

  // Check if this render scheduled a cascading synchronous update. This is a
  // heurstic to detect infinite update loops. We are intentionally excluding
  // hydration lanes in this check, because render triggered by selective
  // hydration is conceptually not an update.
  if (
    // Check if there was a recursive update spawned by this render, in either
    // the render phase or the commit phase. We track these explicitly because
    // we can't infer from the remaining lanes alone.
    (enableInfiniteRenderLoopDetection &&
      (didIncludeRenderPhaseUpdate || didIncludeCommitPhaseUpdate)) ||
    // Was the finished render the result of an update (not hydration)?
    (includesSomeLane(lanes, UpdateLanes) &&
      // Did it schedule a sync update?
      includesSomeLane(remainingLanes, SyncUpdateLanes))
  ) {
    if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
      markNestedUpdateScheduled();
    }

    // Count the number of times the root synchronously re-renders without
    // finishing. If there are too many, it indicates an infinite update loop.
    if (root === rootWithNestedUpdates) {
      nestedUpdateCount++;
    } else {
      nestedUpdateCount = 0;
      rootWithNestedUpdates = root;
    }
  } else {
    nestedUpdateCount = 0;
  }

  // If layout work was scheduled, flush it now.
  flushSyncWorkOnAllRoots();

  if (__DEV__) {
    if (enableDebugTracing) {
      logCommitStopped();
    }
  }

  if (enableSchedulingProfiler) {
    markCommitStopped();
  }

  if (enableTransitionTracing) {
    // We process transitions during passive effects. However, passive effects can be
    // processed synchronously during the commit phase as well as asynchronously after
    // paint. At the end of the commit phase, we schedule a callback that will be called
    // after the next paint. If the transitions have already been processed (passive
    // effect phase happened synchronously), we will schedule a callback to process
    // the transitions. However, if we don't have any pending transition callbacks, this
    // means that the transitions have yet to be processed (passive effects processed after paint)
    // so we will store the end time of paint so that we can process the transitions
    // and then call the callback via the correct end time.
    const prevRootTransitionCallbacks = root.transitionCallbacks;
    if (prevRootTransitionCallbacks !== null) {
      schedulePostPaintCallback(endTime => {
        const prevPendingTransitionCallbacks =
          currentPendingTransitionCallbacks;
        if (prevPendingTransitionCallbacks !== null) {
          currentPendingTransitionCallbacks = null;
          scheduleCallback(IdleSchedulerPriority, () => {
            processTransitionCallbacks(
              prevPendingTransitionCallbacks,
              endTime,
              prevRootTransitionCallbacks,
            );
          });
        } else {
          currentEndTime = endTime;
        }
      });
    }
  }

  return null;
}

function makeErrorInfo(componentStack: ?string) {
  const errorInfo = {
    componentStack,
  };
  if (__DEV__) {
    Object.defineProperty((errorInfo: any), 'digest', {
      get() {
        console.error(
          'You are accessing "digest" from the errorInfo object passed to onRecoverableError.' +
            ' This property is no longer provided as part of errorInfo but can be accessed as a property' +
            ' of the Error instance itself.',
        );
      },
    });
  }
  return errorInfo;
}

function releaseRootPooledCache(root: FiberRoot, remainingLanes: Lanes) {
  if (enableCache) {
    const pooledCacheLanes = (root.pooledCacheLanes &= remainingLanes);
    if (pooledCacheLanes === NoLanes) {
      // None of the remaining work relies on the cache pool. Clear it so
      // subsequent requests get a new cache
      const pooledCache = root.pooledCache;
      if (pooledCache != null) {
        root.pooledCache = null;
        releaseCache(pooledCache);
      }
    }
  }
}

export function flushPassiveEffects(): boolean {
  // Returns whether passive effects were flushed.
  // TODO: Combine this check with the one in flushPassiveEFfectsImpl. We should
  // probably just combine the two functions. I believe they were only separate
  // in the first place because we used to wrap it with
  // `Scheduler.runWithPriority`, which accepts a function. But now we track the
  // priority within React itself, so we can mutate the variable directly.
  if (rootWithPendingPassiveEffects !== null) {
    // Cache the root since rootWithPendingPassiveEffects is cleared in
    // flushPassiveEffectsImpl
    const root = rootWithPendingPassiveEffects;
    // Cache and clear the remaining lanes flag; it must be reset since this
    // method can be called from various places, not always from commitRoot
    // where the remaining lanes are known
    const remainingLanes = pendingPassiveEffectsRemainingLanes;
    pendingPassiveEffectsRemainingLanes = NoLanes;

    const renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes);
    const priority = lowerEventPriority(DefaultEventPriority, renderPriority);
    const prevTransition = ReactSharedInternals.T;
    const previousPriority = getCurrentUpdatePriority();

    try {
      setCurrentUpdatePriority(priority);
      ReactSharedInternals.T = null;
      return flushPassiveEffectsImpl();
    } finally {
      setCurrentUpdatePriority(previousPriority);
      ReactSharedInternals.T = prevTransition;

      // Once passive effects have run for the tree - giving components a
      // chance to retain cache instances they use - release the pooled
      // cache at the root (if there is one)
      releaseRootPooledCache(root, remainingLanes);
    }
  }
  return false;
}

export function enqueuePendingPassiveProfilerEffect(fiber: Fiber): void {
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    pendingPassiveProfilerEffects.push(fiber);
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true;
      scheduleCallback(NormalSchedulerPriority, () => {
        flushPassiveEffects();
        return null;
      });
    }
  }
}

function flushPassiveEffectsImpl() {
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }

  // Cache and clear the transitions flag
  const transitions = pendingPassiveTransitions;
  pendingPassiveTransitions = null;

  const root = rootWithPendingPassiveEffects;
  const lanes = pendingPassiveEffectsLanes;
  rootWithPendingPassiveEffects = null;
  // TODO: This is sometimes out of sync with rootWithPendingPassiveEffects.
  // Figure out why and fix it. It's not causing any known issues (probably
  // because it's only used for profiling), but it's a refactor hazard.
  pendingPassiveEffectsLanes = NoLanes;

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Cannot flush passive effects while already rendering.');
  }

  if (__DEV__) {
    isFlushingPassiveEffects = true;
    didScheduleUpdateDuringPassiveEffects = false;

    if (enableDebugTracing) {
      logPassiveEffectsStarted(lanes);
    }
  }

  if (enableSchedulingProfiler) {
    markPassiveEffectsStarted(lanes);
  }

  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;

  commitPassiveUnmountEffects(root.current);
  commitPassiveMountEffects(root, root.current, lanes, transitions);

  // TODO: Move to commitPassiveMountEffects
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    const profilerEffects = pendingPassiveProfilerEffects;
    pendingPassiveProfilerEffects = [];
    for (let i = 0; i < profilerEffects.length; i++) {
      const fiber = ((profilerEffects[i]: any): Fiber);
      commitPassiveEffectDurations(root, fiber);
    }
  }

  if (__DEV__) {
    if (enableDebugTracing) {
      logPassiveEffectsStopped();
    }
  }

  if (enableSchedulingProfiler) {
    markPassiveEffectsStopped();
  }

  if (__DEV__) {
    commitDoubleInvokeEffectsInDEV(root, true);
  }

  executionContext = prevExecutionContext;

  flushSyncWorkOnAllRoots();

  if (enableTransitionTracing) {
    const prevPendingTransitionCallbacks = currentPendingTransitionCallbacks;
    const prevRootTransitionCallbacks = root.transitionCallbacks;
    const prevEndTime = currentEndTime;
    if (
      prevPendingTransitionCallbacks !== null &&
      prevRootTransitionCallbacks !== null &&
      prevEndTime !== null
    ) {
      currentPendingTransitionCallbacks = null;
      currentEndTime = null;
      scheduleCallback(IdleSchedulerPriority, () => {
        processTransitionCallbacks(
          prevPendingTransitionCallbacks,
          prevEndTime,
          prevRootTransitionCallbacks,
        );
      });
    }
  }

  if (__DEV__) {
    // If additional passive effects were scheduled, increment a counter. If this
    // exceeds the limit, we'll fire a warning.
    if (didScheduleUpdateDuringPassiveEffects) {
      if (root === rootWithPassiveNestedUpdates) {
        nestedPassiveUpdateCount++;
      } else {
        nestedPassiveUpdateCount = 0;
        rootWithPassiveNestedUpdates = root;
      }
    } else {
      nestedPassiveUpdateCount = 0;
    }
    isFlushingPassiveEffects = false;
    didScheduleUpdateDuringPassiveEffects = false;
  }

  // TODO: Move to commitPassiveMountEffects
  onPostCommitRootDevTools(root);
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    const stateNode = root.current.stateNode;
    stateNode.effectDuration = 0;
    stateNode.passiveEffectDuration = 0;
  }

  return true;
}

export function isAlreadyFailedLegacyErrorBoundary(instance: mixed): boolean {
  return (
    legacyErrorBoundariesThatAlreadyFailed !== null &&
    legacyErrorBoundariesThatAlreadyFailed.has(instance)
  );
}

export function markLegacyErrorBoundaryAsFailed(instance: mixed) {
  if (legacyErrorBoundariesThatAlreadyFailed === null) {
    legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
  } else {
    legacyErrorBoundariesThatAlreadyFailed.add(instance);
  }
}

function captureCommitPhaseErrorOnRoot(
  rootFiber: Fiber,
  sourceFiber: Fiber,
  error: mixed,
) {
  const errorInfo = createCapturedValueAtFiber(error, sourceFiber);
  const update = createRootErrorUpdate(
    rootFiber.stateNode,
    errorInfo,
    (SyncLane: Lane),
  );
  const root = enqueueUpdate(rootFiber, update, (SyncLane: Lane));
  if (root !== null) {
    markRootUpdated(root, SyncLane);
    ensureRootIsScheduled(root);
  }
}

export function captureCommitPhaseError(
  sourceFiber: Fiber,
  nearestMountedAncestor: Fiber | null,
  error: mixed,
) {
  if (__DEV__) {
    setIsRunningInsertionEffect(false);
  }
  if (sourceFiber.tag === HostRoot) {
    // Error was thrown at the root. There is no parent, so the root
    // itself should capture it.
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
    return;
  }

  let fiber = nearestMountedAncestor;
  while (fiber !== null) {
    if (fiber.tag === HostRoot) {
      captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
      return;
    } else if (fiber.tag === ClassComponent) {
      const ctor = fiber.type;
      const instance = fiber.stateNode;
      if (
        typeof ctor.getDerivedStateFromError === 'function' ||
        (typeof instance.componentDidCatch === 'function' &&
          !isAlreadyFailedLegacyErrorBoundary(instance))
      ) {
        const errorInfo = createCapturedValueAtFiber(error, sourceFiber);
        const update = createClassErrorUpdate((SyncLane: Lane));
        const root = enqueueUpdate(fiber, update, (SyncLane: Lane));
        if (root !== null) {
          initializeClassErrorUpdate(update, root, fiber, errorInfo);
          markRootUpdated(root, SyncLane);
          ensureRootIsScheduled(root);
        }
        return;
      }
    }
    fiber = fiber.return;
  }

  if (__DEV__) {
    console.error(
      'Internal React error: Attempted to capture a commit phase error ' +
        'inside a detached tree. This indicates a bug in React. Potential ' +
        'causes include deleting the same fiber more than once, committing an ' +
        'already-finished tree, or an inconsistent return pointer.\n\n' +
        'Error message:\n\n%s',
      error,
    );
  }
}

export function attachPingListener(
  root: FiberRoot,
  wakeable: Wakeable,
  lanes: Lanes,
) {
  // Attach a ping listener
  //
  // The data might resolve before we have a chance to commit the fallback. Or,
  // in the case of a refresh, we'll never commit a fallback. So we need to
  // attach a listener now. When it resolves ("pings"), we can decide whether to
  // try rendering the tree again.
  //
  // Only attach a listener if one does not already exist for the lanes
  // we're currently rendering (which acts like a "thread ID" here).
  //
  // We only need to do this in concurrent mode. Legacy Suspense always
  // commits fallbacks synchronously, so there are no pings.
  let pingCache = root.pingCache;
  let threadIDs;
  if (pingCache === null) {
    pingCache = root.pingCache = new PossiblyWeakMap();
    threadIDs = new Set<mixed>();
    pingCache.set(wakeable, threadIDs);
  } else {
    threadIDs = pingCache.get(wakeable);
    if (threadIDs === undefined) {
      threadIDs = new Set();
      pingCache.set(wakeable, threadIDs);
    }
  }
  if (!threadIDs.has(lanes)) {
    workInProgressRootDidAttachPingListener = true;

    // Memoize using the thread ID to prevent redundant listeners.
    threadIDs.add(lanes);
    const ping = pingSuspendedRoot.bind(null, root, wakeable, lanes);
    if (enableUpdaterTracking) {
      if (isDevToolsPresent) {
        // If we have pending work still, restore the original updaters
        restorePendingUpdaters(root, lanes);
      }
    }
    wakeable.then(ping, ping);
  }
}

function pingSuspendedRoot(
  root: FiberRoot,
  wakeable: Wakeable,
  pingedLanes: Lanes,
) {
  const pingCache = root.pingCache;
  if (pingCache !== null) {
    // The wakeable resolved, so we no longer need to memoize, because it will
    // never be thrown again.
    pingCache.delete(wakeable);
  }

  markRootPinged(root, pingedLanes);

  warnIfSuspenseResolutionNotWrappedWithActDEV(root);

  if (
    workInProgressRoot === root &&
    isSubsetOfLanes(workInProgressRootRenderLanes, pingedLanes)
  ) {
    // Received a ping at the same priority level at which we're currently
    // rendering. We might want to restart this render. This should mirror
    // the logic of whether or not a root suspends once it completes.
    // TODO: If we're rendering sync either due to Sync, Batched or expired,
    // we should probably never restart.

    // If we're suspended with delay, or if it's a retry, we'll always suspend
    // so we can always restart.
    if (
      workInProgressRootExitStatus === RootSuspendedWithDelay ||
      (workInProgressRootExitStatus === RootSuspended &&
        includesOnlyRetries(workInProgressRootRenderLanes) &&
        now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
    ) {
      // Force a restart from the root by unwinding the stack. Unless this is
      // being called from the render phase, because that would cause a crash.
      if ((executionContext & RenderContext) === NoContext) {
        prepareFreshStack(root, NoLanes);
      } else {
        // TODO: If this does happen during the render phase, we should throw
        // the special internal exception that we use to interrupt the stack for
        // selective hydration. That was temporarily reverted but we once we add
        // it back we can use it here.
      }
    } else {
      // Even though we can't restart right now, we might get an
      // opportunity later. So we mark this render as having a ping.
      workInProgressRootPingedLanes = mergeLanes(
        workInProgressRootPingedLanes,
        pingedLanes,
      );
    }
  }

  ensureRootIsScheduled(root);
}

function retryTimedOutBoundary(boundaryFiber: Fiber, retryLane: Lane) {
  // The boundary fiber (a Suspense component or SuspenseList component)
  // previously was rendered in its fallback state. One of the promises that
  // suspended it has resolved, which means at least part of the tree was
  // likely unblocked. Try rendering again, at a new lanes.
  if (retryLane === NoLane) {
    // TODO: Assign this to `suspenseState.retryLane`? to avoid
    // unnecessary entanglement?
    retryLane = requestRetryLane(boundaryFiber);
  }
  // TODO: Special case idle priority?
  const root = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
  if (root !== null) {
    markRootUpdated(root, retryLane);
    ensureRootIsScheduled(root);
  }
}

export function retryDehydratedSuspenseBoundary(boundaryFiber: Fiber) {
  const suspenseState: null | SuspenseState = boundaryFiber.memoizedState;
  let retryLane: Lane = NoLane;
  if (suspenseState !== null) {
    retryLane = suspenseState.retryLane;
  }
  retryTimedOutBoundary(boundaryFiber, retryLane);
}

export function resolveRetryWakeable(boundaryFiber: Fiber, wakeable: Wakeable) {
  let retryLane: Lane = NoLane; // Default
  let retryCache: WeakSet<Wakeable> | Set<Wakeable> | null;
  switch (boundaryFiber.tag) {
    case SuspenseComponent:
      retryCache = boundaryFiber.stateNode;
      const suspenseState: null | SuspenseState = boundaryFiber.memoizedState;
      if (suspenseState !== null) {
        retryLane = suspenseState.retryLane;
      }
      break;
    case SuspenseListComponent:
      retryCache = boundaryFiber.stateNode;
      break;
    case OffscreenComponent: {
      const instance: OffscreenInstance = boundaryFiber.stateNode;
      retryCache = instance._retryCache;
      break;
    }
    default:
      throw new Error(
        'Pinged unknown suspense boundary type. ' +
          'This is probably a bug in React.',
      );
  }

  if (retryCache !== null) {
    // The wakeable resolved, so we no longer need to memoize, because it will
    // never be thrown again.
    retryCache.delete(wakeable);
  }

  retryTimedOutBoundary(boundaryFiber, retryLane);
}

export function throwIfInfiniteUpdateLoopDetected() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    nestedPassiveUpdateCount = 0;
    rootWithNestedUpdates = null;
    rootWithPassiveNestedUpdates = null;

    if (enableInfiniteRenderLoopDetection) {
      if (executionContext & RenderContext && workInProgressRoot !== null) {
        // We're in the render phase. Disable the concurrent error recovery
        // mechanism to ensure that the error we're about to throw gets handled.
        // We need it to trigger the nearest error boundary so that the infinite
        // update loop is broken.
        workInProgressRoot.errorRecoveryDisabledLanes = mergeLanes(
          workInProgressRoot.errorRecoveryDisabledLanes,
          workInProgressRootRenderLanes,
        );
      }
    }

    throw new Error(
      'Maximum update depth exceeded. This can happen when a component ' +
        'repeatedly calls setState inside componentWillUpdate or ' +
        'componentDidUpdate. React limits the number of nested updates to ' +
        'prevent infinite loops.',
    );
  }

  if (__DEV__) {
    if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
      nestedPassiveUpdateCount = 0;
      rootWithPassiveNestedUpdates = null;

      console.error(
        'Maximum update depth exceeded. This can happen when a component ' +
          "calls setState inside useEffect, but useEffect either doesn't " +
          'have a dependency array, or one of the dependencies changes on ' +
          'every render.',
      );
    }
  }
}

function flushRenderPhaseStrictModeWarningsInDEV() {
  if (__DEV__) {
    ReactStrictModeWarnings.flushLegacyContextWarning();
    ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
  }
}

function recursivelyTraverseAndDoubleInvokeEffectsInDEV(
  root: FiberRoot,
  parentFiber: Fiber,
  isInStrictMode: boolean,
) {
  if ((parentFiber.subtreeFlags & (PlacementDEV | Visibility)) === NoFlags) {
    // Parent's descendants have already had effects double invoked.
    // Early exit to avoid unnecessary tree traversal.
    return;
  }
  let child = parentFiber.child;
  while (child !== null) {
    doubleInvokeEffectsInDEVIfNecessary(root, child, isInStrictMode);
    child = child.sibling;
  }
}

// Unconditionally disconnects and connects passive and layout effects.
function doubleInvokeEffectsOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  shouldDoubleInvokePassiveEffects: boolean = true,
) {
  setIsStrictModeForDevtools(true);
  disappearLayoutEffects(fiber);
  if (shouldDoubleInvokePassiveEffects) {
    disconnectPassiveEffect(fiber);
  }
  reappearLayoutEffects(root, fiber.alternate, fiber, false);
  if (shouldDoubleInvokePassiveEffects) {
    reconnectPassiveEffects(root, fiber, NoLanes, null, false);
  }
  setIsStrictModeForDevtools(false);
}

function doubleInvokeEffectsInDEVIfNecessary(
  root: FiberRoot,
  fiber: Fiber,
  parentIsInStrictMode: boolean,
) {
  const isStrictModeFiber = fiber.type === REACT_STRICT_MODE_TYPE;
  const isInStrictMode = parentIsInStrictMode || isStrictModeFiber;

  // First case: the fiber **is not** of type OffscreenComponent. No
  // special rules apply to double invoking effects.
  if (fiber.tag !== OffscreenComponent) {
    if (fiber.flags & PlacementDEV) {
      if (isInStrictMode) {
        runWithFiberInDEV(
          fiber,
          doubleInvokeEffectsOnFiber,
          root,
          fiber,
          (fiber.mode & NoStrictPassiveEffectsMode) === NoMode,
        );
      }
    } else {
      recursivelyTraverseAndDoubleInvokeEffectsInDEV(
        root,
        fiber,
        isInStrictMode,
      );
    }
    return;
  }

  // Second case: the fiber **is** of type OffscreenComponent.
  // This branch contains cases specific to Offscreen.
  if (fiber.memoizedState === null) {
    // Only consider Offscreen that is visible.
    // TODO (Offscreen) Handle manual mode.
    if (isInStrictMode && fiber.flags & Visibility) {
      // Double invoke effects on Offscreen's subtree only
      // if it is visible and its visibility has changed.
      runWithFiberInDEV(fiber, doubleInvokeEffectsOnFiber, root, fiber);
    } else if (fiber.subtreeFlags & PlacementDEV) {
      // Something in the subtree could have been suspended.
      // We need to continue traversal and find newly inserted fibers.
      runWithFiberInDEV(
        fiber,
        recursivelyTraverseAndDoubleInvokeEffectsInDEV,
        root,
        fiber,
        isInStrictMode,
      );
    }
  }
}

function commitDoubleInvokeEffectsInDEV(
  root: FiberRoot,
  hasPassiveEffects: boolean,
) {
  if (__DEV__) {
    if (useModernStrictMode && (disableLegacyMode || root.tag !== LegacyRoot)) {
      let doubleInvokeEffects = true;

      if (
        (disableLegacyMode || root.tag === ConcurrentRoot) &&
        !(root.current.mode & (StrictLegacyMode | StrictEffectsMode))
      ) {
        doubleInvokeEffects = false;
      }
      recursivelyTraverseAndDoubleInvokeEffectsInDEV(
        root,
        root.current,
        doubleInvokeEffects,
      );
    } else {
      // TODO: Is this runWithFiberInDEV needed since the other effect functions do it too?
      runWithFiberInDEV(
        root.current,
        legacyCommitDoubleInvokeEffectsInDEV,
        root.current,
        hasPassiveEffects,
      );
    }
  }
}

function legacyCommitDoubleInvokeEffectsInDEV(
  fiber: Fiber,
  hasPassiveEffects: boolean,
) {
  // TODO (StrictEffects) Should we set a marker on the root if it contains strict effects
  // so we don't traverse unnecessarily? similar to subtreeFlags but just at the root level.
  // Maybe not a big deal since this is DEV only behavior.

  invokeEffectsInDev(fiber, MountLayoutDev, invokeLayoutEffectUnmountInDEV);
  if (hasPassiveEffects) {
    invokeEffectsInDev(fiber, MountPassiveDev, invokePassiveEffectUnmountInDEV);
  }

  invokeEffectsInDev(fiber, MountLayoutDev, invokeLayoutEffectMountInDEV);
  if (hasPassiveEffects) {
    invokeEffectsInDev(fiber, MountPassiveDev, invokePassiveEffectMountInDEV);
  }
}

function invokeEffectsInDev(
  firstChild: Fiber,
  fiberFlags: Flags,
  invokeEffectFn: (fiber: Fiber) => void,
) {
  let current: null | Fiber = firstChild;
  let subtreeRoot = null;
  while (current != null) {
    const primarySubtreeFlag = current.subtreeFlags & fiberFlags;
    if (
      current !== subtreeRoot &&
      current.child != null &&
      primarySubtreeFlag !== NoFlags
    ) {
      current = current.child;
    } else {
      if ((current.flags & fiberFlags) !== NoFlags) {
        invokeEffectFn(current);
      }

      if (current.sibling !== null) {
        current = current.sibling;
      } else {
        current = subtreeRoot = current.return;
      }
    }
  }
}

let didWarnStateUpdateForNotYetMountedComponent: Set<string> | null = null;
export function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber: Fiber) {
  if (__DEV__) {
    if ((executionContext & RenderContext) !== NoContext) {
      // We let the other warning about render phase updates deal with this one.
      return;
    }

    if (!disableLegacyMode && !(fiber.mode & ConcurrentMode)) {
      return;
    }

    const tag = fiber.tag;
    if (
      tag !== HostRoot &&
      tag !== ClassComponent &&
      tag !== FunctionComponent &&
      tag !== ForwardRef &&
      tag !== MemoComponent &&
      tag !== SimpleMemoComponent
    ) {
      // Only warn for user-defined components, not internal ones like Suspense.
      return;
    }

    // We show the whole stack but dedupe on the top component's name because
    // the problematic code almost always lies inside that component.
    const componentName = getComponentNameFromFiber(fiber) || 'ReactComponent';
    if (didWarnStateUpdateForNotYetMountedComponent !== null) {
      if (didWarnStateUpdateForNotYetMountedComponent.has(componentName)) {
        return;
      }
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      didWarnStateUpdateForNotYetMountedComponent.add(componentName);
    } else {
      didWarnStateUpdateForNotYetMountedComponent = new Set([componentName]);
    }

    runWithFiberInDEV(fiber, () => {
      console.error(
        "Can't perform a React state update on a component that hasn't mounted yet. " +
          'This indicates that you have a side-effect in your render function that ' +
          'asynchronously later calls tries to update the component. Move this work to ' +
          'useEffect instead.',
      );
    });
  }
}

let didWarnAboutUpdateInRender = false;
let didWarnAboutUpdateInRenderForAnotherComponent;
if (__DEV__) {
  didWarnAboutUpdateInRenderForAnotherComponent = new Set<string>();
}

function warnAboutRenderPhaseUpdatesInDEV(fiber: Fiber) {
  if (__DEV__) {
    if (ReactCurrentDebugFiberIsRenderingInDEV) {
      switch (fiber.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          const renderingComponentName =
            (workInProgress && getComponentNameFromFiber(workInProgress)) ||
            'Unknown';
          // Dedupe by the rendering component because it's the one that needs to be fixed.
          const dedupeKey = renderingComponentName;
          if (!didWarnAboutUpdateInRenderForAnotherComponent.has(dedupeKey)) {
            didWarnAboutUpdateInRenderForAnotherComponent.add(dedupeKey);
            const setStateComponentName =
              getComponentNameFromFiber(fiber) || 'Unknown';
            console.error(
              'Cannot update a component (`%s`) while rendering a ' +
                'different component (`%s`). To locate the bad setState() call inside `%s`, ' +
                'follow the stack trace as described in https://react.dev/link/setstate-in-render',
              setStateComponentName,
              renderingComponentName,
              renderingComponentName,
            );
          }
          break;
        }
        case ClassComponent: {
          if (!didWarnAboutUpdateInRender) {
            console.error(
              'Cannot update during an existing state transition (such as ' +
                'within `render`). Render methods should be a pure ' +
                'function of props and state.',
            );
            didWarnAboutUpdateInRender = true;
          }
          break;
        }
      }
    }
  }
}

export function restorePendingUpdaters(root: FiberRoot, lanes: Lanes): void {
  if (enableUpdaterTracking) {
    if (isDevToolsPresent) {
      const memoizedUpdaters = root.memoizedUpdaters;
      memoizedUpdaters.forEach(schedulingFiber => {
        addFiberToLanesMap(root, schedulingFiber, lanes);
      });

      // This function intentionally does not clear memoized updaters.
      // Those may still be relevant to the current commit
      // and a future one (e.g. Suspense).
    }
  }
}

const fakeActCallbackNode = {};
// $FlowFixMe[missing-local-annot]
function scheduleCallback(priorityLevel: any, callback) {
  if (__DEV__) {
    // If we're currently inside an `act` scope, bypass Scheduler and push to
    // the `act` queue instead.
    const actQueue = ReactSharedInternals.actQueue;
    if (actQueue !== null) {
      actQueue.push(callback);
      return fakeActCallbackNode;
    } else {
      return Scheduler_scheduleCallback(priorityLevel, callback);
    }
  } else {
    // In production, always call Scheduler. This function will be stripped out.
    return Scheduler_scheduleCallback(priorityLevel, callback);
  }
}

function shouldForceFlushFallbacksInDEV() {
  // Never force flush in production. This function should get stripped out.
  return __DEV__ && ReactSharedInternals.actQueue !== null;
}

function warnIfUpdatesNotWrappedWithActDEV(fiber: Fiber): void {
  if (__DEV__) {
    if (disableLegacyMode || fiber.mode & ConcurrentMode) {
      if (!isConcurrentActEnvironment()) {
        // Not in an act environment. No need to warn.
        return;
      }
    } else {
      // Legacy mode has additional cases where we suppress a warning.
      if (!isLegacyActEnvironment(fiber)) {
        // Not in an act environment. No need to warn.
        return;
      }
      if (executionContext !== NoContext) {
        // Legacy mode doesn't warn if the update is batched, i.e.
        // batchedUpdates or flushSync.
        return;
      }
      if (
        fiber.tag !== FunctionComponent &&
        fiber.tag !== ForwardRef &&
        fiber.tag !== SimpleMemoComponent
      ) {
        // For backwards compatibility with pre-hooks code, legacy mode only
        // warns for updates that originate from a hook.
        return;
      }
    }

    if (ReactSharedInternals.actQueue === null) {
      runWithFiberInDEV(fiber, () => {
        console.error(
          'An update to %s inside a test was not wrapped in act(...).\n\n' +
            'When testing, code that causes React state updates should be ' +
            'wrapped into act(...):\n\n' +
            'act(() => {\n' +
            '  /* fire events that update state */\n' +
            '});\n' +
            '/* assert on the output */\n\n' +
            "This ensures that you're testing the behavior the user would see " +
            'in the browser.' +
            ' Learn more at https://react.dev/link/wrap-tests-with-act',
          getComponentNameFromFiber(fiber),
        );
      });
    }
  }
}

function warnIfSuspenseResolutionNotWrappedWithActDEV(root: FiberRoot): void {
  if (__DEV__) {
    if (
      (disableLegacyMode || root.tag !== LegacyRoot) &&
      isConcurrentActEnvironment() &&
      ReactSharedInternals.actQueue === null
    ) {
      console.error(
        'A suspended resource finished loading inside a test, but the event ' +
          'was not wrapped in act(...).\n\n' +
          'When testing, code that resolves suspended data should be wrapped ' +
          'into act(...):\n\n' +
          'act(() => {\n' +
          '  /* finish loading suspended data */\n' +
          '});\n' +
          '/* assert on the output */\n\n' +
          "This ensures that you're testing the behavior the user would see " +
          'in the browser.' +
          ' Learn more at https://react.dev/link/wrap-tests-with-act',
      );
    }
  }
}

export function setIsRunningInsertionEffect(isRunning: boolean): void {
  if (__DEV__) {
    isRunningInsertionEffect = isRunning;
  }
}
