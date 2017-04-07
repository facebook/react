/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberScheduler
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';
import type {HostConfig, Deadline} from 'ReactFiberReconciler';
import type {PriorityLevel} from 'ReactPriorityLevel';

export type CapturedError = {
  componentName: ?string,
  componentStack: string,
  error: Error,
  errorBoundary: ?Object,
  errorBoundaryFound: boolean,
  errorBoundaryName: string | null,
  willRetry: boolean,
};

export type HandleErrorInfo = {
  componentStack: string,
};

var {
  popContextProvider,
} = require('ReactFiberContext');
const {reset} = require('ReactFiberStack');
var {
  getStackAddendumByWorkInProgressFiber,
} = require('ReactFiberComponentTreeHook');
var {logCapturedError} = require('ReactFiberErrorLogger');
var {invokeGuardedCallback} = require('ReactErrorUtils');

var ReactFiberBeginWork = require('ReactFiberBeginWork');
var ReactFiberCompleteWork = require('ReactFiberCompleteWork');
var ReactFiberCommitWork = require('ReactFiberCommitWork');
var ReactFiberHostContext = require('ReactFiberHostContext');
var ReactFeatureFlags = require('ReactFeatureFlags');
var {ReactCurrentOwner} = require('ReactGlobalSharedState');
var getComponentName = require('getComponentName');

var {cloneFiber} = require('ReactFiber');
var {onCommitRoot} = require('ReactFiberDevToolsHook');

var {
  NoWork,
  SynchronousPriority,
  TaskPriority,
  AnimationPriority,
  HighPriority,
  LowPriority,
  OffscreenPriority,
} = require('ReactPriorityLevel');

var {
  NoEffect,
  Placement,
  Update,
  PlacementAndUpdate,
  Deletion,
  ContentReset,
  Callback,
  Err,
  Ref,
} = require('ReactTypeOfSideEffect');

var {
  HostRoot,
  HostComponent,
  HostPortal,
  ClassComponent,
} = require('ReactTypeOfWork');

var {
  getPendingPriority,
} = require('ReactFiberUpdateQueue');

var {
  resetContext,
} = require('ReactFiberContext');

var invariant = require('fbjs/lib/invariant');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var {
    recordEffect,
    recordScheduleUpdate,
    startWorkTimer,
    stopWorkTimer,
    startWorkLoopTimer,
    stopWorkLoopTimer,
    startCommitTimer,
    stopCommitTimer,
    startCommitHostEffectsTimer,
    stopCommitHostEffectsTimer,
    startCommitLifeCyclesTimer,
    stopCommitLifeCyclesTimer,
  } = require('ReactDebugFiberPerf');

  var warnAboutUpdateOnUnmounted = function(instance: ReactClass<any>) {
    const ctor = instance.constructor;
    warning(
      false,
      'Can only update a mounted or mounting component. This usually means ' +
        'you called setState, replaceState, or forceUpdate on an unmounted ' +
        'component. This is a no-op.\n\nPlease check the code for the ' +
        '%s component.',
      (ctor && (ctor.displayName || ctor.name)) || 'ReactClass',
    );
  };

  var warnAboutInvalidUpdates = function(instance: ReactClass<any>) {
    switch (ReactDebugCurrentFiber.phase) {
      case 'getChildContext':
        warning(
          false,
          'setState(...): Cannot call setState() inside getChildContext()',
        );
        break;
      case 'render':
        warning(
          false,
          'Cannot update during an existing state transition (such as within ' +
            "`render` or another component's constructor). Render methods should " +
            'be a pure function of props and state; constructor side-effects are ' +
            'an anti-pattern, but can be moved to `componentWillMount`.',
        );
        break;
    }
  };
}

var timeHeuristicForUnitOfWork = 1;

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
) {
  const hostContext = ReactFiberHostContext(config);
  const {popHostContainer, popHostContext, resetHostContainer} = hostContext;
  const {beginWork, beginFailedWork} = ReactFiberBeginWork(
    config,
    hostContext,
    scheduleUpdate,
    getPriorityContext,
  );
  const {completeWork} = ReactFiberCompleteWork(config, hostContext);
  const {
    commitPlacement,
    commitDeletion,
    commitWork,
    commitLifeCycles,
    commitAttachRef,
    commitDetachRef,
  } = ReactFiberCommitWork(config, captureError);
  const {
    scheduleAnimationCallback: hostScheduleAnimationCallback,
    scheduleDeferredCallback: hostScheduleDeferredCallback,
    useSyncScheduling,
    prepareForCommit,
    resetAfterCommit,
  } = config;

  // The priority level to use when scheduling an update.
  // TODO: Should we change this to an array? Might be less confusing.
  let priorityContext: PriorityLevel = useSyncScheduling
    ? SynchronousPriority
    : LowPriority;

  // Keep track of this so we can reset the priority context if an error
  // is thrown during reconciliation.
  let priorityContextBeforeReconciliation: PriorityLevel = NoWork;

  // Keeps track of whether we're currently in a work loop.
  let isPerformingWork: boolean = false;

  // Keeps track of whether the current deadline has expired.
  let deadlineHasExpired: boolean = false;

  // Keeps track of whether we should should batch sync updates.
  let isBatchingUpdates: boolean = false;

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork: Fiber | null = null;
  let nextPriorityLevel: PriorityLevel = NoWork;

  // The next fiber with an effect that we're currently committing.
  let nextEffect: Fiber | null = null;

  let pendingCommit: Fiber | null = null;

  // Linked list of roots with scheduled work on them.
  let nextScheduledRoot: FiberRoot | null = null;
  let lastScheduledRoot: FiberRoot | null = null;

  // Keep track of which host environment callbacks are scheduled.
  let isAnimationCallbackScheduled: boolean = false;
  let isDeferredCallbackScheduled: boolean = false;

  // Keep track of which fibers have captured an error that need to be handled.
  // Work is removed from this collection after unstable_handleError is called.
  let capturedErrors: Map<Fiber, CapturedError> | null = null;
  // Keep track of which fibers have failed during the current batch of work.
  // This is a different set than capturedErrors, because it is not reset until
  // the end of the batch. This is needed to propagate errors correctly if a
  // subtree fails more than once.
  let failedBoundaries: Set<Fiber> | null = null;
  // Error boundaries that captured an error during the current commit.
  let commitPhaseBoundaries: Set<Fiber> | null = null;
  let firstUncaughtError: Error | null = null;
  let fatalError: Error | null = null;

  let isCommitting: boolean = false;
  let isUnmounting: boolean = false;

  function scheduleAnimationCallback(callback) {
    if (!isAnimationCallbackScheduled) {
      isAnimationCallbackScheduled = true;
      hostScheduleAnimationCallback(callback);
    }
  }

  function scheduleDeferredCallback(callback) {
    if (!isDeferredCallbackScheduled) {
      isDeferredCallbackScheduled = true;
      hostScheduleDeferredCallback(callback);
    }
  }

  function resetContextStack() {
    // Reset the stack
    reset();
    // Reset the cursors
    resetContext();
    resetHostContainer();
  }

  // findNextUnitOfWork mutates the current priority context. It is reset after
  // after the workLoop exits, so never call findNextUnitOfWork from outside
  // the work loop.
  function findNextUnitOfWork() {
    // Clear out roots with no more work on them, or if they have uncaught errors
    while (
      nextScheduledRoot !== null &&
      nextScheduledRoot.current.pendingWorkPriority === NoWork
    ) {
      // Unschedule this root.
      nextScheduledRoot.isScheduled = false;
      // Read the next pointer now.
      // We need to clear it in case this root gets scheduled again later.
      const next = nextScheduledRoot.nextScheduledRoot;
      nextScheduledRoot.nextScheduledRoot = null;
      // Exit if we cleared all the roots and there's no work to do.
      if (nextScheduledRoot === lastScheduledRoot) {
        nextScheduledRoot = null;
        lastScheduledRoot = null;
        nextPriorityLevel = NoWork;
        return null;
      }
      // Continue with the next root.
      // If there's no work on it, it will get unscheduled too.
      nextScheduledRoot = next;
    }

    let root = nextScheduledRoot;
    let highestPriorityRoot = null;
    let highestPriorityLevel = NoWork;
    while (root !== null) {
      if (
        root.current.pendingWorkPriority !== NoWork &&
        (highestPriorityLevel === NoWork ||
          highestPriorityLevel > root.current.pendingWorkPriority)
      ) {
        highestPriorityLevel = root.current.pendingWorkPriority;
        highestPriorityRoot = root;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
    }
    if (highestPriorityRoot !== null) {
      nextPriorityLevel = highestPriorityLevel;
      priorityContext = nextPriorityLevel;

      // Before we start any new work, let's make sure that we have a fresh
      // stack to work from.
      // TODO: This call is buried a bit too deep. It would be nice to have
      // a single point which happens right before any new work and
      // unfortunately this is it.
      resetContextStack();

      return cloneFiber(highestPriorityRoot.current, highestPriorityLevel);
    }

    nextPriorityLevel = NoWork;
    return null;
  }

  function commitAllHostEffects() {
    while (nextEffect !== null) {
      if (__DEV__) {
        ReactDebugCurrentFiber.current = nextEffect;
        recordEffect();
      }

      const effectTag = nextEffect.effectTag;
      if (effectTag & ContentReset) {
        config.resetTextContent(nextEffect.stateNode);
      }

      if (effectTag & Ref) {
        const current = nextEffect.alternate;
        if (current !== null) {
          commitDetachRef(current);
        }
      }

      // The following switch statement is only concerned about placement,
      // updates, and deletions. To avoid needing to add a case for every
      // possible bitmap value, we remove the secondary effects from the
      // effect tag and switch on that value.
      let primaryEffectTag = effectTag & ~(Callback | Err | ContentReset | Ref);
      switch (primaryEffectTag) {
        case Placement: {
          commitPlacement(nextEffect);
          // Clear the "placement" from effect tag so that we know that this is inserted, before
          // any life-cycles like componentDidMount gets called.
          // TODO: findDOMNode doesn't rely on this any more but isMounted
          // does and isMounted is deprecated anyway so we should be able
          // to kill this.
          nextEffect.effectTag &= ~Placement;
          break;
        }
        case PlacementAndUpdate: {
          // Placement
          commitPlacement(nextEffect);
          // Clear the "placement" from effect tag so that we know that this is inserted, before
          // any life-cycles like componentDidMount gets called.
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
          isUnmounting = true;
          commitDeletion(nextEffect);
          isUnmounting = false;
          break;
        }
      }
      nextEffect = nextEffect.nextEffect;
    }

    if (__DEV__) {
      ReactDebugCurrentFiber.current = null;
    }
  }

  function commitAllLifeCycles() {
    while (nextEffect !== null) {
      const effectTag = nextEffect.effectTag;

      // Use Task priority for lifecycle updates
      if (effectTag & (Update | Callback)) {
        if (__DEV__) {
          recordEffect();
        }
        const current = nextEffect.alternate;
        commitLifeCycles(current, nextEffect);
      }

      if (effectTag & Ref) {
        if (__DEV__) {
          recordEffect();
        }
        commitAttachRef(nextEffect);
      }

      if (effectTag & Err) {
        if (__DEV__) {
          recordEffect();
        }
        commitErrorHandling(nextEffect);
      }

      const next = nextEffect.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      nextEffect.nextEffect = null;
      // Ensure that we reset the effectTag here so that we can rely on effect
      // tags to reason about the current life-cycle.
      nextEffect = next;
    }
  }

  function commitAllWork(finishedWork: Fiber) {
    // We keep track of this so that captureError can collect any boundaries
    // that capture an error during the commit phase. The reason these aren't
    // local to this function is because errors that occur during cWU are
    // captured elsewhere, to prevent the unmount from being interrupted.
    isCommitting = true;
    if (__DEV__) {
      startCommitTimer();
    }

    pendingCommit = null;
    const root: FiberRoot = (finishedWork.stateNode: any);
    invariant(
      root.current !== finishedWork,
      'Cannot commit the same tree as before. This is probably a bug ' +
        'related to the return field. This error is likely caused by a bug ' +
        'in React. Please file an issue.',
    );

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    // Updates that occur during the commit phase should have Task priority
    const previousPriorityContext = priorityContext;
    priorityContext = TaskPriority;

    let firstEffect;
    if (finishedWork.effectTag !== NoEffect) {
      // A fiber's effect list consists only of its children, not itself. So if
      // the root has an effect, we need to add it to the end of the list. The
      // resulting list is the set that would belong to the root's parent, if
      // it had one; that is, all the effects in the tree including the root.
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

    const commitInfo = prepareForCommit();

    // Commit all the side-effects within a tree. We'll do this in two passes.
    // The first pass performs all the host insertions, updates, deletions and
    // ref unmounts.
    nextEffect = firstEffect;
    if (__DEV__) {
      startCommitHostEffectsTimer();
    }
    while (nextEffect !== null) {
      let error = null;
      if (__DEV__) {
        error = invokeGuardedCallback(
          null,
          commitAllHostEffects,
          null,
          finishedWork,
        );
      } else {
        try {
          commitAllHostEffects(finishedWork);
        } catch (e) {
          error = e;
        }
      }
      if (error !== null) {
        invariant(
          nextEffect !== null,
          'Should have next effect. This error is likely caused by a bug ' +
            'in React. Please file an issue.',
        );
        captureError(nextEffect, error);
        // Clean-up
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }
    if (__DEV__) {
      stopCommitHostEffectsTimer();
    }

    resetAfterCommit(commitInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the first pass of the commit phase, so that the previous tree is still
    // current during componentWillUnmount, but before the second pass, so that
    // the finished work is current during componentDidMount/Update.
    root.current = finishedWork;

    // In the second pass we'll perform all life-cycles and ref callbacks.
    // Life-cycles happen as a separate pass so that all placements, updates,
    // and deletions in the entire tree have already been invoked.
    // This pass also triggers any renderer-specific initial effects.
    nextEffect = firstEffect;
    if (__DEV__) {
      startCommitLifeCyclesTimer();
    }
    while (nextEffect !== null) {
      let error = null;
      if (__DEV__) {
        error = invokeGuardedCallback(
          null,
          commitAllLifeCycles,
          null,
          finishedWork,
        );
      } else {
        try {
          commitAllLifeCycles(finishedWork);
        } catch (e) {
          error = e;
        }
      }
      if (error !== null) {
        invariant(
          nextEffect !== null,
          'Should have next effect. This error is likely caused by a bug ' +
            'in React. Please file an issue.',
        );
        captureError(nextEffect, error);
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }

    isCommitting = false;
    if (__DEV__) {
      stopCommitLifeCyclesTimer();
      stopCommitTimer();
    }
    if (typeof onCommitRoot === 'function') {
      onCommitRoot(finishedWork.stateNode);
    }
    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onCommitWork(finishedWork);
    }

    // If we caught any errors during this commit, schedule their boundaries
    // to update.
    if (commitPhaseBoundaries) {
      commitPhaseBoundaries.forEach(scheduleErrorRecovery);
      commitPhaseBoundaries = null;
    }

    priorityContext = previousPriorityContext;
  }

  function resetWorkPriority(workInProgress: Fiber) {
    let newPriority = NoWork;

    // Check for pending update priority. This is usually null so it shouldn't
    // be a perf issue.
    const queue = workInProgress.updateQueue;
    const tag = workInProgress.tag;
    if (
      queue !== null &&
      // TODO: Revisit once updateQueue is typed properly to distinguish between
      // update payloads for host components and update queues for composites
      (tag === ClassComponent || tag === HostRoot)
    ) {
      newPriority = getPendingPriority(queue);
    }

    // TODO: Coroutines need to visit stateNode

    // progressedChild is going to be the child set with the highest priority.
    // Either it is the same as child, or it just bailed out because it choose
    // not to do the work.
    let child = workInProgress.progressedChild;
    while (child !== null) {
      // Ensure that remaining work priority bubbles up.
      if (
        child.pendingWorkPriority !== NoWork &&
        (newPriority === NoWork || newPriority > child.pendingWorkPriority)
      ) {
        newPriority = child.pendingWorkPriority;
      }
      child = child.sibling;
    }
    workInProgress.pendingWorkPriority = newPriority;
  }

  function completeUnitOfWork(workInProgress: Fiber): Fiber | null {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      const current = workInProgress.alternate;
      const next = completeWork(current, workInProgress);

      const returnFiber = workInProgress.return;
      const siblingFiber = workInProgress.sibling;

      resetWorkPriority(workInProgress);

      if (next !== null) {
        if (__DEV__) {
          stopWorkTimer(workInProgress);
        }
        if (__DEV__ && ReactFiberInstrumentation.debugTool) {
          ReactFiberInstrumentation.debugTool.onCompleteWork(workInProgress);
        }
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        return next;
      }

      if (returnFiber !== null) {
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
        // side-effects. We can perform certain side-effects earlier if
        // needed, by doing multiple passes over the effect list. We don't want
        // to schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.
        if (workInProgress.effectTag !== NoEffect) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }

      if (__DEV__) {
        stopWorkTimer(workInProgress);
      }
      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onCompleteWork(workInProgress);
      }

      if (siblingFiber !== null) {
        // If there is more work to do in this returnFiber, do that next.
        return siblingFiber;
      } else if (returnFiber !== null) {
        // If there's no more work in this returnFiber. Complete the returnFiber.
        workInProgress = returnFiber;
        continue;
      } else {
        // We've reached the root. Unless we're current performing deferred
        // work, we should commit the completed work immediately. If we are
        // performing deferred work, returning null indicates to the caller
        // that we just completed the root so they can handle that case correctly.
        if (nextPriorityLevel < HighPriority) {
          // Otherwise, we should commit immediately.
          commitAllWork(workInProgress);
        } else {
          pendingCommit = workInProgress;
        }
        return null;
      }
    }

    // Without this explicit null return Flow complains of invalid return type
    // TODO Remove the above while(true) loop
    // eslint-disable-next-line no-unreachable
    return null;
  }

  function performUnitOfWork(workInProgress: Fiber): Fiber | null {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    const current = workInProgress.alternate;

    // See if beginning this work spawns more work.
    if (__DEV__) {
      startWorkTimer(workInProgress);
    }
    let next = beginWork(current, workInProgress, nextPriorityLevel);
    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;
    if (__DEV__) {
      ReactDebugCurrentFiber.current = null;
    }

    return next;
  }

  function performFailedUnitOfWork(workInProgress: Fiber): Fiber | null {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    const current = workInProgress.alternate;

    // See if beginning this work spawns more work.
    if (__DEV__) {
      startWorkTimer(workInProgress);
    }
    let next = beginFailedWork(current, workInProgress, nextPriorityLevel);
    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;
    if (__DEV__) {
      ReactDebugCurrentFiber.current = null;
    }

    return next;
  }

  function performDeferredWork(deadline) {
    // We pass the lowest deferred priority here because it acts as a minimum.
    // Higher priorities will also be performed.
    isDeferredCallbackScheduled = false;
    performWork(OffscreenPriority, deadline);
  }

  function performAnimationWork() {
    isAnimationCallbackScheduled = false;
    performWork(AnimationPriority, null);
  }

  function clearErrors() {
    if (nextUnitOfWork === null) {
      nextUnitOfWork = findNextUnitOfWork();
    }
    // Keep performing work until there are no more errors
    while (
      capturedErrors !== null &&
      capturedErrors.size &&
      nextUnitOfWork !== null &&
      nextPriorityLevel !== NoWork &&
      nextPriorityLevel <= TaskPriority
    ) {
      if (hasCapturedError(nextUnitOfWork)) {
        // Use a forked version of performUnitOfWork
        nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
      } else {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }
      if (nextUnitOfWork === null) {
        // If performUnitOfWork returns null, that means we just committed
        // a root. Normally we'd need to clear any errors that were scheduled
        // during the commit phase. But we're already clearing errors, so
        // we can continue.
        nextUnitOfWork = findNextUnitOfWork();
      }
    }
  }

  function workLoop(priorityLevel, deadline: Deadline | null) {
    // Clear any errors.
    clearErrors();

    if (nextUnitOfWork === null) {
      nextUnitOfWork = findNextUnitOfWork();
    }

    let hostRootTimeMarker;
    if (
      ReactFeatureFlags.logTopLevelRenders &&
      nextUnitOfWork !== null &&
      nextUnitOfWork.tag === HostRoot &&
      nextUnitOfWork.child !== null
    ) {
      const componentName = getComponentName(nextUnitOfWork.child) || '';
      hostRootTimeMarker = 'React update: ' + componentName;
      console.time(hostRootTimeMarker);
    }

    // If there's a deadline, and we're not performing Task work, perform work
    // using this loop that checks the deadline on every iteration.
    if (deadline !== null && priorityLevel > TaskPriority) {
      // The deferred work loop will run until there's no time left in
      // the current frame.
      while (nextUnitOfWork !== null && !deadlineHasExpired) {
        if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
          // In a deferred work batch, iff nextUnitOfWork returns null, we just
          // completed a root and a pendingCommit exists. Logically, we could
          // omit either of the checks in the following condition, but we need
          // both to satisfy Flow.
          if (nextUnitOfWork === null && pendingCommit !== null) {
            // If we have time, we should commit the work now.
            if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
              commitAllWork(pendingCommit);
              nextUnitOfWork = findNextUnitOfWork();
              // Clear any errors that were scheduled during the commit phase.
              clearErrors();
            } else {
              deadlineHasExpired = true;
            }
            // Otherwise the root will committed in the next frame.
          }
        } else {
          deadlineHasExpired = true;
        }
      }
    } else {
      // If there's no deadline, or if we're performing Task work, use this loop
      // that doesn't check how much time is remaining. It will keep running
      // until we run out of work at this priority level.
      while (
        nextUnitOfWork !== null &&
        nextPriorityLevel !== NoWork &&
        nextPriorityLevel <= priorityLevel
      ) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        if (nextUnitOfWork === null) {
          nextUnitOfWork = findNextUnitOfWork();
          // performUnitOfWork returned null, which means we just committed a
          // root. Clear any errors that were scheduled during the commit phase.
          clearErrors();
        }
      }
    }

    if (hostRootTimeMarker) {
      console.timeEnd(hostRootTimeMarker);
    }
  }

  function performWork(
    priorityLevel: PriorityLevel,
    deadline: Deadline | null,
  ) {
    if (__DEV__) {
      startWorkLoopTimer();
    }

    invariant(
      !isPerformingWork,
      'performWork was called recursively. This error is likely caused ' +
        'by a bug in React. Please file an issue.',
    );
    isPerformingWork = true;
    const isPerformingDeferredWork = !!deadline;

    // This outer loop exists so that we can restart the work loop after
    // catching an error. It also lets us flush Task work at the end of a
    // deferred batch.
    while (priorityLevel !== NoWork && !fatalError) {
      invariant(
        deadline !== null || priorityLevel < HighPriority,
        'Cannot perform deferred work without a deadline. This error is ' +
          'likely caused by a bug in React. Please file an issue.',
      );

      // Before starting any work, check to see if there are any pending
      // commits from the previous frame.
      if (pendingCommit !== null && !deadlineHasExpired) {
        commitAllWork(pendingCommit);
      }

      // Nothing in performWork should be allowed to throw. All unsafe
      // operations must happen within workLoop, which is extracted to a
      // separate function so that it can be optimized by the JS engine.
      priorityContextBeforeReconciliation = priorityContext;
      let error = null;
      if (__DEV__) {
        error = invokeGuardedCallback(
          null,
          workLoop,
          null,
          priorityLevel,
          deadline,
        );
      } else {
        try {
          workLoop(priorityLevel, deadline);
        } catch (e) {
          error = e;
        }
      }
      // Reset the priority context to its value before reconcilation.
      priorityContext = priorityContextBeforeReconciliation;

      if (error !== null) {
        // We caught an error during either the begin or complete phases.
        const failedWork = nextUnitOfWork;

        if (failedWork !== null) {
          // "Capture" the error by finding the nearest boundary. If there is no
          // error boundary, the nearest host container acts as one. If
          // captureError returns null, the error was intentionally ignored.
          const maybeBoundary = captureError(failedWork, error);
          if (maybeBoundary !== null) {
            const boundary = maybeBoundary;

            // Complete the boundary as if it rendered null. This will unmount
            // the failed tree.
            beginFailedWork(boundary.alternate, boundary, priorityLevel);

            // The next unit of work is now the boundary that captured the error.
            // Conceptually, we're unwinding the stack. We need to unwind the
            // context stack, too, from the failed work to the boundary that
            // captured the error.
            // TODO: If we set the memoized props in beginWork instead of
            // completeWork, rather than unwind the stack, we can just restart
            // from the root. Can't do that until then because without memoized
            // props, the nodes higher up in the tree will rerender unnecessarily.
            unwindContexts(failedWork, boundary);
            nextUnitOfWork = completeUnitOfWork(boundary);
          }
          // Continue performing work
          continue;
        } else if (fatalError === null) {
          // There is no current unit of work. This is a worst-case scenario
          // and should only be possible if there's a bug in the renderer, e.g.
          // inside resetAfterCommit.
          fatalError = error;
        }
      }

      // Stop performing work
      priorityLevel = NoWork;

      // If have we more work, and we're in a deferred batch, check to see
      // if the deadline has expired.
      if (
        nextPriorityLevel !== NoWork &&
        isPerformingDeferredWork &&
        !deadlineHasExpired
      ) {
        // We have more time to do work.
        priorityLevel = nextPriorityLevel;
        continue;
      }

      // There might be work left. Depending on the priority, we should
      // either perform it now or schedule a callback to perform it later.
      switch (nextPriorityLevel) {
        case SynchronousPriority:
        case TaskPriority:
          // Perform work immediately by switching the priority level
          // and continuing the loop.
          priorityLevel = nextPriorityLevel;
          break;
        case AnimationPriority:
          scheduleAnimationCallback(performAnimationWork);
          // Even though the next unit of work has animation priority, there
          // may still be deferred work left over as well. I think this is
          // only important for unit tests. In a real app, a deferred callback
          // would be scheduled during the next animation frame.
          scheduleDeferredCallback(performDeferredWork);
          break;
        case HighPriority:
        case LowPriority:
        case OffscreenPriority:
          scheduleDeferredCallback(performDeferredWork);
          break;
      }
    }

    const errorToThrow = fatalError || firstUncaughtError;

    // We're done performing work. Time to clean up.
    isPerformingWork = false;
    deadlineHasExpired = false;
    fatalError = null;
    firstUncaughtError = null;
    capturedErrors = null;
    failedBoundaries = null;
    if (__DEV__) {
      stopWorkLoopTimer();
    }

    // It's safe to throw any unhandled errors.
    if (errorToThrow !== null) {
      throw errorToThrow;
    }
  }

  // Returns the boundary that captured the error, or null if the error is ignored
  function captureError(failedWork: Fiber, error: Error): Fiber | null {
    // It is no longer valid because we exited the user code.
    ReactCurrentOwner.current = null;
    if (__DEV__) {
      ReactDebugCurrentFiber.current = null;
      ReactDebugCurrentFiber.phase = null;
    }
    // It is no longer valid because this unit of work failed.
    nextUnitOfWork = null;

    // Search for the nearest error boundary.
    let boundary: Fiber | null = null;

    // Passed to logCapturedError()
    let errorBoundaryFound: boolean = false;
    let willRetry: boolean = false;
    let errorBoundaryName: string | null = null;

    // Host containers are a special case. If the failed work itself is a host
    // container, then it acts as its own boundary. In all other cases, we
    // ignore the work itself and only search through the parents.
    if (failedWork.tag === HostRoot) {
      boundary = failedWork;

      if (isFailedBoundary(failedWork)) {
        // If this root already failed, there must have been an error when
        // attempting to unmount it. This is a worst-case scenario and
        // should only be possible if there's a bug in the renderer.
        fatalError = error;
      }
    } else {
      let node = failedWork.return;
      while (node !== null && boundary === null) {
        if (node.tag === ClassComponent) {
          const instance = node.stateNode;
          if (typeof instance.unstable_handleError === 'function') {
            errorBoundaryFound = true;
            errorBoundaryName = getComponentName(node);

            // Found an error boundary!
            boundary = node;
            willRetry = true;
          }
        } else if (node.tag === HostRoot) {
          // Treat the root like a no-op error boundary.
          boundary = node;
        }

        if (isFailedBoundary(node)) {
          // This boundary is already in a failed state.

          // If we're currently unmounting, that means this error was
          // thrown while unmounting a failed subtree. We should ignore
          // the error.
          if (isUnmounting) {
            return null;
          }

          // If we're in the commit phase, we should check to see if
          // this boundary already captured an error during this commit.
          // This case exists because multiple errors can be thrown during
          // a single commit without interruption.
          if (
            commitPhaseBoundaries !== null &&
            (commitPhaseBoundaries.has(node) ||
              (node.alternate !== null &&
                commitPhaseBoundaries.has(node.alternate)))
          ) {
            // If so, we should ignore this error.
            return null;
          }

          // The error should propagate to the next boundary -— we keep looking.
          boundary = null;
          willRetry = false;
        }

        node = node.return;
      }
    }

    if (boundary !== null) {
      // Add to the collection of failed boundaries. This lets us know that
      // subsequent errors in this subtree should propagate to the next boundary.
      if (failedBoundaries === null) {
        failedBoundaries = new Set();
      }
      failedBoundaries.add(boundary);

      // This method is unsafe outside of the begin and complete phases.
      // We might be in the commit phase when an error is captured.
      // The risk is that the return path from this Fiber may not be accurate.
      // That risk is acceptable given the benefit of providing users more context.
      const componentStack = getStackAddendumByWorkInProgressFiber(failedWork);
      const componentName = getComponentName(failedWork);

      // Add to the collection of captured errors. This is stored as a global
      // map of errors and their component stack location keyed by the boundaries
      // that capture them. We mostly use this Map as a Set; it's a Map only to
      // avoid adding a field to Fiber to store the error.
      if (capturedErrors === null) {
        capturedErrors = new Map();
      }
      capturedErrors.set(boundary, {
        componentName,
        componentStack,
        error,
        errorBoundary: errorBoundaryFound ? boundary.stateNode : null,
        errorBoundaryFound,
        errorBoundaryName,
        willRetry,
      });

      // If we're in the commit phase, defer scheduling an update on the
      // boundary until after the commit is complete
      if (isCommitting) {
        if (commitPhaseBoundaries === null) {
          commitPhaseBoundaries = new Set();
        }
        commitPhaseBoundaries.add(boundary);
      } else {
        // Otherwise, schedule an update now.
        scheduleErrorRecovery(boundary);
      }
      return boundary;
    } else if (firstUncaughtError === null) {
      // If no boundary is found, we'll need to throw the error
      firstUncaughtError = error;
    }
    return null;
  }

  function hasCapturedError(fiber: Fiber): boolean {
    // TODO: capturedErrors should store the boundary instance, to avoid needing
    // to check the alternate.
    return capturedErrors !== null &&
      (capturedErrors.has(fiber) ||
        (fiber.alternate !== null && capturedErrors.has(fiber.alternate)));
  }

  function isFailedBoundary(fiber: Fiber): boolean {
    // TODO: failedBoundaries should store the boundary instance, to avoid
    // needing to check the alternate.
    return failedBoundaries !== null &&
      (failedBoundaries.has(fiber) ||
        (fiber.alternate !== null && failedBoundaries.has(fiber.alternate)));
  }

  function commitErrorHandling(effectfulFiber: Fiber) {
    let capturedError;
    if (capturedErrors !== null) {
      capturedError = capturedErrors.get(effectfulFiber);
      capturedErrors.delete(effectfulFiber);
      if (capturedError == null) {
        if (effectfulFiber.alternate !== null) {
          effectfulFiber = effectfulFiber.alternate;
          capturedError = capturedErrors.get(effectfulFiber);
          capturedErrors.delete(effectfulFiber);
        }
      }
    }

    invariant(
      capturedError != null,
      'No error for given unit of work. This error is likely caused by a ' +
        'bug in React. Please file an issue.',
    );

    const error = capturedError.error;
    try {
      logCapturedError(capturedError);
    } catch (e) {
      // Prevent cycle if logCapturedError() throws.
      // A cycle may still occur if logCapturedError renders a component that throws.
      console.error(e);
    }

    switch (effectfulFiber.tag) {
      case ClassComponent:
        const instance = effectfulFiber.stateNode;

        const info: HandleErrorInfo = {
          componentStack: capturedError.componentStack,
        };

        // Allow the boundary to handle the error, usually by scheduling
        // an update to itself
        instance.unstable_handleError(error, info);
        return;
      case HostRoot:
        if (firstUncaughtError === null) {
          // If this is the host container, we treat it as a no-op error
          // boundary. We'll throw the first uncaught error once it's safe to
          // do so, at the end of the batch.
          firstUncaughtError = error;
        }
        return;
      default:
        invariant(
          false,
          'Invalid type of work. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }
  }

  function unwindContexts(from: Fiber, to: Fiber) {
    let node = from;
    while (node !== null && node !== to && node.alternate !== to) {
      switch (node.tag) {
        case ClassComponent:
          popContextProvider(node);
          break;
        case HostComponent:
          popHostContext(node);
          break;
        case HostRoot:
          popHostContainer(node);
          break;
        case HostPortal:
          popHostContainer(node);
          break;
      }
      if (__DEV__) {
        stopWorkTimer(node);
      }
      node = node.return;
    }
  }

  function scheduleRoot(root: FiberRoot, priorityLevel: PriorityLevel) {
    if (priorityLevel === NoWork) {
      return;
    }

    if (!root.isScheduled) {
      root.isScheduled = true;
      if (lastScheduledRoot) {
        // Schedule ourselves to the end.
        lastScheduledRoot.nextScheduledRoot = root;
        lastScheduledRoot = root;
      } else {
        // We're the only work scheduled.
        nextScheduledRoot = root;
        lastScheduledRoot = root;
      }
    }
  }

  function scheduleUpdate(fiber: Fiber, priorityLevel: PriorityLevel) {
    if (__DEV__) {
      recordScheduleUpdate();
    }

    if (priorityLevel <= nextPriorityLevel) {
      // We must reset the current unit of work pointer so that we restart the
      // search from the root during the next tick, in case there is now higher
      // priority work somewhere earlier than before.
      nextUnitOfWork = null;
    }

    if (__DEV__) {
      if (fiber.tag === ClassComponent) {
        const instance = fiber.stateNode;
        warnAboutInvalidUpdates(instance);
      }
    }

    let node = fiber;
    let shouldContinue = true;
    while (node !== null && shouldContinue) {
      // Walk the parent path to the root and update each node's priority. Once
      // we reach a node whose priority matches (and whose alternate's priority
      // matches) we can exit safely knowing that the rest of the path is correct.
      shouldContinue = false;
      if (
        node.pendingWorkPriority === NoWork ||
        node.pendingWorkPriority > priorityLevel
      ) {
        // Priority did not match. Update and keep going.
        shouldContinue = true;
        node.pendingWorkPriority = priorityLevel;
      }
      if (node.alternate !== null) {
        if (
          node.alternate.pendingWorkPriority === NoWork ||
          node.alternate.pendingWorkPriority > priorityLevel
        ) {
          // Priority did not match. Update and keep going.
          shouldContinue = true;
          node.alternate.pendingWorkPriority = priorityLevel;
        }
      }
      if (node.return === null) {
        if (node.tag === HostRoot) {
          const root: FiberRoot = (node.stateNode: any);
          scheduleRoot(root, priorityLevel);
          // Depending on the priority level, either perform work now or
          // schedule a callback to perform work later.
          switch (priorityLevel) {
            case SynchronousPriority:
              performWork(SynchronousPriority, null);
              return;
            case TaskPriority:
              // TODO: If we're not already performing work, schedule a
              // deferred callback.
              return;
            case AnimationPriority:
              scheduleAnimationCallback(performAnimationWork);
              return;
            case HighPriority:
            case LowPriority:
            case OffscreenPriority:
              scheduleDeferredCallback(performDeferredWork);
              return;
          }
        } else {
          if (__DEV__) {
            if (fiber.tag === ClassComponent) {
              warnAboutUpdateOnUnmounted(fiber.stateNode);
            }
          }
          return;
        }
      }
      node = node.return;
    }
  }

  function getPriorityContext(): PriorityLevel {
    // If we're in a batch, or if we're already performing work, downgrade sync
    // priority to task priority
    if (
      priorityContext === SynchronousPriority &&
      (isPerformingWork || isBatchingUpdates)
    ) {
      return TaskPriority;
    }
    return priorityContext;
  }

  function scheduleErrorRecovery(fiber: Fiber) {
    scheduleUpdate(fiber, TaskPriority);
  }

  function performWithPriority(priorityLevel: PriorityLevel, fn: Function) {
    const previousPriorityContext = priorityContext;
    priorityContext = priorityLevel;
    try {
      fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  function batchedUpdates<A, R>(fn: (a: A) => R, a: A): R {
    const previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      return fn(a);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      // If we're not already inside a batch, we need to flush any task work
      // that was created by the user-provided function.
      if (!isPerformingWork && !isBatchingUpdates) {
        performWork(TaskPriority, null);
      }
    }
  }

  function unbatchedUpdates<A>(fn: () => A): A {
    const previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = false;
    try {
      return fn();
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
    }
  }

  function syncUpdates<A>(fn: () => A): A {
    const previousPriorityContext = priorityContext;
    priorityContext = SynchronousPriority;
    try {
      return fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  function deferredUpdates<A>(fn: () => A): A {
    const previousPriorityContext = priorityContext;
    priorityContext = LowPriority;
    try {
      return fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  return {
    scheduleUpdate: scheduleUpdate,
    getPriorityContext: getPriorityContext,
    performWithPriority: performWithPriority,
    batchedUpdates: batchedUpdates,
    unbatchedUpdates: unbatchedUpdates,
    syncUpdates: syncUpdates,
    deferredUpdates: deferredUpdates,
  };
};
