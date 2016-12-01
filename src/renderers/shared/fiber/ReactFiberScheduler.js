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
  ContentReset,
  Callback,
  Err,
} = require('ReactTypeOfSideEffect');

var {
  HostRoot,
  ClassComponent,
} = require('ReactTypeOfWork');

var {
  unwindContext,
} = require('ReactFiberContext');

if (__DEV__) {
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
}

var timeHeuristicForUnitOfWork = 1;

module.exports = function<T, P, I, TI, C>(config : HostConfig<T, P, I, TI, C>) {
  const { beginWork, beginFailedWork } =
    ReactFiberBeginWork(config, scheduleUpdate);
  const { completeWork } = ReactFiberCompleteWork(config);
  const { commitPlacement, commitDeletion, commitWork, commitLifeCycles } =
    ReactFiberCommitWork(config, captureError);

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

  let capturedErrors : Map<Fiber, Error> | null = null;
  let firstUncaughtError : Error | null = null;

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
    pass1: while (true) {
      try {
        while (effectfulFiber) {
          if (effectfulFiber.effectTag & ContentReset) {
            config.resetTextContent(effectfulFiber.stateNode);
          }

          // The following switch statement is only concerned about placement,
          // updates, and deletions. To avoid needing to add a case for every
          // possible bitmap value, we remove the secondary effects from the
          // effect tag and switch on that value.
          let primaryEffectTag = effectfulFiber.effectTag & ~(Callback | Err | ContentReset);
          switch (primaryEffectTag) {
            case Placement: {
              commitPlacement(effectfulFiber);
              // Clear the "placement" from effect tag so that we know that this is inserted, before
              // any life-cycles like componentDidMount gets called.
              effectfulFiber.effectTag &= ~Placement;
              break;
            }
            case PlacementAndUpdate: {
              // Placement
              commitPlacement(effectfulFiber);
              // Clear the "placement" from effect tag so that we know that this is inserted, before
              // any life-cycles like componentDidMount gets called.
              effectfulFiber.effectTag &= ~Placement;

              // Update
              const current = effectfulFiber.alternate;
              commitWork(current, effectfulFiber);
              break;
            }
            case Update: {
              const current = effectfulFiber.alternate;
              commitWork(current, effectfulFiber);
              break;
            }
            case Deletion: {
              commitDeletion(effectfulFiber);
              break;
            }
          }
          effectfulFiber = effectfulFiber.nextEffect;
        }
      } catch (error) {
        if (effectfulFiber) {
          captureError(effectfulFiber, error, false);
          effectfulFiber = effectfulFiber.nextEffect;
          continue pass1;
        }
      }
      break;
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
    const previousPriorityContext = priorityContext;
    priorityContext = TaskPriority;
    pass2: while (true) {
      try {
        while (effectfulFiber) {
          const current = effectfulFiber.alternate;
          // Use Task priority for lifecycle updates
          if (effectfulFiber.effectTag & (Update | Callback)) {
            commitLifeCycles(current, effectfulFiber);
          }

          if (effectfulFiber.effectTag & Err) {
            commitErrorHandling(effectfulFiber);
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
      } catch (error) {
        if (effectfulFiber) {
          captureError(effectfulFiber, error, false);
          const next = effectfulFiber.nextEffect;
          effectfulFiber.nextEffect = null;
          effectfulFiber = next;
          continue pass2;
        }
      }
      priorityContext = previousPriorityContext;
      break;
    }

    // Lifecycles on the root itself
    if (finishedWork.effectTag !== NoEffect) {
      const current = finishedWork.alternate;
      commitLifeCycles(current, finishedWork);
      if (finishedWork.effectTag & Err) {
        commitErrorHandling(finishedWork);
      }
    }

    if (capturedErrors) {
      if (capturedErrors.size) {
        capturedErrors.forEach((error, boundary) => {
          scheduleUpdate(boundary);
        });
      } else {
        capturedErrors = null;
      }
    }

    // Flush any task work that was scheduled during this batch
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
    let next;
    const isFailedWork = capturedErrors && capturedErrors.has(workInProgress);
    if (isFailedWork) {
      next = beginFailedWork(current, workInProgress, nextPriorityLevel);
      workInProgress.effectTag |= Err;
    } else {
      next = beginWork(current, workInProgress, nextPriorityLevel);
    }

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
    performAndHandleErrors(SynchronousPriority);
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
    // The exact priority level doesn't matter, so long as it's in range of the
    // work (sync, animation, deferred) being performed.
    let shouldContinue = true;
    while (shouldContinue) {
      shouldContinue = false;
      const prevShouldBatchUpdates = shouldBatchUpdates;
      shouldBatchUpdates = true;
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
        const failedWork = nextUnitOfWork;
        const boundary = captureError(failedWork, error, false);
        if (boundary) {
          // The boundary failed to complete. Complete it as if rendered null.
          beginFailedWork(boundary.alternate, boundary, priorityLevel);

          // The next unit of work is now the boundary that captured the error.
          // Conceptually, we're unwinding the stack. We need to unwind the
          // context stack, too, from the failed work to the boundary that
          // captured the error.
          // TODO: If we set the memoized props in beginWork instead of
          // completeWork, rather than unwind the stack, we can just restart
          // from the root. Can't do that until then because without memoized
          // props, the nodes higher up in the tree will rerender unnecessarily.
          if (failedWork) {
            unwindContext(failedWork, boundary);
          }
          nextUnitOfWork = completeUnitOfWork(boundary);

          // We were interupted by an error. Continue performing work.
          shouldContinue = true;
        }
      } finally {
        shouldBatchUpdates = prevShouldBatchUpdates;
      }
    }

    // Throw the first uncaught error
    if (!nextUnitOfWork && firstUncaughtError) {
      let e = firstUncaughtError;
      firstUncaughtError = null;
      throw e;
    }
  }

  function captureError(failedWork : Fiber | null, error : Error, isUnmounting : boolean) : Fiber | null {
    // It is no longer valid because we exited the user code.
    ReactCurrentOwner.current = null;
    // It is no longer valid because this unit of work failed.
    nextUnitOfWork = null;

    // Ignore this error if it's the result of unmounting a failed boundary
    if (failedWork &&
        isUnmounting &&
        capturedErrors &&
        capturedErrors.has(failedWork)) {
      return null;
    }

    // Search for the nearest error boundary.
    let boundary : Fiber | null = null;
    if (failedWork) {
      // Host containers are a special case. If the failed work itself is a host
      // container, then it acts as its own boundary. In all other cases, we
      // ignore the work itself and only search through the parents.
      if (failedWork.tag === HostRoot) {
        boundary = failedWork;
      } else {
        let node = failedWork.return;
        while (node && !boundary) {
          if (node.tag === ClassComponent) {
            const instance = node.stateNode;
            if (typeof instance.unstable_handleError === 'function') {
              // Found an error boundary!
              boundary = node;
            }
          } else if (node.tag === HostRoot) {
            // Treat the root like a no-op error boundary.
            boundary = node;
          }
          node = node.return;
        }
      }
    }

    if (boundary) {
      // Add to the collection of captured errors. This is stored as a global
      // map of errors keyed by the boundaries that capture them. We mostly
      // use this Map as a Set; it's a Map only to avoid adding a field to Fiber
      // to store the error.
      if (!capturedErrors) {
        capturedErrors = new Map();
      }
      // Ensure that neither this boundary nor its alternate has captured an
      // error already.
      if (!capturedErrors.has(boundary) &&
          !(boundary.alternate && capturedErrors.has(boundary.alternate))) {
        capturedErrors.set(boundary, error);
      }
      return boundary;
    } else if (!firstUncaughtError) {
      // If no boundary is found, we'll need to throw the error
      firstUncaughtError = error;
    }
    return null;
  }

  function commitErrorHandling(effectfulFiber : Fiber) {
    let error;
    if (capturedErrors) {
      // Get the error associated with the fiber being commited.
      error = capturedErrors.get(effectfulFiber);
      capturedErrors.delete(effectfulFiber);
    }
    if (!error) {
      throw new Error('No matching captured error.');
    }

    switch (effectfulFiber.tag) {
      case ClassComponent:
        const instance = effectfulFiber.stateNode;
        try {
          // Allow the boundary to handle the error, usually by scheduling
          // an update to itself
          instance.unstable_handleError(error);
        } catch (e) {
          captureError(effectfulFiber, e, false);
        }
        return;
      case HostRoot:
        if (!firstUncaughtError) {
          // If this is the host container, we treat it as a no-op error
          // boundary. We'll throw the first uncaught error once it's safe to
          // do so, at the end of the batch.
          firstUncaughtError = error;
        }
        return;
      default:
        throw new Error('Invalid type of work.');
    }
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

    let node = fiber;
    let shouldContinue = true;
    while (node && shouldContinue) {
      // Walk the parent path to the root and update each node's priority. Once
      // we reach a node whose priority matches (and whose alternate's priority
      // matches) we can exit safely knowing that the rest of the path is correct.
      shouldContinue = false;
      if (node.pendingWorkPriority === NoWork ||
          node.pendingWorkPriority >= priorityLevel) {
        // Priority did not match. Update and keep going.
        shouldContinue = true;
        node.pendingWorkPriority = priorityLevel;
      }
      if (node.alternate) {
        if (node.alternate.pendingWorkPriority === NoWork ||
            node.alternate.pendingWorkPriority >= priorityLevel) {
          // Priority did not match. Update and keep going.
          shouldContinue = true;
          node.alternate.pendingWorkPriority = priorityLevel;
        }
      }
      if (!node.return) {
        if (node.tag === HostRoot) {
          const root : FiberRoot = (node.stateNode : any);
          scheduleWorkAtPriority(root, priorityLevel);
        } else {
          // TODO: Warn about setting state on an unmounted component.
          return;
        }
      }
      node = node.return;
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
