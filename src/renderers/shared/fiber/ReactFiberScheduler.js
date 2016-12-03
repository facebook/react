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

  // Keeps track of whether we're currently in a work loop. Used to batch
  // nested updates.
  let isPerformingWork : boolean = false;
  // This lets us know if we should defer a commit until the next frame.
  let isPerformingDeferredWork : boolean = false;

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork : ?Fiber = null;
  let nextPriorityLevel : PriorityLevel = NoWork;

  let pendingCommit : Fiber | null = null;

  // Linked list of roots with scheduled work on them.
  let nextScheduledRoot : ?FiberRoot = null;
  let lastScheduledRoot : ?FiberRoot = null;

  // Keep track of which host environment callbacks are scheduled.
  let isAnimationCallbackScheduled : boolean = false;
  let isDeferredCallbackScheduled : boolean = false;

  let capturedErrors : Map<Fiber, Error> | null = null;
  let firstUncaughtError : Error | null = null;

  let isCommitting : boolean = false;
  // Error boundaries that captured an error during the current commit.
  let commitPhaseBoundaries : Set<Fiber> | null = null;

  let isUnmounting : boolean = false;

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
    if (pendingCommit) {
      nextPriorityLevel = pendingCommit.pendingWorkPriority;
      return null;
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

  // Returns true if the commit phase finishes without any errors.
  function commitAllWork(finishedWork : Fiber): boolean {
    // We keep track of this so that captureError can collect any boundaries
    // that capture an error during the commit phase. The reason these aren't
    // local to this function is because errors that occur during cWU are
    // captured elsewhere, to prevent the unmount from being interrupted.
    isCommitting = true;

    pendingCommit = null;
    const root : FiberRoot = (finishedWork.stateNode : any);
    if (root.current === finishedWork) {
      throw new Error(
        'Cannot commit the same tree as before. This is probably a bug ' +
        'related to the return field.'
      );
    }
    root.current = finishedWork;

    // Updates that occur during the commit phase should have Task priority
    const previousPriorityContext = priorityContext;
    priorityContext = TaskPriority;

    prepareForCommit();

    // Commit all the side-effects within a tree.
    // First, we'll perform all the host insertions, updates, deletions and
    // ref unmounts.
    let effectfulFiber = finishedWork.firstEffect;
    pass1: while (true) {
      let didHandleRoot = false;
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
              // TODO: findDOMNode doesn't rely on this any more but isMounted
              // does and isMounted is deprecated anyway so we should be able
              // to kill this.
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
              isUnmounting = true;
              commitDeletion(effectfulFiber);
              isUnmounting = false;
              break;
            }
          }
          effectfulFiber = effectfulFiber.nextEffect;
        }

        // Finally if the root itself had an effect, we perform that since it is
        // not part of the effect list.
        if (!didHandleRoot && finishedWork.effectTag !== NoEffect) {
          didHandleRoot = true;
          const current = finishedWork.alternate;
          commitWork(current, finishedWork);
        }
      } catch (error) {
        captureError(effectfulFiber || null, error);
        if (effectfulFiber) {
          effectfulFiber = effectfulFiber.nextEffect;
        }
        // Clean-up
        isUnmounting = false;
        continue pass1;
      }
      break;
    }

    resetAfterCommit();

    // Next, we'll perform all life-cycles and ref callbacks. Life-cycles
    // happens as a separate pass so that all effects in the entire tree have
    // already been invoked.
    effectfulFiber = finishedWork.firstEffect;
    pass2: while (true) {
      let didHandleRoot = false;
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

        // Finally if the root itself had an effect, we perform that since it is
        // not part of the effect list.
        if (!didHandleRoot && finishedWork.effectTag !== NoEffect) {
          didHandleRoot = true;
          const current = finishedWork.alternate;
          commitLifeCycles(current, finishedWork);
          if (finishedWork.effectTag & Err) {
            commitErrorHandling(finishedWork);
          }
        }
      } catch (error) {
        captureError(effectfulFiber || null, error);
        if (effectfulFiber) {
          const next = effectfulFiber.nextEffect;
          effectfulFiber.nextEffect = null;
          effectfulFiber = next;
        }
        continue pass2;
      }
      priorityContext = previousPriorityContext;
      break;
    }

    isCommitting = false;

    // If we caught any errors during this commit, schedule their boundaries
    // to update.
    let noErrors;
    if (commitPhaseBoundaries) {
      noErrors = false;
      commitPhaseBoundaries.forEach(scheduleUpdate);
      commitPhaseBoundaries = null;
    } else {
      noErrors = true;
    }

    priorityContext = previousPriorityContext;
    nextUnitOfWork = null;

    return noErrors;
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

      // The work is now done. We don't need this anymore. This flags
      // to the system not to redo any work here.
      workInProgress.pendingProps = null;
      workInProgress.updateQueue = null;

      const returnFiber = workInProgress.return;
      const siblingFiber = workInProgress.sibling;

      resetWorkPriority(workInProgress);

      if (next) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        return next;
      }

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

      if (siblingFiber) {
        // If there is more work to do in this returnFiber, do that next.
        return siblingFiber;
      } else if (returnFiber) {
        // If there's no more work in this returnFiber. Complete the returnFiber.
        workInProgress = returnFiber;
        continue;
      } else {
        // If we've reached the root, commit during the next unit of work.
        pendingCommit = workInProgress;
        return null;
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

  function performFailedUnitOfWork(workInProgress : Fiber) : ?Fiber {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    const current = workInProgress.alternate;

    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onWillBeginWork(workInProgress);
    }
    // See if beginning this work spawns more work.
    let next = beginFailedWork(current, workInProgress, nextPriorityLevel);

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

  function performDeferredWork(deadline) {
    // We pass the lowest deferred priority here because it acts as a minimum.
    // Higher priorities will also be performed.
    isDeferredCallbackScheduled = false;
    performWork(OffscreenPriority, deadline);
  }

  function performAnimationWork() {
    isAnimationCallbackScheduled = false;
    performWork(AnimationPriority);
  }

  function workLoop(priorityLevel) {
    outer: while (true) {
      if (!nextUnitOfWork) {
        nextUnitOfWork = findNextUnitOfWork();
      }

      // If there are errors, use a forked version of performUnitOfWork
      if (capturedErrors && capturedErrors.size) {
        while (true) {
          if (!nextUnitOfWork && !pendingCommit) {
            nextUnitOfWork = findNextUnitOfWork();
          }

          // If we're performing Task work and we're inside a deferred work batch,
          // then we shouldn't commit any work yet. Defer it to the next frame.
          // TODO: Is there a better way check if the pending commit should be
          // deferred? It's not as simple as retaining work priority because
          // the root may receive a lower priority update before the completed
          // work is flushed, causing the new update to be up-prioritized.
          if (
            pendingCommit &&
            !(priorityLevel === TaskPriority && isPerformingDeferredWork)
          ) {
            commitAllWork(pendingCommit);
          } else if (nextUnitOfWork && nextPriorityLevel !== NoWork && nextPriorityLevel <= priorityLevel) {
            if (isFailedWork(nextUnitOfWork)) {
              nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
            } else {
              nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
            }
          } else {
            return;
          }
        }
      }

      // Otherwise, handle the normal, faster case where there are no errors:
      while (true) {
        if (!nextUnitOfWork && !pendingCommit) {
          nextUnitOfWork = findNextUnitOfWork();
        }

        // If we're performing Task work and we're inside a deferred work batch,
        // then we shouldn't commit any work yet. Defer it to the next frame.
        // TODO: Is there a better way check if the pending commit should be
        // deferred? It's not as simple as retaining work priority because
        // the root may receive a lower priority update before the completed
        // work is flushed, causing the new update to be up-prioritized.
        if (
          pendingCommit &&
          !(priorityLevel === TaskPriority && isPerformingDeferredWork)
        ) {
          const noError = commitAllWork(pendingCommit);
          if (!noError) {
            // There was an error during the commit phase. Restart the outer
            // loop so we can switch to the slower version of the work loop that
            // checks for failed work.
            continue outer;
          }
        } else if (nextUnitOfWork && nextPriorityLevel !== NoWork && nextPriorityLevel <= priorityLevel) {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        } else {
          return;
        }
      }
    }
  }

  function deferredWorkLoop(deadline) {
    outer: while (true) {
      if (!nextUnitOfWork) {
        nextUnitOfWork = findNextUnitOfWork();
      }

      // If there are errors, use a forked version of performUnitOfWork
      if (capturedErrors && capturedErrors.size) {
        while (true) {
          if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
            if (!nextUnitOfWork && !pendingCommit) {
              nextUnitOfWork = findNextUnitOfWork();
            }
            if (pendingCommit) {
              commitAllWork(pendingCommit);
            } else if (nextUnitOfWork) {
              if (isFailedWork(nextUnitOfWork)) {
                nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
              } else {
                nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
              }
            } else {
              return;
            }
          } else {
            return;
          }
        }
      }

      // Otherwise, handle the normal, faster case where there are no errors:
      while (true) {
        if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
          if (!nextUnitOfWork && !pendingCommit) {
            nextUnitOfWork = findNextUnitOfWork();
          }
          if (pendingCommit) {
            const noError = commitAllWork(pendingCommit);
            if (!noError) {
              // There was an error during the commit phase. Restart the outer
              // loop so we can switch to the slower version of the work loop that
              // checks for failed work.
              continue outer;
            }
          } else if (nextUnitOfWork) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
          } else {
            return;
          }
        } else {
          return;
        }
      }
    }
  }

  function performWork(priorityLevel : PriorityLevel, deadline : null | Deadline) {
    if (isPerformingWork) {
      throw new Error('performWork was called recursively.');
    }
    isPerformingWork = true;
    isPerformingDeferredWork = priorityLevel >= HighPriority;

    // Perform work until either there's no more work at this priority level, or
    // (in the case of deferred work) we've run out of time.
    while (true) {
      try {
        // Functions that contain a try-catch block are not optimizable by the
        // JS engine. The hottest code paths have been extracted to separate
        // functions, workLoop and deferredWorkLoop, which run on every unit of
        // work. The loop we're in now runs infrequently: to flush task work at
        // the end of a frame, or to restart after an error.
        while (priorityLevel !== NoWork) {
          if (priorityLevel >= HighPriority) {
            if (!deadline) {
              throw new Error('Cannot perform deferred work without a deadline.');
            }
            // The deferred work loop will run until there's no time left in
            // the current frame
            deferredWorkLoop(deadline);
          } else {
            // The non-deferred work loop will run until there's no more work
            // at the given priority level
            workLoop(priorityLevel);
          }

          // Stop performing work
          priorityLevel = NoWork;

          // There might still be work left. Depending on the priority, we should
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
      } catch (error) {
        // We caught an error during either the begin or complete phases.
        const failedWork = nextUnitOfWork;

        // "Capture" the error by finding the nearest boundary. If there is no
        // error boundary, the nearest host container acts as one.
        const maybeBoundary = captureError(failedWork, error);
        if (maybeBoundary) {
          const boundary = maybeBoundary;

          // Complete the boundary as if it rendered null.
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
        }
        // Continue performing work
        continue;
      }
      break;
    }

    // We're done performing work. Time to clean up.
    isPerformingWork = false;
    isPerformingDeferredWork = false;
    if (capturedErrors && !capturedErrors.size) {
      capturedErrors = null;
    }

    // It's now safe to throw the first uncaught error.
    if (firstUncaughtError) {
      let e = firstUncaughtError;
      firstUncaughtError = null;
      throw e;
    }
  }

  // Returns the boundary that captured the error, or null if the error is ignored
  function captureError(failedWork : Fiber | null, error : Error) : Fiber | null {
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
      if (!isFailedWork(boundary)) {
        capturedErrors.set(boundary, error);
        // If we're in the commit phase, defer scheduling an update on the
        // boundary until after the commit is complete
        if (isCommitting) {
          if (!commitPhaseBoundaries) {
            commitPhaseBoundaries = new Set();
          }
          commitPhaseBoundaries.add(boundary);
        } else {
          // Otherwise, schedule an update now. Error recovery has Task priority.
          const previousPriorityContext = priorityContext;
          priorityContext = TaskPriority;
          scheduleUpdate(boundary);
          priorityContext = previousPriorityContext;
        }
      }
      return boundary;
    } else if (!firstUncaughtError) {
      // If no boundary is found, we'll need to throw the error
      firstUncaughtError = error;
    }
    return null;
  }

  function isFailedWork(fiber : Fiber) : boolean {
    return Boolean(
      capturedErrors &&
      (capturedErrors.has(fiber) || (fiber.alternate && capturedErrors.has(fiber.alternate)))
    );
  }

  function commitErrorHandling(effectfulFiber : Fiber) {
    let error;
    if (capturedErrors) {
      error = capturedErrors.get(effectfulFiber);
      capturedErrors.delete(effectfulFiber);
      if (!error) {
        if (effectfulFiber.alternate) {
          effectfulFiber = effectfulFiber.alternate;
          error = capturedErrors.get(effectfulFiber);
          capturedErrors.delete(effectfulFiber);
        }
      }
    }

    if (!error) {
      throw new Error('No error for given unit of work.');
    }

    switch (effectfulFiber.tag) {
      case ClassComponent:
        const instance = effectfulFiber.stateNode;
        // Allow the boundary to handle the error, usually by scheduling
        // an update to itself
        instance.unstable_handleError(error);
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
    if (priorityLevel === SynchronousPriority && isPerformingWork) {
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
    if (root.current.alternate) {
      if (root.current.alternate.pendingWorkPriority === NoWork ||
          priorityLevel <= root.current.alternate.pendingWorkPriority) {
        root.current.alternate.pendingWorkPriority = priorityLevel;
      }
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

    if (priorityLevel <= nextPriorityLevel) {
      // We must reset the current unit of work pointer so that we restart the
      // search from the root during the next tick, in case there is now higher
      // priority work somewhere earlier than before.
      nextUnitOfWork = null;
    }

    // Depending on the priority level, either perform work now or schedule
    // a callback to perform work later.
    switch (priorityLevel) {
      case SynchronousPriority:
        // Perform work immediately
        performWork(SynchronousPriority);
        return;
      case TaskPriority:
        // If we're already performing work, Task work will be flushed before
        // exiting the current batch. So we can skip it here.
        if (!isPerformingWork) {
          performWork(TaskPriority);
        }
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
    // If we're in a batch, downgrade sync priority to task priority
    if (priorityLevel === SynchronousPriority && isPerformingWork) {
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
    const previousIsPerformingWork = isPerformingWork;
    // Simulate that we're performing work so that sync work is batched
    isPerformingWork = true;
    try {
      return fn(a);
    } finally {
      isPerformingWork = previousIsPerformingWork;
      // If we're not already performing work, we need to flush any task work
      // that was created by the user-provided function.
      if (!isPerformingWork) {
        performWork(TaskPriority);
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
