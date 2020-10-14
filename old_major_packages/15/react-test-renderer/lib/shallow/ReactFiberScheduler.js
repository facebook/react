/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactFiberBeginWork = require('./ReactFiberBeginWork');
var ReactFiberCompleteWork = require('./ReactFiberCompleteWork');
var ReactFiberCommitWork = require('./ReactFiberCommitWork');

var _require = require('./ReactFiber'),
    cloneFiber = _require.cloneFiber;

var _require2 = require('./ReactPriorityLevel'),
    NoWork = _require2.NoWork,
    LowPriority = _require2.LowPriority,
    AnimationPriority = _require2.AnimationPriority,
    SynchronousPriority = _require2.SynchronousPriority;

var timeHeuristicForUnitOfWork = 1;

module.exports = function (config) {
  // Use a closure to circumvent the circular dependency between the scheduler
  // and ReactFiberBeginWork. Don't know if there's a better way to do this.
  var scheduler = void 0;
  function getScheduler() {
    return scheduler;
  }

  var _ReactFiberBeginWork = ReactFiberBeginWork(config, getScheduler),
      beginWork = _ReactFiberBeginWork.beginWork;

  var _ReactFiberCompleteWo = ReactFiberCompleteWork(config),
      completeWork = _ReactFiberCompleteWo.completeWork;

  var _ReactFiberCommitWork = ReactFiberCommitWork(config),
      commitWork = _ReactFiberCommitWork.commitWork;

  var scheduleAnimationCallback = config.scheduleAnimationCallback;
  var scheduleDeferredCallback = config.scheduleDeferredCallback;

  // The default priority to use for updates.
  var defaultPriority = LowPriority;

  // The next work in progress fiber that we're currently working on.
  var nextUnitOfWork = null;
  var nextPriorityLevel = NoWork;

  // Linked list of roots with scheduled work on them.
  var nextScheduledRoot = null;
  var lastScheduledRoot = null;

  function findNextUnitOfWork() {
    // Clear out roots with no more work on them.
    while (nextScheduledRoot && nextScheduledRoot.current.pendingWorkPriority === NoWork) {
      nextScheduledRoot.isScheduled = false;
      if (nextScheduledRoot === lastScheduledRoot) {
        nextScheduledRoot = null;
        lastScheduledRoot = null;
        nextPriorityLevel = NoWork;
        return null;
      }
      nextScheduledRoot = nextScheduledRoot.nextScheduledRoot;
    }
    // TODO: This is scanning one root at a time. It should be scanning all
    // roots for high priority work before moving on to lower priorities.
    var root = nextScheduledRoot;
    var highestPriorityRoot = null;
    var highestPriorityLevel = NoWork;
    while (root) {
      if (highestPriorityLevel === NoWork || highestPriorityLevel > root.current.pendingWorkPriority) {
        highestPriorityLevel = root.current.pendingWorkPriority;
        highestPriorityRoot = root;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
    }
    if (highestPriorityRoot) {
      nextPriorityLevel = highestPriorityLevel;
      return cloneFiber(highestPriorityRoot.current, highestPriorityLevel);
    }

    nextPriorityLevel = NoWork;
    return null;
  }

  function commitAllWork(finishedWork) {
    // Commit all the side-effects within a tree.
    // TODO: Error handling.
    var effectfulFiber = finishedWork.firstEffect;
    while (effectfulFiber) {
      var current = effectfulFiber.alternate;
      commitWork(current, effectfulFiber);
      var next = effectfulFiber.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      effectfulFiber.nextEffect = null;
      effectfulFiber = next;
    }
  }

  function resetWorkPriority(workInProgress) {
    var newPriority = NoWork;
    // progressedChild is going to be the child set with the highest priority.
    // Either it is the same as child, or it just bailed out because it choose
    // not to do the work.
    var child = workInProgress.progressedChild;
    while (child) {
      // Ensure that remaining work priority bubbles up.
      if (child.pendingWorkPriority !== NoWork && (newPriority === NoWork || newPriority > child.pendingWorkPriority)) {
        newPriority = child.pendingWorkPriority;
      }
      child = child.sibling;
    }
    workInProgress.pendingWorkPriority = newPriority;
  }

  function completeUnitOfWork(workInProgress) {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      var current = workInProgress.alternate;
      var next = completeWork(current, workInProgress);

      resetWorkPriority(workInProgress);

      // The work is now done. We don't need this anymore. This flags
      // to the system not to redo any work here.
      workInProgress.pendingProps = null;
      workInProgress.updateQueue = null;

      var returnFiber = workInProgress['return'];

      if (returnFiber) {
        // Ensure that the first and last effect of the parent corresponds
        // to the children's first and last effect. This probably relies on
        // children completing in order.
        if (!returnFiber.firstEffect) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }
      }

      if (next) {
        // If completing this work spawned new work, do that next.
        return next;
      } else if (workInProgress.sibling) {
        // If there is more work to do in this returnFiber, do that next.
        return workInProgress.sibling;
      } else if (returnFiber) {
        // If there's no more work in this returnFiber. Complete the returnFiber.
        workInProgress = returnFiber;
        continue;
      } else {
        // If we're at the root, there's no more work to do. We can flush it.
        var _root = workInProgress.stateNode;
        if (_root.current === workInProgress) {
          throw new Error('Cannot commit the same tree as before. This is probably a bug ' + 'related to the return field.');
        }
        _root.current = workInProgress;
        // TODO: We can be smarter here and only look for more work in the
        // "next" scheduled work since we've already scanned passed. That
        // also ensures that work scheduled during reconciliation gets deferred.
        // const hasMoreWork = workInProgress.pendingWorkPriority !== NoWork;
        commitAllWork(workInProgress);
        var nextWork = findNextUnitOfWork();
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

  function performUnitOfWork(workInProgress) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    var current = workInProgress.alternate;
    var next = beginWork(current, workInProgress, nextPriorityLevel);

    if (next) {
      // If this spawns new work, do that next.
      return next;
    } else {
      // Otherwise, complete the current work.
      return completeUnitOfWork(workInProgress);
    }
  }

  function performDeferredWork(deadline) {
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

  function scheduleDeferredWork(root, priority) {
    // We must reset the current unit of work pointer so that we restart the
    // search from the root during the next tick, in case there is now higher
    // priority work somewhere earlier than before.
    if (priority <= nextPriorityLevel) {
      nextUnitOfWork = null;
    }

    // Set the priority on the root, without deprioritizing
    if (root.current.pendingWorkPriority === NoWork || priority <= root.current.pendingWorkPriority) {
      root.current.pendingWorkPriority = priority;
    }

    if (root.isScheduled) {
      // If we're already scheduled, we can bail out.
      return;
    }
    root.isScheduled = true;
    if (lastScheduledRoot) {
      // Schedule ourselves to the end.
      lastScheduledRoot.nextScheduledRoot = root;
      lastScheduledRoot = root;
    } else {
      // We're the only work scheduled.
      nextScheduledRoot = root;
      lastScheduledRoot = root;
      scheduleDeferredCallback(performDeferredWork);
    }
  }

  function performAnimationWork() {
    // Always start from the root
    nextUnitOfWork = findNextUnitOfWork();
    while (nextUnitOfWork && nextPriorityLevel !== NoWork) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      if (!nextUnitOfWork) {
        // Keep searching for animation work until there's no more left
        nextUnitOfWork = findNextUnitOfWork();
      }
      // Stop if the next unit of work is low priority
      if (nextPriorityLevel > AnimationPriority) {
        scheduleDeferredCallback(performDeferredWork);
        return;
      }
    }
  }

  function scheduleAnimationWork(root, priorityLevel) {
    // Set the priority on the root, without deprioritizing
    if (root.current.pendingWorkPriority === NoWork || priorityLevel <= root.current.pendingWorkPriority) {
      root.current.pendingWorkPriority = priorityLevel;
    }

    if (root.isScheduled) {
      // If we're already scheduled, we can bail out.
      return;
    }
    root.isScheduled = true;
    if (lastScheduledRoot) {
      // Schedule ourselves to the end.
      lastScheduledRoot.nextScheduledRoot = root;
      lastScheduledRoot = root;
    } else {
      // We're the only work scheduled.
      nextScheduledRoot = root;
      lastScheduledRoot = root;
      scheduleAnimationCallback(performAnimationWork);
    }
  }

  function scheduleWork(root) {
    if (defaultPriority === SynchronousPriority) {
      throw new Error('Not implemented yet');
    }

    if (defaultPriority === NoWork) {
      return;
    }
    if (defaultPriority > AnimationPriority) {
      scheduleDeferredWork(root, defaultPriority);
      return;
    }
    scheduleAnimationWork(root, defaultPriority);
  }

  function performWithPriority(priorityLevel, fn) {
    var previousDefaultPriority = defaultPriority;
    defaultPriority = priorityLevel;
    try {
      fn();
    } finally {
      defaultPriority = previousDefaultPriority;
    }
  }

  scheduler = {
    scheduleWork: scheduleWork,
    scheduleDeferredWork: scheduleDeferredWork,
    performWithPriority: performWithPriority
  };
  return scheduler;
};