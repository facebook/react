/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {
  ReactPriorityLevel,
  SchedulerCallback,
} from './SchedulerWithReactIntegration';
import type {Interaction} from 'scheduler/src/Tracing';

import {
  warnAboutDeprecatedLifecycles,
  enableUserTimingAPI,
  enableSuspenseServerRenderer,
  replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableProfilerTimer,
  disableYielding,
  enableSchedulerTracing,
  revertPassiveEffectsChange,
} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import invariant from 'shared/invariant';
import warning from 'shared/warning';

import {
  scheduleCallback,
  cancelCallback,
  getCurrentPriorityLevel,
  runWithPriority,
  shouldYield,
  now,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  flushSyncCallbackQueue,
  scheduleSyncCallback,
} from './SchedulerWithReactIntegration';

import {__interactionsRef, __subscriberRef} from 'scheduler/tracing';

import {
  prepareForCommit,
  resetAfterCommit,
  scheduleTimeout,
  cancelTimeout,
  noTimeout,
} from './ReactFiberHostConfig';

import {createWorkInProgress, assignFiberPropertiesInDEV} from './ReactFiber';
import {
  NoMode,
  ProfileMode,
  BatchedMode,
  ConcurrentMode,
} from './ReactTypeOfMode';
import {
  HostRoot,
  ClassComponent,
  SuspenseComponent,
  DehydratedSuspenseComponent,
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
} from 'shared/ReactWorkTags';
import {
  NoEffect,
  PerformedWork,
  Placement,
  Update,
  PlacementAndUpdate,
  Deletion,
  Ref,
  ContentReset,
  Snapshot,
  Callback,
  Passive,
  Incomplete,
  HostEffectMask,
} from 'shared/ReactSideEffectTags';
import {
  NoWork,
  Sync,
  Never,
  msToExpirationTime,
  expirationTimeToMs,
  computeInteractiveExpiration,
  computeAsyncExpiration,
  inferPriorityFromExpirationTime,
  LOW_PRIORITY_EXPIRATION,
  Batched,
} from './ReactFiberExpirationTime';
import {beginWork as originalBeginWork} from './ReactFiberBeginWork';
import {completeWork} from './ReactFiberCompleteWork';
import {
  throwException,
  unwindWork,
  unwindInterruptedWork,
  createRootErrorUpdate,
  createClassErrorUpdate,
} from './ReactFiberUnwindWork';
import {
  commitBeforeMutationLifeCycles as commitBeforeMutationEffectOnFiber,
  commitLifeCycles as commitLayoutEffectOnFiber,
  commitPassiveHookEffects,
  commitPlacement,
  commitWork,
  commitDeletion,
  commitDetachRef,
  commitAttachRef,
  commitResetTextContent,
} from './ReactFiberCommitWork';
import {enqueueUpdate} from './ReactUpdateQueue';
// TODO: Ahaha Andrew is bad at spellling
import {resetContextDependences as resetContextDependencies} from './ReactFiberNewContext';
import {resetHooks, ContextOnlyDispatcher} from './ReactFiberHooks';
import {createCapturedValue} from './ReactCapturedValue';

import {
  recordCommitTime,
  startProfilerTimer,
  stopProfilerTimerIfRunningAndRecordDelta,
} from './ReactProfilerTimer';

// DEV stuff
import warningWithoutStack from 'shared/warningWithoutStack';
import getComponentName from 'shared/getComponentName';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import {
  phase as ReactCurrentDebugFiberPhaseInDEV,
  resetCurrentFiber as resetCurrentDebugFiberInDEV,
  setCurrentFiber as setCurrentDebugFiberInDEV,
  getStackByFiberInDevAndProd,
} from './ReactCurrentFiber';
import {
  recordEffect,
  recordScheduleUpdate,
  startRequestCallbackTimer,
  stopRequestCallbackTimer,
  startWorkTimer,
  stopWorkTimer,
  stopFailedWorkTimer,
  startWorkLoopTimer,
  stopWorkLoopTimer,
  startCommitTimer,
  stopCommitTimer,
  startCommitSnapshotEffectsTimer,
  stopCommitSnapshotEffectsTimer,
  startCommitHostEffectsTimer,
  stopCommitHostEffectsTimer,
  startCommitLifeCyclesTimer,
  stopCommitLifeCyclesTimer,
} from './ReactDebugFiberPerf';
import {
  invokeGuardedCallback,
  hasCaughtError,
  clearCaughtError,
} from 'shared/ReactErrorUtils';
import {onCommitRoot} from './ReactFiberDevToolsHook';

const ceil = Math.ceil;

const {
  ReactCurrentDispatcher,
  ReactCurrentOwner,
  ReactShouldWarnActingUpdates,
} = ReactSharedInternals;

type WorkPhase = 0 | 1 | 2 | 3 | 4 | 5;
const NotWorking = 0;
const BatchedPhase = 1;
const LegacyUnbatchedPhase = 2;
const FlushSyncPhase = 3;
const RenderPhase = 4;
const CommitPhase = 5;

type RootExitStatus = 0 | 1 | 2 | 3;
const RootIncomplete = 0;
const RootErrored = 1;
const RootSuspended = 2;
const RootCompleted = 3;

export type Thenable = {
  then(resolve: () => mixed, reject?: () => mixed): Thenable | void,
};

// The phase of work we're currently in
let workPhase: WorkPhase = NotWorking;
// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The expiration time we're rendering
let renderExpirationTime: ExpirationTime = NoWork;
// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootIncomplete;
// Most recent event time among processed updates during this render.
// This is conceptually a time stamp but expressed in terms of an ExpirationTime
// because we deal mostly with expiration times in the hot path, so this avoids
// the conversion happening in the hot path.
let workInProgressRootMostRecentEventTime: ExpirationTime = Sync;

let nextEffect: Fiber | null = null;
let hasUncaughtError = false;
let firstUncaughtError = null;
let legacyErrorBoundariesThatAlreadyFailed: Set<mixed> | null = null;

let rootDoesHavePassiveEffects: boolean = false;
let rootWithPendingPassiveEffects: FiberRoot | null = null;
let pendingPassiveEffectsExpirationTime: ExpirationTime = NoWork;

let rootsWithPendingDiscreteUpdates: Map<
  FiberRoot,
  ExpirationTime,
> | null = null;

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;

const NESTED_PASSIVE_UPDATE_LIMIT = 50;
let nestedPassiveUpdateCount: number = 0;

let interruptedBy: Fiber | null = null;

// Expiration times are computed by adding to the current time (the start
// time). However, if two updates are scheduled within the same event, we
// should treat their start times as simultaneous, even if the actual clock
// time has advanced between the first and second call.

// In other words, because expiration times determine how updates are batched,
// we want all updates of like priority that occur within the same event to
// receive the same expiration time. Otherwise we get tearing.
let currentEventTime: ExpirationTime = NoWork;

export function requestCurrentTime() {
  if (workPhase === RenderPhase || workPhase === CommitPhase) {
    // We're inside React, so it's fine to read the actual time.
    return msToExpirationTime(now());
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoWork) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = msToExpirationTime(now());
  return currentEventTime;
}

export function computeExpirationForFiber(
  currentTime: ExpirationTime,
  fiber: Fiber,
): ExpirationTime {
  const mode = fiber.mode;
  if ((mode & BatchedMode) === NoMode) {
    return Sync;
  }

  const priorityLevel = getCurrentPriorityLevel();
  if ((mode & ConcurrentMode) === NoMode) {
    return priorityLevel === ImmediatePriority ? Sync : Batched;
  }

  if (workPhase === RenderPhase) {
    // Use whatever time we're already rendering
    return renderExpirationTime;
  }

  // Compute an expiration time based on the Scheduler priority.
  let expirationTime;
  switch (priorityLevel) {
    case ImmediatePriority:
      expirationTime = Sync;
      break;
    case UserBlockingPriority:
      // TODO: Rename this to computeUserBlockingExpiration
      expirationTime = computeInteractiveExpiration(currentTime);
      break;
    case NormalPriority:
    case LowPriority: // TODO: Handle LowPriority
      // TODO: Rename this to... something better.
      expirationTime = computeAsyncExpiration(currentTime);
      break;
    case IdlePriority:
      expirationTime = Never;
      break;
    default:
      invariant(false, 'Expected a valid priority level');
  }

  // If we're in the middle of rendering a tree, do not update at the same
  // expiration time that is already rendering.
  if (workInProgressRoot !== null && expirationTime === renderExpirationTime) {
    // This is a trick to move this update into a separate batch
    expirationTime -= 1;
  }

  return expirationTime;
}

let lastUniqueAsyncExpiration = NoWork;
export function computeUniqueAsyncExpiration(): ExpirationTime {
  const currentTime = requestCurrentTime();
  let result = computeAsyncExpiration(currentTime);
  if (result <= lastUniqueAsyncExpiration) {
    // Since we assume the current time monotonically increases, we only hit
    // this branch when computeUniqueAsyncExpiration is fired multiple times
    // within a 200ms window (or whatever the async bucket size is).
    result -= 1;
  }
  lastUniqueAsyncExpiration = result;
  return result;
}

export function scheduleUpdateOnFiber(
  fiber: Fiber,
  expirationTime: ExpirationTime,
) {
  checkForNestedUpdates();
  warnAboutInvalidUpdatesOnClassComponentsInDEV(fiber);

  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  if (root === null) {
    warnAboutUpdateOnUnmountedFiberInDEV(fiber);
    return;
  }

  root.pingTime = NoWork;

  checkForInterruption(fiber, expirationTime);
  recordScheduleUpdate();

  if (expirationTime === Sync) {
    if (workPhase === LegacyUnbatchedPhase) {
      // Register pending interactions on the root to avoid losing traced interaction data.
      schedulePendingInteraction(root, expirationTime);

      // This is a legacy edge case. The initial mount of a ReactDOM.render-ed
      // root inside of batchedUpdates should be synchronous, but layout updates
      // should be deferred until the end of the batch.
      let callback = renderRoot(root, Sync, true);
      while (callback !== null) {
        callback = callback(true);
      }
    } else {
      scheduleCallbackForRoot(root, ImmediatePriority, Sync);
      if (workPhase === NotWorking) {
        // Flush the synchronous work now, wnless we're already working or inside
        // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
        // scheduleCallbackForFiber to preserve the ability to schedule a callback
        // without immediately flushing it. We only do this for user-initated
        // updates, to preserve historical behavior of sync mode.
        flushSyncCallbackQueue();
      }
    }
  } else {
    // TODO: computeExpirationForFiber also reads the priority. Pass the
    // priority as an argument to that function and this one.
    const priorityLevel = getCurrentPriorityLevel();
    if (priorityLevel === UserBlockingPriority) {
      // This is the result of a discrete event. Track the lowest priority
      // discrete update per root so we can flush them early, if needed.
      if (rootsWithPendingDiscreteUpdates === null) {
        rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
      } else {
        const lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);
        if (
          lastDiscreteTime === undefined ||
          lastDiscreteTime > expirationTime
        ) {
          rootsWithPendingDiscreteUpdates.set(root, expirationTime);
        }
      }
    }
    scheduleCallbackForRoot(root, priorityLevel, expirationTime);
  }
}
export const scheduleWork = scheduleUpdateOnFiber;

// This is split into a separate function so we can mark a fiber with pending
// work without treating it as a typical update that originates from an event;
// e.g. retrying a Suspense boundary isn't an update, but it does schedule work
// on a fiber.
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
  // Update the source fiber's expiration time
  if (fiber.expirationTime < expirationTime) {
    fiber.expirationTime = expirationTime;
  }
  let alternate = fiber.alternate;
  if (alternate !== null && alternate.expirationTime < expirationTime) {
    alternate.expirationTime = expirationTime;
  }
  // Walk the parent path to the root and update the child expiration time.
  let node = fiber.return;
  let root = null;
  if (node === null && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    while (node !== null) {
      alternate = node.alternate;
      if (node.childExpirationTime < expirationTime) {
        node.childExpirationTime = expirationTime;
        if (
          alternate !== null &&
          alternate.childExpirationTime < expirationTime
        ) {
          alternate.childExpirationTime = expirationTime;
        }
      } else if (
        alternate !== null &&
        alternate.childExpirationTime < expirationTime
      ) {
        alternate.childExpirationTime = expirationTime;
      }
      if (node.return === null && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }
      node = node.return;
    }
  }

  if (root !== null) {
    // Update the first and last pending expiration times in this root
    const firstPendingTime = root.firstPendingTime;
    if (expirationTime > firstPendingTime) {
      root.firstPendingTime = expirationTime;
    }
    const lastPendingTime = root.lastPendingTime;
    if (lastPendingTime === NoWork || expirationTime < lastPendingTime) {
      root.lastPendingTime = expirationTime;
    }
  }

  return root;
}

// Use this function, along with runRootCallback, to ensure that only a single
// callback per root is scheduled. It's still possible to call renderRoot
// directly, but scheduling via this function helps avoid excessive callbacks.
// It works by storing the callback node and expiration time on the root. When a
// new callback comes in, it compares the expiration time to determine if it
// should cancel the previous one. It also relies on commitRoot scheduling a
// callback to render the next level, because that means we don't need a
// separate callback per expiration time.
function scheduleCallbackForRoot(
  root: FiberRoot,
  priorityLevel: ReactPriorityLevel,
  expirationTime: ExpirationTime,
) {
  const existingCallbackExpirationTime = root.callbackExpirationTime;
  if (existingCallbackExpirationTime < expirationTime) {
    // New callback has higher priority than the existing one.
    const existingCallbackNode = root.callbackNode;
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    root.callbackExpirationTime = expirationTime;

    if (expirationTime === Sync) {
      // Sync React callbacks are scheduled on a special internal queue
      root.callbackNode = scheduleSyncCallback(
        runRootCallback.bind(
          null,
          root,
          renderRoot.bind(null, root, expirationTime),
        ),
      );
    } else {
      let options = null;
      if (expirationTime !== Sync && expirationTime !== Never) {
        let timeout = expirationTimeToMs(expirationTime) - now();
        if (timeout > 5000) {
          // Sanity check. Should never take longer than 5 seconds.
          // TODO: Add internal warning?
          timeout = 5000;
        }
        options = {timeout};
      }

      root.callbackNode = scheduleCallback(
        priorityLevel,
        runRootCallback.bind(
          null,
          root,
          renderRoot.bind(null, root, expirationTime),
        ),
        options,
      );
      if (
        enableUserTimingAPI &&
        expirationTime !== Sync &&
        workPhase !== RenderPhase &&
        workPhase !== CommitPhase
      ) {
        // Scheduled an async callback, and we're not already working. Add an
        // entry to the flamegraph that shows we're waiting for a callback
        // to fire.
        startRequestCallbackTimer();
      }
    }
  }

  // Add the current set of interactions to the pending set associated with
  // this root.
  schedulePendingInteraction(root, expirationTime);
}

function runRootCallback(root, callback, isSync) {
  const prevCallbackNode = root.callbackNode;
  let continuation = null;
  try {
    continuation = callback(isSync);
    if (continuation !== null) {
      return runRootCallback.bind(null, root, continuation);
    } else {
      return null;
    }
  } finally {
    // If the callback exits without returning a continuation, remove the
    // corresponding callback node from the root. Unless the callback node
    // has changed, which implies that it was already cancelled by a high
    // priority update.
    if (continuation === null && prevCallbackNode === root.callbackNode) {
      root.callbackNode = null;
      root.callbackExpirationTime = NoWork;
    }
  }
}

export function flushRoot(root: FiberRoot, expirationTime: ExpirationTime) {
  if (workPhase === RenderPhase || workPhase === CommitPhase) {
    invariant(
      false,
      'work.commit(): Cannot commit while already rendering. This likely ' +
        'means you attempted to commit from inside a lifecycle method.',
    );
  }
  scheduleSyncCallback(renderRoot.bind(null, root, expirationTime));
  flushSyncCallbackQueue();
}

export function flushInteractiveUpdates() {
  if (workPhase === RenderPhase || workPhase === CommitPhase) {
    // Can't synchronously flush interactive updates if React is already
    // working. This is currently a no-op.
    // TODO: Should we fire a warning? This happens if you synchronously invoke
    // an input event inside an effect, like with `element.click()`.
    return;
  }
  flushPendingDiscreteUpdates();
  if (!revertPassiveEffectsChange) {
    // If the discrete updates scheduled passive effects, flush them now so that
    // they fire before the next serial event.
    flushPassiveEffects();
  }
}

function resolveLocksOnRoot(root: FiberRoot, expirationTime: ExpirationTime) {
  const firstBatch = root.firstBatch;
  if (
    firstBatch !== null &&
    firstBatch._defer &&
    firstBatch._expirationTime >= expirationTime
  ) {
    scheduleCallback(NormalPriority, () => {
      firstBatch._onComplete();
      return null;
    });
    return true;
  } else {
    return false;
  }
}

export function deferredUpdates<A>(fn: () => A): A {
  // TODO: Remove in favor of Scheduler.next
  return runWithPriority(NormalPriority, fn);
}

export function interactiveUpdates<A, B, C, R>(
  fn: (A, B, C) => R,
  a: A,
  b: B,
  c: C,
): R {
  if (workPhase === NotWorking) {
    // TODO: Remove this call. Instead of doing this automatically, the caller
    // should explicitly call flushInteractiveUpdates.
    flushPendingDiscreteUpdates();
  }
  if (!revertPassiveEffectsChange) {
    // TODO: Remove this call for the same reason as above.
    flushPassiveEffects();
  }
  return runWithPriority(UserBlockingPriority, fn.bind(null, a, b, c));
}

export function syncUpdates<A, B, C, R>(
  fn: (A, B, C) => R,
  a: A,
  b: B,
  c: C,
): R {
  return runWithPriority(ImmediatePriority, fn.bind(null, a, b, c));
}

function flushPendingDiscreteUpdates() {
  if (rootsWithPendingDiscreteUpdates !== null) {
    // For each root with pending discrete updates, schedule a callback to
    // immediately flush them.
    const roots = rootsWithPendingDiscreteUpdates;
    rootsWithPendingDiscreteUpdates = null;
    roots.forEach((expirationTime, root) => {
      scheduleSyncCallback(renderRoot.bind(null, root, expirationTime));
    });
    // Now flush the immediate queue.
    flushSyncCallbackQueue();
  }
}

export function batchedUpdates<A, R>(fn: A => R, a: A): R {
  if (workPhase !== NotWorking) {
    // We're already working, or inside a batch, so batchedUpdates is a no-op.
    return fn(a);
  }
  workPhase = BatchedPhase;
  try {
    return fn(a);
  } finally {
    workPhase = NotWorking;
    // Flush the immediate callbacks that were scheduled during this batch
    flushSyncCallbackQueue();
  }
}

export function unbatchedUpdates<A, R>(fn: (a: A) => R, a: A): R {
  if (workPhase !== BatchedPhase && workPhase !== FlushSyncPhase) {
    // We're not inside batchedUpdates or flushSync, so unbatchedUpdates is
    // a no-op.
    return fn(a);
  }
  const prevWorkPhase = workPhase;
  workPhase = LegacyUnbatchedPhase;
  try {
    return fn(a);
  } finally {
    workPhase = prevWorkPhase;
  }
}

export function flushSync<A, R>(fn: A => R, a: A): R {
  if (workPhase === RenderPhase || workPhase === CommitPhase) {
    invariant(
      false,
      'flushSync was called from inside a lifecycle method. It cannot be ' +
        'called when React is already rendering.',
    );
  }
  const prevWorkPhase = workPhase;
  workPhase = FlushSyncPhase;
  try {
    return runWithPriority(ImmediatePriority, fn.bind(null, a));
  } finally {
    workPhase = prevWorkPhase;
    // Flush the immediate callbacks that were scheduled during this batch.
    // Note that this will happen even if batchedUpdates is higher up
    // the stack.
    flushSyncCallbackQueue();
  }
}

export function flushControlled(fn: () => mixed): void {
  const prevWorkPhase = workPhase;
  workPhase = BatchedPhase;
  try {
    runWithPriority(ImmediatePriority, fn);
  } finally {
    workPhase = prevWorkPhase;
    if (workPhase === NotWorking) {
      // Flush the immediate callbacks that were scheduled during this batch
      flushSyncCallbackQueue();
    }
  }
}

function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    // The root previous suspended and scheduled a timeout to commit a fallback
    // state. Now that we have additional work, cancel the timeout.
    root.timeoutHandle = noTimeout;
    // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above
    cancelTimeout(timeoutHandle);
  }

  if (workInProgress !== null) {
    let interruptedWork = workInProgress.return;
    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null, expirationTime);
  renderExpirationTime = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootMostRecentEventTime = Sync;

  if (__DEV__) {
    ReactStrictModeWarnings.discardPendingWarnings();
    componentsWithSuspendedDiscreteUpdates = null;
  }
}

function renderRoot(
  root: FiberRoot,
  expirationTime: ExpirationTime,
  isSync: boolean,
): SchedulerCallback | null {
  invariant(
    workPhase !== RenderPhase && workPhase !== CommitPhase,
    'Should not already be working.',
  );

  if (enableUserTimingAPI && expirationTime !== Sync) {
    const didExpire = isSync;
    stopRequestCallbackTimer(didExpire);
  }

  if (root.firstPendingTime < expirationTime) {
    // If there's no work left at this expiration time, exit immediately. This
    // happens when multiple callbacks are scheduled for a single root, but an
    // earlier callback flushes the work of a later one.
    return null;
  }

  if (root.finishedExpirationTime === expirationTime) {
    // There's already a pending commit at this expiration time.
    return commitRoot.bind(null, root);
  }

  flushPassiveEffects();

  // If the root or expiration time have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.
  if (root !== workInProgressRoot || expirationTime !== renderExpirationTime) {
    prepareFreshStack(root, expirationTime);
    startWorkOnPendingInteraction(root, expirationTime);
  }

  // If we have a work-in-progress fiber, it means there's still work to do
  // in this root.
  if (workInProgress !== null) {
    const prevWorkPhase = workPhase;
    workPhase = RenderPhase;
    let prevDispatcher = ReactCurrentDispatcher.current;
    if (prevDispatcher === null) {
      // The React isomorphic package does not include a default dispatcher.
      // Instead the first renderer will lazily attach one, in order to give
      // nicer error messages.
      prevDispatcher = ContextOnlyDispatcher;
    }
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;
    let prevInteractions: Set<Interaction> | null = null;
    if (enableSchedulerTracing) {
      prevInteractions = __interactionsRef.current;
      __interactionsRef.current = root.memoizedInteractions;
    }

    startWorkLoopTimer(workInProgress);

    // TODO: Fork renderRoot into renderRootSync and renderRootAsync
    if (isSync) {
      if (expirationTime !== Sync) {
        // An async update expired. There may be other expired updates on
        // this root. We should render all the expired work in a
        // single batch.
        const currentTime = requestCurrentTime();
        if (currentTime < expirationTime) {
          // Restart at the current time.
          workPhase = prevWorkPhase;
          resetContextDependencies();
          ReactCurrentDispatcher.current = prevDispatcher;
          if (enableSchedulerTracing) {
            __interactionsRef.current = ((prevInteractions: any): Set<
              Interaction,
            >);
          }
          return renderRoot.bind(null, root, currentTime);
        }
      }
    } else {
      // Since we know we're in a React event, we can clear the current
      // event time. The next update will compute a new event time.
      currentEventTime = NoWork;
    }

    do {
      try {
        if (isSync) {
          workLoopSync();
        } else {
          workLoop();
        }
        break;
      } catch (thrownValue) {
        // Reset module-level state that was set during the render phase.
        resetContextDependencies();
        resetHooks();

        const sourceFiber = workInProgress;
        if (sourceFiber === null || sourceFiber.return === null) {
          // Expected to be working on a non-root fiber. This is a fatal error
          // because there's no ancestor that can handle it; the root is
          // supposed to capture all errors that weren't caught by an error
          // boundary.
          prepareFreshStack(root, expirationTime);
          workPhase = prevWorkPhase;
          throw thrownValue;
        }

        if (enableProfilerTimer && sourceFiber.mode & ProfileMode) {
          // Record the time spent rendering before an error was thrown. This
          // avoids inaccurate Profiler durations in the case of a
          // suspended render.
          stopProfilerTimerIfRunningAndRecordDelta(sourceFiber, true);
        }

        const returnFiber = sourceFiber.return;
        throwException(
          root,
          returnFiber,
          sourceFiber,
          thrownValue,
          renderExpirationTime,
        );
        workInProgress = completeUnitOfWork(sourceFiber);
      }
    } while (true);

    workPhase = prevWorkPhase;
    resetContextDependencies();
    ReactCurrentDispatcher.current = prevDispatcher;
    if (enableSchedulerTracing) {
      __interactionsRef.current = ((prevInteractions: any): Set<Interaction>);
    }

    if (workInProgress !== null) {
      // There's still work left over. Return a continuation.
      stopInterruptedWorkLoopTimer();
      if (expirationTime !== Sync) {
        startRequestCallbackTimer();
      }
      return renderRoot.bind(null, root, expirationTime);
    }
  }

  // We now have a consistent tree. The next step is either to commit it, or, if
  // something suspended, wait to commit it after a timeout.
  stopFinishedWorkLoopTimer();

  root.finishedWork = root.current.alternate;
  root.finishedExpirationTime = expirationTime;

  const isLocked = resolveLocksOnRoot(root, expirationTime);
  if (isLocked) {
    // This root has a lock that prevents it from committing. Exit. If we begin
    // work on the root again, without any intervening updates, it will finish
    // without doing additional work.
    return null;
  }

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;

  switch (workInProgressRootExitStatus) {
    case RootIncomplete: {
      invariant(false, 'Should have a work-in-progress.');
    }
    // Flow knows about invariant, so it compains if I add a break statement,
    // but eslint doesn't know about invariant, so it complains if I do.
    // eslint-disable-next-line no-fallthrough
    case RootErrored: {
      // An error was thrown. First check if there is lower priority work
      // scheduled on this root.
      const lastPendingTime = root.lastPendingTime;
      if (root.lastPendingTime < expirationTime) {
        // There's lower priority work. Before raising the error, try rendering
        // at the lower priority to see if it fixes it. Use a continuation to
        // maintain the existing priority and position in the queue.
        return renderRoot.bind(null, root, lastPendingTime);
      }
      if (!isSync) {
        // If we're rendering asynchronously, it's possible the error was
        // caused by tearing due to a mutation during an event. Try rendering
        // one more time without yiedling to events.
        prepareFreshStack(root, expirationTime);
        scheduleSyncCallback(renderRoot.bind(null, root, expirationTime));
        return null;
      }
      // If we're already rendering synchronously, commit the root in its
      // errored state.
      return commitRoot.bind(null, root);
    }
    case RootSuspended: {
      if (!isSync) {
        const lastPendingTime = root.lastPendingTime;
        if (root.lastPendingTime < expirationTime) {
          // There's lower priority work. It might be unsuspended. Try rendering
          // at that level.
          return renderRoot.bind(null, root, lastPendingTime);
        }
        // If workInProgressRootMostRecentEventTime is Sync, that means we didn't
        // track any event times. That can happen if we retried but nothing switched
        // from fallback to content. There's no reason to delay doing no work.
        if (workInProgressRootMostRecentEventTime !== Sync) {
          let msUntilTimeout = computeMsUntilTimeout(
            workInProgressRootMostRecentEventTime,
            expirationTime,
          );
          // Don't bother with a very short suspense time.
          if (msUntilTimeout > 10) {
            // The render is suspended, it hasn't timed out, and there's no lower
            // priority work to do. Instead of committing the fallback
            // immediately, wait for more data to arrive.
            root.timeoutHandle = scheduleTimeout(
              commitRoot.bind(null, root),
              msUntilTimeout,
            );
            return null;
          }
        }
      }
      // The work expired. Commit immediately.
      return commitRoot.bind(null, root);
    }
    case RootCompleted: {
      // The work completed. Ready to commit.
      return commitRoot.bind(null, root);
    }
    default: {
      invariant(false, 'Unknown root exit status.');
    }
  }
}

export function markRenderEventTime(expirationTime: ExpirationTime): void {
  if (
    expirationTime < workInProgressRootMostRecentEventTime &&
    expirationTime > Never
  ) {
    workInProgressRootMostRecentEventTime = expirationTime;
  }
}

export function renderDidSuspend(): void {
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootSuspended;
  }
}

export function renderDidError() {
  if (
    workInProgressRootExitStatus === RootIncomplete ||
    workInProgressRootExitStatus === RootSuspended
  ) {
    workInProgressRootExitStatus = RootErrored;
  }
}

function inferTimeFromExpirationTime(expirationTime: ExpirationTime): number {
  // We don't know exactly when the update was scheduled, but we can infer an
  // approximate start time from the expiration time.
  const earliestExpirationTimeMs = expirationTimeToMs(expirationTime);
  return earliestExpirationTimeMs - LOW_PRIORITY_EXPIRATION;
}

function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function workLoop() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber): Fiber | null {
  // The current, flushed, state of this fiber is the alternate. Ideally
  // nothing should rely on this, but relying on it here means that we don't
  // need an additional field on the work in progress.
  const current = unitOfWork.alternate;

  startWorkTimer(unitOfWork);
  setCurrentDebugFiberInDEV(unitOfWork);

  let next;
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    next = beginWork(current, unitOfWork, renderExpirationTime);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    next = beginWork(current, unitOfWork, renderExpirationTime);
  }

  resetCurrentDebugFiberInDEV();
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    next = completeUnitOfWork(unitOfWork);
  }

  ReactCurrentOwner.current = null;
  return next;
}

function completeUnitOfWork(unitOfWork: Fiber): Fiber | null {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  workInProgress = unitOfWork;
  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = workInProgress.alternate;
    const returnFiber = workInProgress.return;

    // Check if the work completed or if something threw.
    if ((workInProgress.effectTag & Incomplete) === NoEffect) {
      setCurrentDebugFiberInDEV(workInProgress);
      let next;
      if (
        !enableProfilerTimer ||
        (workInProgress.mode & ProfileMode) === NoMode
      ) {
        next = completeWork(current, workInProgress, renderExpirationTime);
      } else {
        startProfilerTimer(workInProgress);
        next = completeWork(current, workInProgress, renderExpirationTime);
        // Update render duration assuming we didn't error.
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false);
      }
      stopWorkTimer(workInProgress);
      resetCurrentDebugFiberInDEV();
      resetChildExpirationTime(workInProgress);

      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        return next;
      }

      if (
        returnFiber !== null &&
        // Do not append effects to parents if a sibling failed to complete
        (returnFiber.effectTag & Incomplete) === NoEffect
      ) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }

        // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if needed,
        // by doing multiple passes over the effect list. We don't want to
        // schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.
        const effectTag = workInProgress.effectTag;

        // Skip both NoWork and PerformedWork tags when creating the effect
        // list. PerformedWork effect is read by React DevTools but shouldn't be
        // committed.
        if (effectTag > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }
    } else {
      // This fiber did not complete because something threw. Pop values off
      // the stack without entering the complete phase. If this is a boundary,
      // capture values if possible.
      const next = unwindWork(workInProgress, renderExpirationTime);

      // Because this fiber did not complete, don't reset its expiration time.

      if (
        enableProfilerTimer &&
        (workInProgress.mode & ProfileMode) !== NoMode
      ) {
        // Record the render duration for the fiber that errored.
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false);

        // Include the time spent working on failed children before continuing.
        let actualDuration = workInProgress.actualDuration;
        let child = workInProgress.child;
        while (child !== null) {
          actualDuration += child.actualDuration;
          child = child.sibling;
        }
        workInProgress.actualDuration = actualDuration;
      }

      if (next !== null) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        // Since we're restarting, remove anything that is not a host effect
        // from the effect tag.
        // TODO: The name stopFailedWorkTimer is misleading because Suspense
        // also captures and restarts.
        stopFailedWorkTimer(workInProgress);
        next.effectTag &= HostEffectMask;
        return next;
      }
      stopWorkTimer(workInProgress);

      if (returnFiber !== null) {
        // Mark the parent fiber as incomplete and clear its effect list.
        returnFiber.firstEffect = returnFiber.lastEffect = null;
        returnFiber.effectTag |= Incomplete;
      }
    }

    const siblingFiber = workInProgress.sibling;
    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      return siblingFiber;
    }
    // Otherwise, return to the parent
    workInProgress = returnFiber;
  } while (workInProgress !== null);

  // We've reached the root.
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
  return null;
}

function resetChildExpirationTime(completedWork: Fiber) {
  if (
    renderExpirationTime !== Never &&
    completedWork.childExpirationTime === Never
  ) {
    // The children of this component are hidden. Don't bubble their
    // expiration times.
    return;
  }

  let newChildExpirationTime = NoWork;

  // Bubble up the earliest expiration time.
  if (enableProfilerTimer && (completedWork.mode & ProfileMode) !== NoMode) {
    // In profiling mode, resetChildExpirationTime is also used to reset
    // profiler durations.
    let actualDuration = completedWork.actualDuration;
    let treeBaseDuration = completedWork.selfBaseDuration;

    // When a fiber is cloned, its actualDuration is reset to 0. This value will
    // only be updated if work is done on the fiber (i.e. it doesn't bailout).
    // When work is done, it should bubble to the parent's actualDuration. If
    // the fiber has not been cloned though, (meaning no work was done), then
    // this value will reflect the amount of time spent working on a previous
    // render. In that case it should not bubble. We determine whether it was
    // cloned by comparing the child pointer.
    const shouldBubbleActualDurations =
      completedWork.alternate === null ||
      completedWork.child !== completedWork.alternate.child;

    let child = completedWork.child;
    while (child !== null) {
      const childUpdateExpirationTime = child.expirationTime;
      const childChildExpirationTime = child.childExpirationTime;
      if (childUpdateExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = childUpdateExpirationTime;
      }
      if (childChildExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = childChildExpirationTime;
      }
      if (shouldBubbleActualDurations) {
        actualDuration += child.actualDuration;
      }
      treeBaseDuration += child.treeBaseDuration;
      child = child.sibling;
    }
    completedWork.actualDuration = actualDuration;
    completedWork.treeBaseDuration = treeBaseDuration;
  } else {
    let child = completedWork.child;
    while (child !== null) {
      const childUpdateExpirationTime = child.expirationTime;
      const childChildExpirationTime = child.childExpirationTime;
      if (childUpdateExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = childUpdateExpirationTime;
      }
      if (childChildExpirationTime > newChildExpirationTime) {
        newChildExpirationTime = childChildExpirationTime;
      }
      child = child.sibling;
    }
  }

  completedWork.childExpirationTime = newChildExpirationTime;
}

function commitRoot(root) {
  runWithPriority(ImmediatePriority, commitRootImpl.bind(null, root));
  // If there are passive effects, schedule a callback to flush them. This goes
  // outside commitRootImpl so that it inherits the priority of the render.
  if (rootWithPendingPassiveEffects !== null) {
    const priorityLevel = getCurrentPriorityLevel();
    scheduleCallback(priorityLevel, () => {
      flushPassiveEffects();
      return null;
    });
  }
  return null;
}

function commitRootImpl(root) {
  flushPassiveEffects();
  flushRenderPhaseStrictModeWarningsInDEV();
  flushSuspensePriorityWarningInDEV();

  invariant(
    workPhase !== RenderPhase && workPhase !== CommitPhase,
    'Should not already be working.',
  );

  const finishedWork = root.finishedWork;
  const expirationTime = root.finishedExpirationTime;
  if (finishedWork === null) {
    return null;
  }
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  invariant(
    finishedWork !== root.current,
    'Cannot commit the same tree as before. This error is likely caused by ' +
      'a bug in React. Please file an issue.',
  );

  // commitRoot never returns a continuation; it always finishes synchronously.
  // So we can clear these now to allow a new callback to be scheduled.
  root.callbackNode = null;
  root.callbackExpirationTime = NoWork;

  startCommitTimer();

  // Update the first and last pending times on this root. The new first
  // pending time is whatever is left on the root fiber.
  const updateExpirationTimeBeforeCommit = finishedWork.expirationTime;
  const childExpirationTimeBeforeCommit = finishedWork.childExpirationTime;
  const firstPendingTimeBeforeCommit =
    childExpirationTimeBeforeCommit > updateExpirationTimeBeforeCommit
      ? childExpirationTimeBeforeCommit
      : updateExpirationTimeBeforeCommit;
  root.firstPendingTime = firstPendingTimeBeforeCommit;
  if (firstPendingTimeBeforeCommit < root.lastPendingTime) {
    // This usually means we've finished all the work, but it can also happen
    // when something gets downprioritized during render, like a hidden tree.
    root.lastPendingTime = firstPendingTimeBeforeCommit;
  }

  if (root === workInProgressRoot) {
    // We can reset these now that they are finished.
    workInProgressRoot = null;
    workInProgress = null;
    renderExpirationTime = NoWork;
  } else {
    // This indicates that the last root we worked on is not the same one that
    // we're committing now. This most commonly happens when a suspended root
    // times out.
  }

  // Get the list of effects.
  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    // A fiber's effect list consists only of its children, not itself. So if
    // the root has an effect, we need to add it to the end of the list. The
    // resulting list is the set that would belong to the root's parent, if it
    // had one; that is, all the effects in the tree including the root.
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // There is no effect on the root.
    firstEffect = finishedWork.firstEffect;
  }

  if (firstEffect !== null) {
    const prevWorkPhase = workPhase;
    workPhase = CommitPhase;
    let prevInteractions: Set<Interaction> | null = null;
    if (enableSchedulerTracing) {
      prevInteractions = __interactionsRef.current;
      __interactionsRef.current = root.memoizedInteractions;
    }

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    // The commit phase is broken into several sub-phases. We do a separate pass
    // of the effect list for each phase: all mutation effects come before all
    // layout effects, and so on.

    // The first phase a "before mutation" phase. We use this phase to read the
    // state of the host tree right before we mutate it. This is where
    // getSnapshotBeforeUpdate is called.
    startCommitSnapshotEffectsTimer();
    prepareForCommit(root.containerInfo);
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        invokeGuardedCallback(null, commitBeforeMutationEffects, null);
        if (hasCaughtError()) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          const error = clearCaughtError();
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      } else {
        try {
          commitBeforeMutationEffects();
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);
    stopCommitSnapshotEffectsTimer();

    if (enableProfilerTimer) {
      // Mark the current commit time to be shared by all Profilers in this
      // batch. This enables them to be grouped later.
      recordCommitTime();
    }

    // The next phase is the mutation phase, where we mutate the host tree.
    startCommitHostEffectsTimer();
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        invokeGuardedCallback(null, commitMutationEffects, null);
        if (hasCaughtError()) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          const error = clearCaughtError();
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      } else {
        try {
          commitMutationEffects();
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);
    stopCommitHostEffectsTimer();
    resetAfterCommit(root.containerInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the mutation phase, so that the previous tree is still current during
    // componentWillUnmount, but before the layout phase, so that the finished
    // work is current during componentDidMount/Update.
    root.current = finishedWork;

    // The next phase is the layout phase, where we call effects that read
    // the host tree after it's been mutated. The idiomatic use case for this is
    // layout, but class component lifecycles also fire here for legacy reasons.
    startCommitLifeCyclesTimer();
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        invokeGuardedCallback(
          null,
          commitLayoutEffects,
          null,
          root,
          expirationTime,
        );
        if (hasCaughtError()) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          const error = clearCaughtError();
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      } else {
        try {
          commitLayoutEffects(root, expirationTime);
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);
    stopCommitLifeCyclesTimer();

    nextEffect = null;

    if (enableSchedulerTracing) {
      __interactionsRef.current = ((prevInteractions: any): Set<Interaction>);
    }
    workPhase = prevWorkPhase;
  } else {
    // No effects.
    root.current = finishedWork;
    // Measure these anyway so the flamegraph explicitly shows that there were
    // no effects.
    // TODO: Maybe there's a better way to report this.
    startCommitSnapshotEffectsTimer();
    stopCommitSnapshotEffectsTimer();
    if (enableProfilerTimer) {
      recordCommitTime();
    }
    startCommitHostEffectsTimer();
    stopCommitHostEffectsTimer();
    startCommitLifeCyclesTimer();
    stopCommitLifeCyclesTimer();
  }

  stopCommitTimer();

  if (rootDoesHavePassiveEffects) {
    // This commit has passive effects. Stash a reference to them. But don't
    // schedule a callback until after flushing layout work.
    rootDoesHavePassiveEffects = false;
    rootWithPendingPassiveEffects = root;
    pendingPassiveEffectsExpirationTime = expirationTime;
  } else {
    if (enableSchedulerTracing) {
      // If there are no passive effects, then we can complete the pending
      // interactions. Otherwise, we'll wait until after the passive effects
      // are flushed.
      finishPendingInteractions(root, expirationTime);
    }
  }

  // Check if there's remaining work on this root
  const remainingExpirationTime = root.firstPendingTime;
  if (remainingExpirationTime !== NoWork) {
    const currentTime = requestCurrentTime();
    const priorityLevel = inferPriorityFromExpirationTime(
      currentTime,
      remainingExpirationTime,
    );
    scheduleCallbackForRoot(root, priorityLevel, remainingExpirationTime);
  } else {
    // If there's no remaining work, we can clear the set of already failed
    // error boundaries.
    legacyErrorBoundariesThatAlreadyFailed = null;
  }

  onCommitRoot(finishedWork.stateNode);

  if (remainingExpirationTime === Sync) {
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

  if (hasUncaughtError) {
    hasUncaughtError = false;
    const error = firstUncaughtError;
    firstUncaughtError = null;
    throw error;
  }

  if (workPhase === LegacyUnbatchedPhase) {
    // This is a legacy edge case. We just committed the initial mount of
    // a ReactDOM.render-ed root inside of batchedUpdates. The commit fired
    // synchronously, but layout updates should be deferred until the end
    // of the batch.
    return null;
  }

  // If layout work was scheduled, flush it now.
  flushSyncCallbackQueue();
  return null;
}

function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    if ((nextEffect.effectTag & Snapshot) !== NoEffect) {
      setCurrentDebugFiberInDEV(nextEffect);
      recordEffect();

      const current = nextEffect.alternate;
      commitBeforeMutationEffectOnFiber(current, nextEffect);

      resetCurrentDebugFiberInDEV();
    }
    nextEffect = nextEffect.nextEffect;
  }
}

function commitMutationEffects() {
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const effectTag = nextEffect.effectTag;

    if (effectTag & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }

    // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every possible
    // bitmap value, we remove the secondary effects from the effect tag and
    // switch on that value.
    let primaryEffectTag = effectTag & (Placement | Update | Deletion);
    switch (primaryEffectTag) {
      case Placement: {
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.
        nextEffect.effectTag &= ~Placement;
        break;
      }
      case PlacementAndUpdate: {
        // Placement
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        nextEffect.effectTag &= ~Placement;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Deletion: {
        commitDeletion(nextEffect);
        break;
      }
    }

    // TODO: Only record a mutation effect if primaryEffectTag is non-zero.
    recordEffect();

    resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }
}

function commitLayoutEffects(
  root: FiberRoot,
  committedExpirationTime: ExpirationTime,
) {
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const effectTag = nextEffect.effectTag;

    if (effectTag & (Update | Callback)) {
      recordEffect();
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(
        root,
        current,
        nextEffect,
        committedExpirationTime,
      );
    }

    if (effectTag & Ref) {
      recordEffect();
      commitAttachRef(nextEffect);
    }

    if (effectTag & Passive) {
      rootDoesHavePassiveEffects = true;
    }

    resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }
}

export function flushPassiveEffects() {
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }
  const root = rootWithPendingPassiveEffects;
  const expirationTime = pendingPassiveEffectsExpirationTime;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsExpirationTime = NoWork;

  let prevInteractions: Set<Interaction> | null = null;
  if (enableSchedulerTracing) {
    prevInteractions = __interactionsRef.current;
    __interactionsRef.current = root.memoizedInteractions;
  }

  invariant(
    workPhase !== RenderPhase && workPhase !== CommitPhase,
    'Cannot flush passive effects while already rendering.',
  );
  const prevWorkPhase = workPhase;
  workPhase = CommitPhase;

  // Note: This currently assumes there are no passive effects on the root
  // fiber, because the root is not part of its own effect list. This could
  // change in the future.
  let effect = root.current.firstEffect;
  while (effect !== null) {
    if (__DEV__) {
      setCurrentDebugFiberInDEV(effect);
      invokeGuardedCallback(null, commitPassiveHookEffects, null, effect);
      if (hasCaughtError()) {
        invariant(effect !== null, 'Should be working on an effect.');
        const error = clearCaughtError();
        captureCommitPhaseError(effect, error);
      }
      resetCurrentDebugFiberInDEV();
    } else {
      try {
        commitPassiveHookEffects(effect);
      } catch (error) {
        invariant(effect !== null, 'Should be working on an effect.');
        captureCommitPhaseError(effect, error);
      }
    }
    effect = effect.nextEffect;
  }

  if (enableSchedulerTracing) {
    __interactionsRef.current = ((prevInteractions: any): Set<Interaction>);
    finishPendingInteractions(root, expirationTime);
  }

  workPhase = prevWorkPhase;
  flushSyncCallbackQueue();

  // If additional passive effects were scheduled, increment a counter. If this
  // exceeds the limit, we'll fire a warning.
  nestedPassiveUpdateCount =
    rootWithPendingPassiveEffects === null ? 0 : nestedPassiveUpdateCount + 1;

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

function prepareToThrowUncaughtError(error: mixed) {
  if (!hasUncaughtError) {
    hasUncaughtError = true;
    firstUncaughtError = error;
  }
}
export const onUncaughtError = prepareToThrowUncaughtError;

function captureCommitPhaseErrorOnRoot(
  rootFiber: Fiber,
  sourceFiber: Fiber,
  error: mixed,
) {
  const errorInfo = createCapturedValue(error, sourceFiber);
  const update = createRootErrorUpdate(rootFiber, errorInfo, Sync);
  enqueueUpdate(rootFiber, update);
  const root = markUpdateTimeFromFiberToRoot(rootFiber, Sync);
  if (root !== null) {
    scheduleCallbackForRoot(root, ImmediatePriority, Sync);
  }
}

export function captureCommitPhaseError(sourceFiber: Fiber, error: mixed) {
  if (sourceFiber.tag === HostRoot) {
    // Error was thrown at the root. There is no parent, so the root
    // itself should capture it.
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
    return;
  }

  let fiber = sourceFiber.return;
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
        const errorInfo = createCapturedValue(error, sourceFiber);
        const update = createClassErrorUpdate(
          fiber,
          errorInfo,
          // TODO: This is always sync
          Sync,
        );
        enqueueUpdate(fiber, update);
        const root = markUpdateTimeFromFiberToRoot(fiber, Sync);
        if (root !== null) {
          scheduleCallbackForRoot(root, ImmediatePriority, Sync);
        }
        return;
      }
    }
    fiber = fiber.return;
  }
}

export function pingSuspendedRoot(
  root: FiberRoot,
  thenable: Thenable,
  suspendedTime: ExpirationTime,
) {
  const pingCache = root.pingCache;
  if (pingCache !== null) {
    // The thenable resolved, so we no longer need to memoize, because it will
    // never be thrown again.
    pingCache.delete(thenable);
  }

  if (workInProgressRoot === root && renderExpirationTime === suspendedTime) {
    // Received a ping at the same priority level at which we're currently
    // rendering. Restart from the root. Don't need to schedule a ping because
    // we're already working on this tree.
    prepareFreshStack(root, renderExpirationTime);
    return;
  }

  const lastPendingTime = root.lastPendingTime;
  if (lastPendingTime < suspendedTime) {
    // The root is no longer suspended at this time.
    return;
  }

  const pingTime = root.pingTime;
  if (pingTime !== NoWork && pingTime < suspendedTime) {
    // There's already a lower priority ping scheduled.
    return;
  }

  // Mark the time at which this ping was scheduled.
  root.pingTime = suspendedTime;

  if (root.finishedExpirationTime === suspendedTime) {
    // If there's a pending fallback waiting to commit, throw it away.
    root.finishedExpirationTime = NoWork;
    root.finishedWork = null;
  }

  const currentTime = requestCurrentTime();
  const priorityLevel = inferPriorityFromExpirationTime(
    currentTime,
    suspendedTime,
  );
  scheduleCallbackForRoot(root, priorityLevel, suspendedTime);
}

export function retryTimedOutBoundary(boundaryFiber: Fiber) {
  // The boundary fiber (a Suspense component) previously timed out and was
  // rendered in its fallback state. One of the promises that suspended it has
  // resolved, which means at least part of the tree was likely unblocked. Try
  // rendering again, at a new expiration time.
  const currentTime = requestCurrentTime();
  const retryTime = computeExpirationForFiber(currentTime, boundaryFiber);
  // TODO: Special case idle priority?
  const priorityLevel = inferPriorityFromExpirationTime(currentTime, retryTime);
  const root = markUpdateTimeFromFiberToRoot(boundaryFiber, retryTime);
  if (root !== null) {
    scheduleCallbackForRoot(root, priorityLevel, retryTime);
  }
}

export function resolveRetryThenable(boundaryFiber: Fiber, thenable: Thenable) {
  let retryCache: WeakSet<Thenable> | Set<Thenable> | null;
  if (enableSuspenseServerRenderer) {
    switch (boundaryFiber.tag) {
      case SuspenseComponent:
        retryCache = boundaryFiber.stateNode;
        break;
      case DehydratedSuspenseComponent:
        retryCache = boundaryFiber.memoizedState;
        break;
      default:
        invariant(
          false,
          'Pinged unknown suspense boundary type. ' +
            'This is probably a bug in React.',
        );
    }
  } else {
    retryCache = boundaryFiber.stateNode;
  }

  if (retryCache !== null) {
    // The thenable resolved, so we no longer need to memoize, because it will
    // never be thrown again.
    retryCache.delete(thenable);
  }

  retryTimedOutBoundary(boundaryFiber);
}

// Computes the next Just Noticeable Difference (JND) boundary.
// The theory is that a person can't tell the difference between small differences in time.
// Therefore, if we wait a bit longer than necessary that won't translate to a noticeable
// difference in the experience. However, waiting for longer might mean that we can avoid
// showing an intermediate loading state. The longer we have already waited, the harder it
// is to tell small differences in time. Therefore, the longer we've already waited,
// the longer we can wait additionally. At some point we have to give up though.
// We pick a train model where the next boundary commits at a consistent schedule.
// These particular numbers are vague estimates. We expect to adjust them based on research.
function jnd(timeElapsed: number) {
  return timeElapsed < 120
    ? 120
    : timeElapsed < 480
      ? 480
      : timeElapsed < 1080
        ? 1080
        : timeElapsed < 1920
          ? 1920
          : timeElapsed < 3000
            ? 3000
            : timeElapsed < 4320
              ? 4320
              : ceil(timeElapsed / 1960) * 1960;
}

function computeMsUntilTimeout(
  mostRecentEventTime: ExpirationTime,
  committedExpirationTime: ExpirationTime,
) {
  if (disableYielding) {
    // Timeout immediately when yielding is disabled.
    return 0;
  }

  const eventTimeMs: number = inferTimeFromExpirationTime(mostRecentEventTime);
  const currentTimeMs: number = now();
  let timeElapsed = currentTimeMs - eventTimeMs;
  if (timeElapsed < 0) {
    // We get this wrong some time since we estimate the time.
    timeElapsed = 0;
  }

  let msUntilTimeout = jnd(timeElapsed) - timeElapsed;

  // Compute the time until this render pass would expire.
  const timeUntilExpirationMs =
    expirationTimeToMs(committedExpirationTime) - currentTimeMs;

  // Clamp the timeout to the expiration time.
  // TODO: Once the event time is exact instead of inferred from expiration time
  // we don't need this.
  if (timeUntilExpirationMs < msUntilTimeout) {
    msUntilTimeout = timeUntilExpirationMs;
  }

  // This is the value that is passed to `setTimeout`.
  return msUntilTimeout;
}

function checkForNestedUpdates() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;
    invariant(
      false,
      'Maximum update depth exceeded. This can happen when a component ' +
        'repeatedly calls setState inside componentWillUpdate or ' +
        'componentDidUpdate. React limits the number of nested updates to ' +
        'prevent infinite loops.',
    );
  }

  if (__DEV__) {
    if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
      nestedPassiveUpdateCount = 0;
      warning(
        false,
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
    ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
    ReactStrictModeWarnings.flushLegacyContextWarning();

    if (warnAboutDeprecatedLifecycles) {
      ReactStrictModeWarnings.flushPendingDeprecationWarnings();
    }
  }
}

function stopFinishedWorkLoopTimer() {
  const didCompleteRoot = true;
  stopWorkLoopTimer(interruptedBy, didCompleteRoot);
  interruptedBy = null;
}

function stopInterruptedWorkLoopTimer() {
  // TODO: Track which fiber caused the interruption.
  const didCompleteRoot = false;
  stopWorkLoopTimer(interruptedBy, didCompleteRoot);
  interruptedBy = null;
}

function checkForInterruption(
  fiberThatReceivedUpdate: Fiber,
  updateExpirationTime: ExpirationTime,
) {
  if (
    enableUserTimingAPI &&
    workInProgressRoot !== null &&
    updateExpirationTime > renderExpirationTime
  ) {
    interruptedBy = fiberThatReceivedUpdate;
  }
}

let didWarnStateUpdateForUnmountedComponent: Set<string> | null = null;
function warnAboutUpdateOnUnmountedFiberInDEV(fiber) {
  if (__DEV__) {
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
    const componentName = getComponentName(fiber.type) || 'ReactComponent';
    if (didWarnStateUpdateForUnmountedComponent !== null) {
      if (didWarnStateUpdateForUnmountedComponent.has(componentName)) {
        return;
      }
      didWarnStateUpdateForUnmountedComponent.add(componentName);
    } else {
      didWarnStateUpdateForUnmountedComponent = new Set([componentName]);
    }
    warningWithoutStack(
      false,
      "Can't perform a React state update on an unmounted component. This " +
        'is a no-op, but it indicates a memory leak in your application. To ' +
        'fix, cancel all subscriptions and asynchronous tasks in %s.%s',
      tag === ClassComponent
        ? 'the componentWillUnmount method'
        : 'a useEffect cleanup function',
      getStackByFiberInDevAndProd(fiber),
    );
  }
}

let beginWork;
if (__DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
  let dummyFiber = null;
  beginWork = (current, unitOfWork, expirationTime) => {
    // If a component throws an error, we replay it again in a synchronously
    // dispatched event, so that the debugger will treat it as an uncaught
    // error See ReactErrorUtils for more information.

    // Before entering the begin phase, copy the work-in-progress onto a dummy
    // fiber. If beginWork throws, we'll use this to reset the state.
    const originalWorkInProgressCopy = assignFiberPropertiesInDEV(
      dummyFiber,
      unitOfWork,
    );
    try {
      return originalBeginWork(current, unitOfWork, expirationTime);
    } catch (originalError) {
      if (
        originalError !== null &&
        typeof originalError === 'object' &&
        typeof originalError.then === 'function'
      ) {
        // Don't replay promises. Treat everything else like an error.
        throw originalError;
      }

      // Keep this code in sync with renderRoot; any changes here must have
      // corresponding changes there.
      resetContextDependencies();
      resetHooks();

      // Unwind the failed stack frame
      unwindInterruptedWork(unitOfWork);

      // Restore the original properties of the fiber.
      assignFiberPropertiesInDEV(unitOfWork, originalWorkInProgressCopy);

      if (enableProfilerTimer && unitOfWork.mode & ProfileMode) {
        // Reset the profiler timer.
        startProfilerTimer(unitOfWork);
      }

      // Run beginWork again.
      invokeGuardedCallback(
        null,
        originalBeginWork,
        null,
        current,
        unitOfWork,
        expirationTime,
      );

      if (hasCaughtError()) {
        const replayError = clearCaughtError();
        // `invokeGuardedCallback` sometimes sets an expando `_suppressLogging`.
        // Rethrow this error instead of the original one.
        throw replayError;
      } else {
        // This branch is reachable if the render phase is impure.
        throw originalError;
      }
    }
  };
} else {
  beginWork = originalBeginWork;
}

let didWarnAboutUpdateInRender = false;
let didWarnAboutUpdateInGetChildContext = false;
function warnAboutInvalidUpdatesOnClassComponentsInDEV(fiber) {
  if (__DEV__) {
    if (fiber.tag === ClassComponent) {
      switch (ReactCurrentDebugFiberPhaseInDEV) {
        case 'getChildContext':
          if (didWarnAboutUpdateInGetChildContext) {
            return;
          }
          warningWithoutStack(
            false,
            'setState(...): Cannot call setState() inside getChildContext()',
          );
          didWarnAboutUpdateInGetChildContext = true;
          break;
        case 'render':
          if (didWarnAboutUpdateInRender) {
            return;
          }
          warningWithoutStack(
            false,
            'Cannot update during an existing state transition (such as ' +
              'within `render`). Render methods should be a pure function of ' +
              'props and state.',
          );
          didWarnAboutUpdateInRender = true;
          break;
      }
    }
  }
}

function warnIfNotCurrentlyActingUpdatesInDEV(fiber: Fiber): void {
  if (__DEV__) {
    if (
      workPhase === NotWorking &&
      ReactShouldWarnActingUpdates.current === false
    ) {
      warningWithoutStack(
        false,
        'An update to %s inside a test was not wrapped in act(...).\n\n' +
          'When testing, code that causes React state updates should be ' +
          'wrapped into act(...):\n\n' +
          'act(() => {\n' +
          '  /* fire events that update state */\n' +
          '});\n' +
          '/* assert on the output */\n\n' +
          "This ensures that you're testing the behavior the user would see " +
          'in the browser.' +
          ' Learn more at https://fb.me/react-wrap-tests-with-act' +
          '%s',
        getComponentName(fiber.type),
        getStackByFiberInDevAndProd(fiber),
      );
    }
  }
}

export const warnIfNotCurrentlyActingUpdatesInDev = warnIfNotCurrentlyActingUpdatesInDEV;

let componentsWithSuspendedDiscreteUpdates = null;
export function checkForWrongSuspensePriorityInDEV(sourceFiber: Fiber) {
  if (__DEV__) {
    if (
      (sourceFiber.mode & ConcurrentMode) !== NoEffect &&
      // Check if we're currently rendering a discrete update. Ideally, all we
      // would need to do is check the current priority level. But we currently
      // have no rigorous way to distinguish work that was scheduled at user-
      // blocking priority from work that expired a bit and was "upgraded" to
      // a higher priority. That's because we don't schedule separate callbacks
      // for every level, only the highest priority level per root. The priority
      // of subsequent levels is inferred from the expiration time, but this is
      // an imprecise heuristic.
      //
      // However, we do store the last discrete pending update per root. So we
      // can reliably compare to that one. (If we broaden this warning to include
      // high pri updates that aren't discrete, then this won't be sufficient.)
      //
      // My rationale is that it's better for this warning to have false
      // negatives than false positives.
      rootsWithPendingDiscreteUpdates !== null &&
      workInProgressRoot !== null &&
      renderExpirationTime ===
        rootsWithPendingDiscreteUpdates.get(workInProgressRoot)
    ) {
      // Add the component name to a set.
      const componentName = getComponentName(sourceFiber.type);
      if (componentsWithSuspendedDiscreteUpdates === null) {
        componentsWithSuspendedDiscreteUpdates = new Set([componentName]);
      } else {
        componentsWithSuspendedDiscreteUpdates.add(componentName);
      }
    }
  }
}

function flushSuspensePriorityWarningInDEV() {
  if (__DEV__) {
    if (componentsWithSuspendedDiscreteUpdates !== null) {
      const componentNames = [];
      componentsWithSuspendedDiscreteUpdates.forEach(name => {
        componentNames.push(name);
      });
      componentsWithSuspendedDiscreteUpdates = null;

      // TODO: A more helpful version of this message could include the names of
      // the component that were updated, not the ones that suspended. To do
      // that we'd need to track all the components that updated during this
      // render, perhaps using the same mechanism as `markRenderEventTime`.
      warningWithoutStack(
        false,
        'The following components suspended during a user-blocking update: %s' +
          '\n\n' +
          'Updates triggered by user interactions (e.g. click events) are ' +
          'considered user-blocking by default. They should not suspend. ' +
          'Updates that can afford to take a bit longer should be wrapped ' +
          'with `Scheduler.next` (or an equivalent abstraction). This ' +
          'typically includes any update that shows new content, like ' +
          'a navigation.' +
          '\n\n' +
          'Generally, you should split user interactions into at least two ' +
          'seprate updates: a user-blocking update to provide immediate ' +
          'feedback, and another update to perform the actual change.',
        // TODO: Add link to React docs with more information, once it exists
        componentNames.sort().join(', '),
      );
    }
  }
}

function computeThreadID(root, expirationTime) {
  // Interaction threads are unique per root and expiration time.
  return expirationTime * 1000 + root.interactionThreadID;
}

function schedulePendingInteraction(root, expirationTime) {
  // This is called when work is scheduled on a root. It sets up a pending
  // interaction, which is completed once the work commits.
  if (!enableSchedulerTracing) {
    return;
  }

  const interactions = __interactionsRef.current;
  if (interactions.size > 0) {
    const pendingInteractionMap = root.pendingInteractionMap;
    const pendingInteractions = pendingInteractionMap.get(expirationTime);
    if (pendingInteractions != null) {
      interactions.forEach(interaction => {
        if (!pendingInteractions.has(interaction)) {
          // Update the pending async work count for previously unscheduled interaction.
          interaction.__count++;
        }

        pendingInteractions.add(interaction);
      });
    } else {
      pendingInteractionMap.set(expirationTime, new Set(interactions));

      // Update the pending async work count for the current interactions.
      interactions.forEach(interaction => {
        interaction.__count++;
      });
    }

    const subscriber = __subscriberRef.current;
    if (subscriber !== null) {
      const threadID = computeThreadID(root, expirationTime);
      subscriber.onWorkScheduled(interactions, threadID);
    }
  }
}

function startWorkOnPendingInteraction(root, expirationTime) {
  // This is called when new work is started on a root.
  if (!enableSchedulerTracing) {
    return;
  }

  // Determine which interactions this batch of work currently includes, So that
  // we can accurately attribute time spent working on it, And so that cascading
  // work triggered during the render phase will be associated with it.
  const interactions: Set<Interaction> = new Set();
  root.pendingInteractionMap.forEach(
    (scheduledInteractions, scheduledExpirationTime) => {
      if (scheduledExpirationTime >= expirationTime) {
        scheduledInteractions.forEach(interaction =>
          interactions.add(interaction),
        );
      }
    },
  );

  // Store the current set of interactions on the FiberRoot for a few reasons:
  // We can re-use it in hot functions like renderRoot() without having to
  // recalculate it. We will also use it in commitWork() to pass to any Profiler
  // onRender() hooks. This also provides DevTools with a way to access it when
  // the onCommitRoot() hook is called.
  root.memoizedInteractions = interactions;

  if (interactions.size > 0) {
    const subscriber = __subscriberRef.current;
    if (subscriber !== null) {
      const threadID = computeThreadID(root, expirationTime);
      try {
        subscriber.onWorkStarted(interactions, threadID);
      } catch (error) {
        // If the subscriber throws, rethrow it in a separate task
        scheduleCallback(ImmediatePriority, () => {
          throw error;
        });
      }
    }
  }
}

function finishPendingInteractions(root, committedExpirationTime) {
  if (!enableSchedulerTracing) {
    return;
  }

  const earliestRemainingTimeAfterCommit = root.firstPendingTime;

  let subscriber;

  try {
    subscriber = __subscriberRef.current;
    if (subscriber !== null && root.memoizedInteractions.size > 0) {
      const threadID = computeThreadID(root, committedExpirationTime);
      subscriber.onWorkStopped(root.memoizedInteractions, threadID);
    }
  } catch (error) {
    // If the subscriber throws, rethrow it in a separate task
    scheduleCallback(ImmediatePriority, () => {
      throw error;
    });
  } finally {
    // Clear completed interactions from the pending Map.
    // Unless the render was suspended or cascading work was scheduled,
    // In which case– leave pending interactions until the subsequent render.
    const pendingInteractionMap = root.pendingInteractionMap;
    pendingInteractionMap.forEach(
      (scheduledInteractions, scheduledExpirationTime) => {
        // Only decrement the pending interaction count if we're done.
        // If there's still work at the current priority,
        // That indicates that we are waiting for suspense data.
        if (scheduledExpirationTime > earliestRemainingTimeAfterCommit) {
          pendingInteractionMap.delete(scheduledExpirationTime);

          scheduledInteractions.forEach(interaction => {
            interaction.__count--;

            if (subscriber !== null && interaction.__count === 0) {
              try {
                subscriber.onInteractionScheduledWorkCompleted(interaction);
              } catch (error) {
                // If the subscriber throws, rethrow it in a separate task
                scheduleCallback(ImmediatePriority, () => {
                  throw error;
                });
              }
            }
          });
        }
      },
    );
  }
}
