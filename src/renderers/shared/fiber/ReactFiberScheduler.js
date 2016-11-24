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

import type { Fiber } from 'ReactFiber';
import type { FiberRoot } from 'ReactFiberRoot';
import type { HostConfig, Deadline } from 'ReactFiberReconciler';
import type { PriorityLevel } from 'ReactPriorityLevel';

var ReactFiberBeginWork = require('ReactFiberBeginWork');
var ReactFiberCompleteWork = require('ReactFiberCompleteWork');
var ReactFiberCommitWork = require('ReactFiberCommitWork');
var ReactCurrentOwner = require('ReactCurrentOwner');

var { cloneFiber } = require('ReactFiber');

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
  Callback,
  PlacementAndCallback,
  UpdateAndCallback,
  PlacementAndUpdateAndCallback,
  DeletionAndCallback,
} = require('ReactTypeOfSideEffect');

var {
  HostContainer,
  ClassComponent,
} = require('ReactTypeOfWork');

if (__DEV__) {
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
}

var timeHeuristicForUnitOfWork = 1;

type TrappedError = {
  boundary: Fiber | null,
  root: FiberRoot | null,
  error: any,
};

module.exports = function<T, P, I, TI, C>(config : HostConfig<T, P, I, TI, C>) {
  const { beginWork } = ReactFiberBeginWork(config, scheduleUpdate);
  const { completeWork } = ReactFiberCompleteWork(config);
  const { commitInsertion, commitDeletion, commitWork, commitLifeCycles } =
    ReactFiberCommitWork(config, trapError);

  const hostScheduleAnimationCallback = config.scheduleAnimationCallback;
  const hostScheduleDeferredCallback = config.scheduleDeferredCallback;
  const useSyncScheduling = config.useSyncScheduling;

  const prepareForCommit = config.prepareForCommit;
  const resetAfterCommit = config.resetAfterCommit;

  // The priority level to use when scheduling an update.
  let priorityContext : PriorityLevel = useSyncScheduling ?
    SynchronousPriority :
    LowPriority;

  // Whether updates should be batched. Only applies when using sync scheduling.
  let shouldBatchUpdates : boolean = false;

  // Need this to prevent recursion while in a Task loop.
  let isPerformingTaskWork : boolean = false;

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork : ?Fiber = null;
  let nextPriorityLevel : PriorityLevel = NoWork;

  // Linked list of roots with scheduled work on them.
  let nextScheduledRoot : ?FiberRoot = null;
  let lastScheduledRoot : ?FiberRoot = null;

  // Keep track of which host environment callbacks are scheduled
  let isAnimationCallbackScheduled : boolean = false;
  let isDeferredCallbackScheduled : boolean = false;

  // Caught errors and error boundaries that are currently handling them
  let activeErrorBoundaries : Set<Fiber> | null = null;
  let nextTrappedErrors : Array<TrappedError> | null = null;

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

  function findNextUnitOfWork() {
    // Clear out roots with no more work on them, or if they have uncaught errors
    while (nextScheduledRoot && nextScheduledRoot.current.pendingWorkPriority === NoWork) {
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
    while (root) {
      if (root.current.pendingWorkPriority !== NoWork && (
          highestPriorityLevel === NoWork ||
          highestPriorityLevel > root.current.pendingWorkPriority)) {
        highestPriorityLevel = root.current.pendingWorkPriority;
        highestPriorityRoot = root;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
    }
    if (highestPriorityRoot) {
      nextPriorityLevel = highestPriorityLevel;
      return cloneFiber(
        highestPriorityRoot.current,
        highestPriorityLevel
      );
    }

    nextPriorityLevel = NoWork;
    return null;
  }

  function commitAllWork(finishedWork : Fiber) {
    prepareForCommit();

    // Commit all the side-effects within a tree.
    // First, we'll perform all the host insertions, updates, deletions and
    // ref unmounts.
    let effectfulFiber = finishedWork.firstEffect;
    while (effectfulFiber) {
      switch (effectfulFiber.effectTag) {
        case Placement:
        case PlacementAndCallback: {
          commitInsertion(effectfulFiber);
          // Clear the "placement" from effect tag so that we know that this is inserted, before
          // any life-cycles like componentDidMount gets called.
          effectfulFiber.effectTag ^= Placement;
          break;
        }
        case PlacementAndUpdate:
        case PlacementAndUpdateAndCallback: {
          // Placement
          commitInsertion(effectfulFiber);
          // Clear the "placement" from effect tag so that we know that this is inserted, before
          // any life-cycles like componentDidMount gets called.
          effectfulFiber.effectTag ^= Placement;

          // Update
          const current = effectfulFiber.alternate;
          commitWork(current, effectfulFiber);
          break;
        }
        case Update:
        case UpdateAndCallback:
          const current = effectfulFiber.alternate;
          commitWork(current, effectfulFiber);
          break;
        case Deletion:
        case DeletionAndCallback:
          commitDeletion(effectfulFiber);
          break;
      }

      effectfulFiber = effectfulFiber.nextEffect;
    }

    // Finally if the root itself had an effect, we perform that since it is
    // not part of the effect list.
    if (finishedWork.effectTag !== NoEffect) {
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
    }

    resetAfterCommit();

    // Next, we'll perform all life-cycles and ref callbacks. Life-cycles
    // happens as a separate pass so that all effects in the entire tree have
    // already been invoked.
    effectfulFiber = finishedWork.firstEffect;
    while (effectfulFiber) {
      if (effectfulFiber.effectTag & (Update | Callback)) {
        const current = effectfulFiber.alternate;
        const previousPriorityContext = priorityContext;
        priorityContext = TaskPriority;
        try {
          commitLifeCycles(current, effectfulFiber);
        } finally {
          priorityContext = previousPriorityContext;
        }
      }
      const next = effectfulFiber.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      effectfulFiber.nextEffect = null;
      // Ensure that we reset the effectTag here so that we can rely on effect
      // tags to reason about the current life-cycle.
      effectfulFiber = next;
    }

    // Lifecycles on the root itself
    if (finishedWork.effectTag !== NoEffect) {
      const current = finishedWork.alternate;
      commitLifeCycles(current, finishedWork);
    }

    // The task work includes batched updates and error handling.
    performTaskWork();
  }

  function resetWorkPriority(workInProgress : Fiber) {
    let newPriority = NoWork;
    // progressedChild is going to be the child set with the highest priority.
    // Either it is the same as child, or it just bailed out because it choose
    // not to do the work.
    let child = workInProgress.progressedChild;
    while (child) {
      // Ensure that remaining work priority bubbles up.
      if (child.pendingWorkPriority !== NoWork &&
          (newPriority === NoWork ||
          newPriority > child.pendingWorkPriority)) {
        newPriority = child.pendingWorkPriority;
      }
      child = child.sibling;
    }
    workInProgress.pendingWorkPriority = newPriority;
  }

  function completeUnitOfWork(workInProgress : Fiber) : ?Fiber {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      const current = workInProgress.alternate;
      const next = completeWork(current, workInProgress);

      resetWorkPriority(workInProgress);

      // The work is now done. We don't need this anymore. This flags
      // to the system not to redo any work here.
      workInProgress.pendingProps = null;
      workInProgress.updateQueue = null;

      if (next) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        return next;
      }

      const returnFiber = workInProgress.return;

      if (returnFiber) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (!returnFiber.firstEffect) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect) {
          if (returnFiber.lastEffect) {
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
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }

      if (workInProgress.sibling) {
        // If there is more work to do in this returnFiber, do that next.
        return workInProgress.sibling;
      } else if (returnFiber) {
        // If there's no more work in this returnFiber. Complete the returnFiber.
        workInProgress = returnFiber;
        continue;
      } else {
        // If we're at the root, there's no more work to do. We can flush it.
        const root : FiberRoot = (workInProgress.stateNode : any);
        if (root.current === workInProgress) {
          throw new Error(
            'Cannot commit the same tree as before. This is probably a bug ' +
            'related to the return field.'
          );
        }
        root.current = workInProgress;
        // TODO: We can be smarter here and only look for more work in the
        // "next" scheduled work since we've already scanned passed. That
        // also ensures that work scheduled during reconciliation gets deferred.
        // const hasMoreWork = workInProgress.pendingWorkPriority !== NoWork;
        commitAllWork(workInProgress);
        const nextWork = findNextUnitOfWork();
        // if (!nextWork && hasMoreWork) {
          // TODO: This can happen when some deep work completes and we don't
          // know if this was the last one. We should be able to keep track of
          // the highest priority still in the tree for one pass. But if we
          // terminate an update we don't know.
          // throw new Error('FiberRoots should not have flagged more work if there is none.');
        // }
        return nextWork;
      }
    }
  }

  function performUnitOfWork(workInProgress : Fiber) : ?Fiber {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    const current = workInProgress.alternate;

    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onWillBeginWork(workInProgress);
    }
    // See if beginning this work spawns more work.
    let next = beginWork(current, workInProgress, nextPriorityLevel);
    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onDidBeginWork(workInProgress);
    }

    if (!next) {
      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onWillCompleteWork(workInProgress);
      }
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onDidCompleteWork(workInProgress);
      }
    }

    ReactCurrentOwner.current = null;

    return next;
  }

  function performDeferredWorkUnsafe(deadline) {
    if (!nextUnitOfWork) {
      nextUnitOfWork = findNextUnitOfWork();
    }
    while (nextUnitOfWork) {
      if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        if (!nextUnitOfWork) {
          // Find more work. We might have time to complete some more.
          nextUnitOfWork = findNextUnitOfWork();
        }
      } else {
        scheduleDeferredCallback(performDeferredWork);
        return;
      }
    }
  }

  function performDeferredWork(deadline) {
    isDeferredCallbackScheduled = false;
    performAndHandleErrors(LowPriority, deadline);
  }

  function performAnimationWorkUnsafe() {
    // Always start from the root
    nextUnitOfWork = findNextUnitOfWork();
    while (nextUnitOfWork &&
           nextPriorityLevel === AnimationPriority) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      if (!nextUnitOfWork) {
        // Keep searching for animation work until there's no more left
        nextUnitOfWork = findNextUnitOfWork();
      }
    }
    if (nextUnitOfWork) {
      scheduleCallbackAtPriority(nextPriorityLevel);
    }
  }

  function performAnimationWork() {
    isAnimationCallbackScheduled = false;
    performAndHandleErrors(AnimationPriority);
  }

  function performSynchronousWorkUnsafe() {
    nextUnitOfWork = findNextUnitOfWork();
    while (nextUnitOfWork &&
           nextPriorityLevel === SynchronousPriority) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

      if (!nextUnitOfWork) {
        nextUnitOfWork = findNextUnitOfWork();
      }
    }
    if (nextUnitOfWork) {
      scheduleCallbackAtPriority(nextPriorityLevel);
    }
  }

  function performSynchronousWork() {
    const prev = shouldBatchUpdates;
    shouldBatchUpdates = true;
    // All nested updates are batched
    try {
      performAndHandleErrors(SynchronousPriority);
    } finally {
      shouldBatchUpdates = prev;
    }
  }

  function performTaskWorkUnsafe() {
    if (isPerformingTaskWork) {
      throw new Error('Already performing task work');
    }

    isPerformingTaskWork = true;
    try {
      nextUnitOfWork = findNextUnitOfWork();
      while (nextUnitOfWork &&
             nextPriorityLevel === TaskPriority) {
        nextUnitOfWork =
          performUnitOfWork(nextUnitOfWork);

        if (!nextUnitOfWork) {
          nextUnitOfWork = findNextUnitOfWork();
        }
      }
      if (nextUnitOfWork) {
        scheduleCallbackAtPriority(nextPriorityLevel);
      }
    } finally {
      isPerformingTaskWork = false;
    }
  }

  function performTaskWork() {
    performAndHandleErrors(TaskPriority);
  }

  function performAndHandleErrors(priorityLevel : PriorityLevel, deadline : null | Deadline) {
    // Keep track of the first error we need to surface to the user.
    let firstUncaughtError = null;

    // The exact priority level doesn't matter, so long as it's in range of the
    // work (sync, animation, deferred) being performed.
    while (true) {
      try {
        switch (priorityLevel) {
          case SynchronousPriority:
            performSynchronousWorkUnsafe();
            break;
          case TaskPriority:
            if (!isPerformingTaskWork) {
              performTaskWorkUnsafe();
            }
            break;
          case AnimationPriority:
            performAnimationWorkUnsafe();
            break;
          case HighPriority:
          case LowPriority:
          case OffscreenPriority:
            if (!deadline) {
              throw new Error('No deadline');
            } else {
              performDeferredWorkUnsafe(deadline);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        trapError(nextUnitOfWork, error, false);
      }

      // If there were errors and we aren't already handling them, handle them now
      if (nextTrappedErrors && !activeErrorBoundaries) {
        const nextUncaughtError = handleErrors();
        firstUncaughtError = firstUncaughtError || nextUncaughtError;
      } else {
        // We've done our work.
        break;
      }

      // An error interrupted us. Now that it is handled, we may find more work.
      // It's safe because any roots with uncaught errors have been unscheduled.
      nextUnitOfWork = findNextUnitOfWork();
      if (!nextUnitOfWork) {
        // We found no other work we could do.
        break;
      }
    }

    // Now it's safe to surface the first uncaught error to the user.
    if (firstUncaughtError) {
      throw firstUncaughtError;
    }
  }

  function handleErrors() : Error | null {
    if (activeErrorBoundaries) {
      throw new Error('Already handling errors');
    }

    // Start tracking active boundaries.
    activeErrorBoundaries = new Set();
    // If we find unhandled errors, we'll only remember the first one.
    let firstUncaughtError = null;

    // All work created by error boundaries should have Task priority
    // so that it finishes before this function exits.
    const previousPriorityContext = priorityContext;
    priorityContext = TaskPriority;

    // Keep looping until there are no more trapped errors, or until we find
    // an unhandled error.
    while (nextTrappedErrors && nextTrappedErrors.length && !firstUncaughtError) {
      // First, find all error boundaries and notify them about errors.
      while (nextTrappedErrors && nextTrappedErrors.length) {
        const trappedError = nextTrappedErrors.shift();
        const boundary = trappedError.boundary;
        const error = trappedError.error;
        const root = trappedError.root;
        if (!boundary) {
          firstUncaughtError = firstUncaughtError || error;
          if (root && root.current) {
            // Unschedule this particular root since it fataled and we can't do
            // more work on it. This lets us continue working on other roots
            // even if one of them fails before rethrowing the error.
            root.current.pendingWorkPriority = NoWork;
          } else {
            // Normally we should know which root caused the error, so it is
            // unusual if we end up here. Since we assume this function always
            // unschedules failed roots, our only resort is to completely
            // unschedule all roots. Otherwise we may get into an infinite loop
            // trying to resume work and finding the failing but unknown root again.
            nextScheduledRoot = null;
            lastScheduledRoot = null;
          }
          continue;
        }
        // Don't visit boundaries twice.
        if (activeErrorBoundaries.has(boundary)) {
          continue;
        }
        try {
          // This error boundary is now active.
          // We will let it handle the error and retry rendering.
          // If it fails again, the next error will be propagated to the parent
          // boundary or rethrown.
          activeErrorBoundaries.add(boundary);
          // Give error boundary a chance to update its state.
          // Updates will be scheduled with Task priority.
          const instance = boundary.stateNode;
          instance.unstable_handleError(error);

          // Schedule an update, in case the boundary didn't call setState
          // on itself.
          scheduleUpdate(boundary);
        } catch (nextError) {
          // If an error is thrown, propagate the error to the parent boundary.
          trapError(boundary, nextError, false);
        }
      }

      // Now that we attempt to flush any work that was scheduled by the boundaries.
      // If this creates errors, they will be pushed to nextTrappedErrors and
      // the outer loop will continue.
      try {
        performTaskWorkUnsafe();
      } catch (error) {
        trapError(nextUnitOfWork, error, false);
      }
    }

    nextTrappedErrors = null;
    activeErrorBoundaries = null;
    priorityContext = previousPriorityContext;

    // Return the error so we can rethrow after handling other roots.
    return firstUncaughtError;
  }

  function trapError(failedFiber : Fiber | null, error : any, isUnmounting : boolean) : void {
    // Don't try to start here again on next flush.
    nextUnitOfWork = null;

    // It is no longer valid because we exited the user code.
    ReactCurrentOwner.current = null;

    if (isUnmounting && activeErrorBoundaries) {
      // Ignore errors caused by unmounting during error handling.
      // This lets error boundaries safely tear down already failed trees.
      return;
    }

    let boundary = null;
    let root = null;

    // Search for the parent error boundary and root.
    let fiber = failedFiber;
    while (fiber) {
      const parent = fiber.return;
      if (parent) {
        if (parent.tag === ClassComponent && boundary === null) {
          // Consider a candidate for parent boundary.
          const instance = parent.stateNode;
          const isBoundary = typeof instance.unstable_handleError === 'function';
          if (isBoundary) {
            // Skip boundaries that are already active so errors can propagate.
            const isBoundaryAlreadyHandlingAnotherError = (
              activeErrorBoundaries !== null &&
              activeErrorBoundaries.has(parent)
            );
            if (!isBoundaryAlreadyHandlingAnotherError) {
              // We found the boundary.
              boundary = parent;
            }
          }
        }
      } else if (fiber.tag === HostContainer) {
        // We found the root.
        root = (fiber.stateNode : FiberRoot);
      } else {
        throw new Error('Invalid root');
      }
      fiber = parent;
    }

    if (!nextTrappedErrors) {
      nextTrappedErrors = [];
    }
    nextTrappedErrors.push({
      boundary,
      error,
      root,
    });
  }

  function scheduleWork(root : FiberRoot) {
    let priorityLevel = priorityContext;

    // If we're in a batch, switch to task priority
    if (priorityLevel === SynchronousPriority && shouldBatchUpdates) {
      priorityLevel = TaskPriority;
    }

    scheduleWorkAtPriority(root, priorityLevel);
  }

  function scheduleWorkAtPriority(root : FiberRoot, priorityLevel : PriorityLevel) {
    // Set the priority on the root, without deprioritizing
    if (root.current.pendingWorkPriority === NoWork ||
        priorityLevel <= root.current.pendingWorkPriority) {
      root.current.pendingWorkPriority = priorityLevel;
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

    // We must reset the current unit of work pointer so that we restart the
    // search from the root during the next tick, in case there is now higher
    // priority work somewhere earlier than before.
    if (priorityLevel <= nextPriorityLevel) {
      nextUnitOfWork = null;
    }

    scheduleCallbackAtPriority(priorityLevel);
  }

  function scheduleCallbackAtPriority(priorityLevel : PriorityLevel) {
    switch (priorityLevel) {
      case SynchronousPriority:
        // Perform work immediately
        performSynchronousWork();
        return;
      case TaskPriority:
        // Do nothing. Task work should be flushed after committing.
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
  }

  function scheduleUpdate(fiber : Fiber) {
    let priorityLevel = priorityContext;
    // If we're in a batch, switch to task priority
    if (priorityLevel === SynchronousPriority && shouldBatchUpdates) {
      priorityLevel = TaskPriority;
    }

    while (true) {
      if (fiber.pendingWorkPriority === NoWork ||
          fiber.pendingWorkPriority >= priorityLevel) {
        fiber.pendingWorkPriority = priorityLevel;
      }
      if (fiber.alternate) {
        if (fiber.alternate.pendingWorkPriority === NoWork ||
            fiber.alternate.pendingWorkPriority >= priorityLevel) {
          fiber.alternate.pendingWorkPriority = priorityLevel;
        }
      }
      if (!fiber.return) {
        if (fiber.tag === HostContainer) {
          const root : FiberRoot = (fiber.stateNode : any);
          scheduleWorkAtPriority(root, priorityLevel);
          return;
        } else {
          // TODO: Warn about setting state on an unmounted component.
          return;
        }
      }
      fiber = fiber.return;
    }
  }

  function performWithPriority(priorityLevel : PriorityLevel, fn : Function) {
    const previousPriorityContext = priorityContext;
    priorityContext = priorityLevel;
    try {
      fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  function batchedUpdates<A, R>(fn : (a: A) => R, a : A) : R {
    const prev = shouldBatchUpdates;
    shouldBatchUpdates = true;
    try {
      return fn(a);
    } finally {
      // If we're exiting the batch, perform any scheduled task work
      try {
        if (!prev) {
          performTaskWork();
        }
      } finally {
        shouldBatchUpdates = prev;
      }
    }
  }

  function syncUpdates<A>(fn : () => A) : A {
    const previousPriorityContext = priorityContext;
    priorityContext = SynchronousPriority;
    try {
      return fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  return {
    scheduleWork: scheduleWork,
    performWithPriority: performWithPriority,
    batchedUpdates: batchedUpdates,
    syncUpdates: syncUpdates,
  };
};
