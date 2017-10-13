/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberScheduler
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';
import type {HostConfig, Deadline} from 'ReactFiberReconciler';
import type {HydrationContext} from 'ReactFiberHydrationContext';
import type {ExpirationTime} from 'ReactFiberExpirationTime';

export type CapturedError = {
  componentName: ?string,
  componentStack: string,
  error: mixed,
  errorBoundary: ?Object,
  errorBoundaryFound: boolean,
  errorBoundaryName: string | null,
  willRetry: boolean,
};

export type HandleErrorInfo = {
  componentStack: string,
};

var {popContextProvider} = require('ReactFiberContext');
const {reset} = require('ReactFiberStack');
var {
  getStackAddendumByWorkInProgressFiber,
} = require('ReactFiberComponentTreeHook');
var {logCapturedError} = require('ReactFiberErrorLogger');
var {
  invokeGuardedCallback,
  hasCaughtError,
  clearCaughtError,
} = require('ReactErrorUtils');

var ReactFiberBeginWork = require('ReactFiberBeginWork');
var ReactFiberCompleteWork = require('ReactFiberCompleteWork');
var ReactFiberCommitWork = require('ReactFiberCommitWork');
var ReactFiberHostContext = require('ReactFiberHostContext');
var ReactFiberHydrationContext = require('ReactFiberHydrationContext');
var {ReactCurrentOwner} = require('ReactGlobalSharedState');
var getComponentName = require('getComponentName');

var {createWorkInProgress} = require('ReactFiber');
var {onCommitRoot} = require('ReactFiberDevToolsHook');

var {
  NoWork,
  Task,
  Sync,
  Never,
  msToExpirationTime,
  asyncExpirationTime,
  relativeExpirationTime,
} = require('ReactFiberExpirationTime');

var {AsyncUpdates} = require('ReactTypeOfInternalContext');

var {
  PerformedWork,
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

var {getUpdateExpirationTime} = require('ReactFiberUpdateQueue');

var {resetContext} = require('ReactFiberContext');

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
    stopFailedWorkTimer,
    startWorkLoopTimer,
    stopWorkLoopTimer,
    startCommitTimer,
    stopCommitTimer,
    startCommitHostEffectsTimer,
    stopCommitHostEffectsTimer,
    startCommitLifeCyclesTimer,
    stopCommitLifeCyclesTimer,
  } = require('ReactDebugFiberPerf');

  var didWarnAboutStateTransition = false;

  var warnAboutUpdateOnUnmounted = function(
    instance: React$ComponentType<any>,
  ) {
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

  var warnAboutInvalidUpdates = function(instance: React$ComponentType<any>) {
    switch (ReactDebugCurrentFiber.phase) {
      case 'getChildContext':
        warning(
          false,
          'setState(...): Cannot call setState() inside getChildContext()',
        );
        break;
      case 'render':
        if (didWarnAboutStateTransition) {
          return;
        }
        didWarnAboutStateTransition = true;
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
  const hydrationContext: HydrationContext<C, CX> = ReactFiberHydrationContext(
    config,
  );
  const {popHostContainer, popHostContext, resetHostContainer} = hostContext;
  const {beginWork, beginFailedWork} = ReactFiberBeginWork(
    config,
    hostContext,
    hydrationContext,
    scheduleUpdate,
    getExpirationTime,
  );
  const {completeWork} = ReactFiberCompleteWork(
    config,
    hostContext,
    hydrationContext,
  );
  const {
    commitPlacement,
    commitDeletion,
    commitWork,
    commitLifeCycles,
    commitAttachRef,
    commitDetachRef,
  } = ReactFiberCommitWork(config, captureError);
  const {
    now,
    scheduleDeferredCallback,
    useSyncScheduling,
    prepareForCommit,
    resetAfterCommit,
  } = config;

  // Represents the current time in ms.
  const startTime = now();
  let mostRecentCurrentTime: ExpirationTime = msToExpirationTime(0);

  // Represents the expiration time that incoming updates should use. (If this
  // is NoWork, use the default strategy: async updates in async mode, sync
  // updates in sync mode.)
  let expirationContext: ExpirationTime = NoWork;

  // Keeps track of whether we're currently in a work loop.
  let isPerformingWork: boolean = false;

  // Keeps track of whether the current deadline has expired.
  let deadlineHasExpired: boolean = false;

  // Keeps track of whether we should should batch sync updates.
  let isBatchingUpdates: boolean = false;

  // This is needed for the weird case where the initial mount is synchronous
  // even inside batchedUpdates :(
  let isUnbatchingUpdates: boolean = false;

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork: Fiber | null = null;
  // The time at which we're currently rendering work.
  let nextRenderExpirationTime: ExpirationTime = NoWork;

  // The next fiber with an effect that we're currently committing.
  let nextEffect: Fiber | null = null;

  let pendingCommit: Fiber | null = null;

  // Linked list of roots with scheduled work on them.
  let nextScheduledRoot: FiberRoot | null = null;
  let lastScheduledRoot: FiberRoot | null = null;

  // Keep track of which host environment callbacks are scheduled.
  let isCallbackScheduled: boolean = false;

  // Keep track of which fibers have captured an error that need to be handled.
  // Work is removed from this collection after componentDidCatch is called.
  let capturedErrors: Map<Fiber, CapturedError> | null = null;
  // Keep track of which fibers have failed during the current batch of work.
  // This is a different set than capturedErrors, because it is not reset until
  // the end of the batch. This is needed to propagate errors correctly if a
  // subtree fails more than once.
  let failedBoundaries: Set<Fiber> | null = null;
  // Error boundaries that captured an error during the current commit.
  let commitPhaseBoundaries: Set<Fiber> | null = null;
  let firstUncaughtError: mixed | null = null;
  let didFatal: boolean = false;

  let isCommitting: boolean = false;
  let isUnmounting: boolean = false;

  // Use these to prevent an infinite loop of nested updates
  const NESTED_UPDATE_LIMIT = 1000;
  let nestedUpdateCount: number = 0;
  let nextRenderedTree: FiberRoot | null = null;

  function resetContextStack() {
    // Reset the stack
    reset();
    // Reset the cursors
    resetContext();
    resetHostContainer();
  }

  function resetNextUnitOfWork() {
    // Clear out roots with no more work on them, or if they have uncaught errors
    while (
      nextScheduledRoot !== null &&
      nextScheduledRoot.current.expirationTime === NoWork
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
        nextRenderExpirationTime = NoWork;
        return null;
      }
      // Continue with the next root.
      // If there's no work on it, it will get unscheduled too.
      nextScheduledRoot = next;
    }

    let root = nextScheduledRoot;
    let earliestExpirationRoot = null;
    let earliestExpirationTime = NoWork;
    while (root !== null) {
      if (
        root.current.expirationTime !== NoWork &&
        (earliestExpirationTime === NoWork ||
          earliestExpirationTime > root.current.expirationTime)
      ) {
        earliestExpirationTime = root.current.expirationTime;
        earliestExpirationRoot = root;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
    }
    if (earliestExpirationRoot !== null) {
      nextRenderExpirationTime = earliestExpirationTime;
      // Before we start any new work, let's make sure that we have a fresh
      // stack to work from.
      // TODO: This call is buried a bit too deep. It would be nice to have
      // a single point which happens right before any new work and
      // unfortunately this is it.
      resetContextStack();

      nextUnitOfWork = createWorkInProgress(
        earliestExpirationRoot.current,
        earliestExpirationTime,
      );
      if (earliestExpirationRoot !== nextRenderedTree) {
        // We've switched trees. Reset the nested update counter.
        nestedUpdateCount = 0;
        nextRenderedTree = earliestExpirationRoot;
      }
      return;
    }

    nextRenderExpirationTime = NoWork;
    nextUnitOfWork = null;
    nextRenderedTree = null;
    return;
  }

  function commitAllHostEffects() {
    while (nextEffect !== null) {
      if (__DEV__) {
        ReactDebugCurrentFiber.setCurrentFiber(nextEffect);
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
      let primaryEffectTag =
        effectTag & ~(Callback | Err | ContentReset | Ref | PerformedWork);
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
      ReactDebugCurrentFiber.resetCurrentFiber();
    }
  }

  function commitAllLifeCycles() {
    while (nextEffect !== null) {
      const effectTag = nextEffect.effectTag;

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

    if (nextRenderExpirationTime <= mostRecentCurrentTime) {
      // Keep track of the number of iterations to prevent an infinite
      // update loop.
      nestedUpdateCount++;
    }

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    let firstEffect;
    if (finishedWork.effectTag > PerformedWork) {
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

    prepareForCommit();

    // Commit all the side-effects within a tree. We'll do this in two passes.
    // The first pass performs all the host insertions, updates, deletions and
    // ref unmounts.
    nextEffect = firstEffect;
    if (__DEV__) {
      startCommitHostEffectsTimer();
    }
    while (nextEffect !== null) {
      let didError = false;
      let error;
      if (__DEV__) {
        invokeGuardedCallback(null, commitAllHostEffects, null);
        if (hasCaughtError()) {
          didError = true;
          error = clearCaughtError();
        }
      } else {
        try {
          commitAllHostEffects();
        } catch (e) {
          didError = true;
          error = e;
        }
      }
      if (didError) {
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

    resetAfterCommit();

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
      let didError = false;
      let error;
      if (__DEV__) {
        invokeGuardedCallback(null, commitAllLifeCycles, null);
        if (hasCaughtError()) {
          didError = true;
          error = clearCaughtError();
        }
      } else {
        try {
          commitAllLifeCycles();
        } catch (e) {
          didError = true;
          error = e;
        }
      }
      if (didError) {
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

    // This tree is done. Reset the unit of work pointer to the root that
    // expires soonest. If there's no work left, the pointer is set to null.
    resetNextUnitOfWork();
  }

  function resetExpirationTime(
    workInProgress: Fiber,
    renderTime: ExpirationTime,
  ) {
    if (renderTime !== Never && workInProgress.expirationTime === Never) {
      // The children of this component are hidden. Don't bubble their
      // expiration times.
      return;
    }

    // Check for pending updates.
    let newExpirationTime = getUpdateExpirationTime(workInProgress);

    // TODO: Coroutines need to visit stateNode

    // Bubble up the earliest expiration time.
    let child = workInProgress.child;
    while (child !== null) {
      if (
        child.expirationTime !== NoWork &&
        (newExpirationTime === NoWork ||
          newExpirationTime > child.expirationTime)
      ) {
        newExpirationTime = child.expirationTime;
      }
      child = child.sibling;
    }
    workInProgress.expirationTime = newExpirationTime;
  }

  function completeUnitOfWork(workInProgress: Fiber): Fiber | null {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      const current = workInProgress.alternate;
      if (__DEV__) {
        ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
      }
      const next = completeWork(
        current,
        workInProgress,
        nextRenderExpirationTime,
      );
      if (__DEV__) {
        ReactDebugCurrentFiber.resetCurrentFiber();
      }

      const returnFiber = workInProgress.return;
      const siblingFiber = workInProgress.sibling;

      resetExpirationTime(workInProgress, nextRenderExpirationTime);

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
        const effectTag = workInProgress.effectTag;
        // Skip both NoWork and PerformedWork tags when creating the effect list.
        // PerformedWork effect is read by React DevTools but shouldn't be committed.
        if (effectTag > PerformedWork) {
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
        // We've reached the root. Mark the root as pending commit. Depending
        // on how much time we have left, we'll either commit it now or in
        // the next frame.
        pendingCommit = workInProgress;
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
      ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
    }
    let next = beginWork(current, workInProgress, nextRenderExpirationTime);
    if (__DEV__) {
      ReactDebugCurrentFiber.resetCurrentFiber();
    }
    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;

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
      ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
    }
    let next = beginFailedWork(
      current,
      workInProgress,
      nextRenderExpirationTime,
    );
    if (__DEV__) {
      ReactDebugCurrentFiber.resetCurrentFiber();
    }
    if (__DEV__ && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;

    return next;
  }

  function performDeferredWork(deadline: Deadline) {
    performWork(Never, deadline);
  }

  function handleCommitPhaseErrors() {
    // This is a special work loop for handling commit phase errors. It's
    // similar to the syncrhonous work loop, but does an additional check on
    // each fiber to see if it's an error boundary with an unhandled error. If
    // so, it uses a forked version of performUnitOfWork that unmounts the
    // failed subtree.
    //
    // The loop stops once the children have unmounted and error lifecycles are
    // called. Then we return to the regular flow.

    if (
      capturedErrors !== null &&
      capturedErrors.size > 0 &&
      nextRenderExpirationTime !== NoWork &&
      nextRenderExpirationTime <= mostRecentCurrentTime
    ) {
      while (nextUnitOfWork !== null) {
        if (hasCapturedError(nextUnitOfWork)) {
          // Use a forked version of performUnitOfWork
          nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
        } else {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
        if (nextUnitOfWork === null) {
          invariant(
            pendingCommit !== null,
            'Should have a pending commit. This error is likely caused by ' +
              'a bug in React. Please file an issue.',
          );
          // We just completed a root. Commit it now.
          commitAllWork(pendingCommit);
          if (
            capturedErrors === null ||
            capturedErrors.size === 0 ||
            nextRenderExpirationTime === NoWork ||
            nextRenderExpirationTime > mostRecentCurrentTime
          ) {
            // There are no more unhandled errors. We can exit this special
            // work loop. If there's still additional work, we'll perform it
            // using one of the normal work loops.
            break;
          }
          // The commit phase produced additional errors. Continue working.
        }
      }
    }
  }

  function workLoop(
    minExpirationTime: ExpirationTime,
    deadline: Deadline | null,
  ) {
    loop: do {
      if (pendingCommit !== null) {
        commitAllWork(pendingCommit);
        handleCommitPhaseErrors();
      } else if (nextUnitOfWork === null) {
        resetNextUnitOfWork();
      }

      if (
        nextRenderExpirationTime === NoWork ||
        nextRenderExpirationTime > minExpirationTime
      ) {
        return;
      }

      if (nextRenderExpirationTime <= mostRecentCurrentTime) {
        // Flush all expired work.
        while (nextUnitOfWork !== null) {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
          if (nextUnitOfWork === null) {
            invariant(
              pendingCommit !== null,
              'Should have a pending commit. This error is likely caused by ' +
                'a bug in React. Please file an issue.',
            );
            // We just completed a root. Commit it now.
            commitAllWork(pendingCommit);
            // Clear any errors that were scheduled during the commit phase.
            handleCommitPhaseErrors();
            // The render time may have changed. Check again.
            if (
              nextRenderExpirationTime === NoWork ||
              nextRenderExpirationTime > minExpirationTime ||
              nextRenderExpirationTime > mostRecentCurrentTime
            ) {
              // We've completed all the expired work.
              break;
            }
          }
        }
      } else if (deadline !== null) {
        // Flush asynchronous work until the deadline runs out of time.
        while (nextUnitOfWork !== null && !deadlineHasExpired) {
          if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
            // In a deferred work batch, iff nextUnitOfWork returns null, we just
            // completed a root and a pendingCommit exists. Logically, we could
            // omit either of the checks in the following condition, but we need
            // both to satisfy Flow.
            if (nextUnitOfWork === null) {
              invariant(
                pendingCommit !== null,
                'Should have a pending commit. This error is likely caused by ' +
                  'a bug in React. Please file an issue.',
              );
              // We just completed a root. If we have time, commit it now.
              // Otherwise, we'll commit it in the next frame.
              if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
                commitAllWork(pendingCommit);
                // Clear any errors that were scheduled during the commit phase.
                handleCommitPhaseErrors();
                // The render time may have changed. Check again.
                if (
                  nextRenderExpirationTime === NoWork ||
                  nextRenderExpirationTime > minExpirationTime ||
                  nextRenderExpirationTime <= mostRecentCurrentTime
                ) {
                  // We've completed all the async work.
                  break;
                }
              } else {
                deadlineHasExpired = true;
              }
            }
          } else {
            deadlineHasExpired = true;
          }
        }
      }

      // There might be work left. Depending on the priority, we should
      // either perform it now or schedule a callback to perform it later.
      const currentTime = recalculateCurrentTime();
      switch (relativeExpirationTime(currentTime, nextRenderExpirationTime)) {
        case NoWork:
          // No work left. We can exit.
          break loop;
        case Sync:
        case Task:
          // We have remaining synchronous or task work. Keep performing it,
          // regardless of whether we're inside a callback.
          if (nextRenderExpirationTime <= minExpirationTime) {
            // Sometimes minExpirationTime is Sync, which means we should skip
            // task work.
            continue loop;
          }
          break loop;
        default:
          // We have remaining async work.
          if (deadline === null) {
            // We're not inside a callback. Exit and perform the work during
            // the next callback.
            break loop;
          }
          // We are inside a callback.
          if (
            !deadlineHasExpired &&
            nextRenderExpirationTime <= minExpirationTime
          ) {
            // We still have time. Keep working.
            continue loop;
          }
          // We've run out of time. Exit.
          break loop;
      }
    } while (true);
  }

  function performWorkCatchBlock(
    failedWork: Fiber,
    boundary: Fiber,
    minExpirationTime: ExpirationTime,
    deadline: Deadline | null,
  ) {
    // We're going to restart the error boundary that captured the error.
    // Conceptually, we're unwinding the stack. We need to unwind the
    // context stack, too.
    unwindContexts(failedWork, boundary);

    // Restart the error boundary using a forked version of
    // performUnitOfWork that deletes the boundary's children. The entire
    // failed subree will be unmounted. During the commit phase, a special
    // lifecycle method is called on the error boundary, which triggers
    // a re-render.
    nextUnitOfWork = performFailedUnitOfWork(boundary);

    // Continue working.
    workLoop(minExpirationTime, deadline);
  }

  function performWork(
    minExpirationTime: ExpirationTime,
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

    nestedUpdateCount = 0;

    let didError = false;
    let error = null;
    if (__DEV__) {
      invokeGuardedCallback(null, workLoop, null, minExpirationTime, deadline);
      if (hasCaughtError()) {
        didError = true;
        error = clearCaughtError();
      }
    } else {
      try {
        workLoop(minExpirationTime, deadline);
      } catch (e) {
        didError = true;
        error = e;
      }
    }

    // An error was thrown during the render phase.
    while (didError) {
      if (didFatal) {
        // This was a fatal error. Don't attempt to recover from it.
        firstUncaughtError = error;
        break;
      }

      const failedWork = nextUnitOfWork;
      if (failedWork === null) {
        // An error was thrown but there's no current unit of work. This can
        // happen during the commit phase if there's a bug in the renderer.
        didFatal = true;
        continue;
      }

      // "Capture" the error by finding the nearest boundary. If there is no
      // error boundary, we use the root.
      const boundary = captureError(failedWork, error);
      invariant(
        boundary !== null,
        'Should have found an error boundary. This error is likely ' +
          'caused by a bug in React. Please file an issue.',
      );

      if (didFatal) {
        // The error we just captured was a fatal error. This happens
        // when the error propagates to the root more than once.
        continue;
      }

      didError = false;
      error = null;
      if (__DEV__) {
        invokeGuardedCallback(
          null,
          performWorkCatchBlock,
          null,
          failedWork,
          boundary,
          minExpirationTime,
          deadline,
        );
        if (hasCaughtError()) {
          didError = true;
          error = clearCaughtError();
          continue;
        }
      } else {
        try {
          performWorkCatchBlock(
            failedWork,
            boundary,
            minExpirationTime,
            deadline,
          );
          error = null;
        } catch (e) {
          didError = true;
          error = e;
          continue;
        }
      }
      // We're finished working. Exit the error loop.
      break;
    }

    // If we're inside a callback, set this to false, since we just flushed it.
    if (deadline !== null) {
      isCallbackScheduled = false;
    }
    // If there's remaining async work, make sure we schedule another callback.
    if (
      nextRenderExpirationTime > mostRecentCurrentTime &&
      !isCallbackScheduled
    ) {
      scheduleDeferredCallback(performDeferredWork);
      isCallbackScheduled = true;
    }

    const errorToThrow = firstUncaughtError;

    // We're done performing work. Time to clean up.
    isPerformingWork = false;
    deadlineHasExpired = false;
    didFatal = false;
    firstUncaughtError = null;
    capturedErrors = null;
    failedBoundaries = null;
    nextRenderedTree = null;
    nestedUpdateCount = 0;

    if (__DEV__) {
      stopWorkLoopTimer();
    }

    // It's safe to throw any unhandled errors.
    if (errorToThrow !== null) {
      throw errorToThrow;
    }
  }

  // Returns the boundary that captured the error, or null if the error is ignored
  function captureError(failedWork: Fiber, error: mixed): Fiber | null {
    // It is no longer valid because we exited the user code.
    ReactCurrentOwner.current = null;
    if (__DEV__) {
      ReactDebugCurrentFiber.resetCurrentFiber();
    }

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
        didFatal = true;
      }
    } else {
      let node = failedWork.return;
      while (node !== null && boundary === null) {
        if (node.tag === ClassComponent) {
          const instance = node.stateNode;
          if (typeof instance.componentDidCatch === 'function') {
            errorBoundaryFound = true;
            errorBoundaryName = getComponentName(node);

            // Found an error boundary!
            boundary = node;
            willRetry = true;
          }
        } else if (node.tag === HostRoot) {
          // Treat the root like a no-op error boundary
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

      const capturedError = {
        componentName,
        componentStack,
        error,
        errorBoundary: errorBoundaryFound ? boundary.stateNode : null,
        errorBoundaryFound,
        errorBoundaryName,
        willRetry,
      };

      capturedErrors.set(boundary, capturedError);

      try {
        logCapturedError(capturedError);
      } catch (e) {
        // Prevent cycle if logCapturedError() throws.
        // A cycle may still occur if logCapturedError renders a component that throws.
        console.error(e);
      }

      // If we're in the commit phase, defer scheduling an update on the
      // boundary until after the commit is complete
      if (isCommitting) {
        if (commitPhaseBoundaries === null) {
          commitPhaseBoundaries = new Set();
        }
        commitPhaseBoundaries.add(boundary);
      } else {
        // Otherwise, schedule an update now.
        // TODO: Is this actually necessary during the render phase? Is it
        // possible to unwind and continue rendering at the same priority,
        // without corrupting internal state?
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
    return (
      capturedErrors !== null &&
      (capturedErrors.has(fiber) ||
        (fiber.alternate !== null && capturedErrors.has(fiber.alternate)))
    );
  }

  function isFailedBoundary(fiber: Fiber): boolean {
    // TODO: failedBoundaries should store the boundary instance, to avoid
    // needing to check the alternate.
    return (
      failedBoundaries !== null &&
      (failedBoundaries.has(fiber) ||
        (fiber.alternate !== null && failedBoundaries.has(fiber.alternate)))
    );
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

    switch (effectfulFiber.tag) {
      case ClassComponent:
        const instance = effectfulFiber.stateNode;

        const info: HandleErrorInfo = {
          componentStack: capturedError.componentStack,
        };

        // Allow the boundary to handle the error, usually by scheduling
        // an update to itself
        instance.componentDidCatch(capturedError.error, info);
        return;
      case HostRoot:
        if (firstUncaughtError === null) {
          // If this is the host container, we treat it as a no-op error
          // boundary. We'll throw the first uncaught error once it's safe to
          // do so, at the end of the batch.
          firstUncaughtError = capturedError.error;
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
    while (node !== null) {
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
      if (node === to || node.alternate === to) {
        if (__DEV__) {
          stopFailedWorkTimer(node);
        }
        break;
      } else if (__DEV__) {
        stopWorkTimer(node);
      }
      node = node.return;
    }
  }

  function scheduleRoot(root: FiberRoot, expirationTime: ExpirationTime) {
    if (expirationTime === NoWork) {
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

  function scheduleUpdate(fiber: Fiber, expirationTime: ExpirationTime) {
    return scheduleUpdateImpl(fiber, expirationTime, false);
  }

  function scheduleUpdateImpl(
    fiber: Fiber,
    expirationTime: ExpirationTime,
    isErrorRecovery: boolean,
  ) {
    if (__DEV__) {
      recordScheduleUpdate();
    }

    if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
      didFatal = true;
      invariant(
        false,
        'Maximum update depth exceeded. This can happen when a ' +
          'component repeatedly calls setState inside componentWillUpdate or ' +
          'componentDidUpdate. React limits the number of nested updates to ' +
          'prevent infinite loops.',
      );
    }

    if (!isPerformingWork && expirationTime <= nextRenderExpirationTime) {
      // We must reset the current unit of work pointer so that we restart the
      // search from the root during the next tick, in case there is now higher
      // priority work somewhere earlier than before.
      nextUnitOfWork = null;
    }

    if (__DEV__) {
      if (!isErrorRecovery && fiber.tag === ClassComponent) {
        const instance = fiber.stateNode;
        warnAboutInvalidUpdates(instance);
      }
    }

    let node = fiber;
    let shouldContinue = true;
    while (node !== null && shouldContinue) {
      // Walk the parent path to the root and update each node's expiration
      // time. Once we reach a node whose expiration matches (and whose
      // alternate's expiration matches) we can exit safely knowing that the
      // rest of the path is correct.
      shouldContinue = false;
      if (
        node.expirationTime === NoWork ||
        node.expirationTime > expirationTime
      ) {
        // Expiration time did not match. Update and keep going.
        shouldContinue = true;
        node.expirationTime = expirationTime;
      }
      if (node.alternate !== null) {
        if (
          node.alternate.expirationTime === NoWork ||
          node.alternate.expirationTime > expirationTime
        ) {
          // Expiration time did not match. Update and keep going.
          shouldContinue = true;
          node.alternate.expirationTime = expirationTime;
        }
      }
      if (node.return === null) {
        if (node.tag === HostRoot) {
          const root: FiberRoot = (node.stateNode: any);
          scheduleRoot(root, expirationTime);
          if (!isPerformingWork) {
            switch (expirationTime) {
              case Sync:
                if (isUnbatchingUpdates) {
                  // We're inside unbatchedUpdates, which is inside either
                  // batchedUpdates or a lifecycle. We should only flush
                  // synchronous work, not task work.
                  performWork(Sync, null);
                } else {
                  // Flush both synchronous and task work.
                  performWork(Task, null);
                }
                break;
              case Task:
                invariant(
                  isBatchingUpdates,
                  'Task updates can only be scheduled as a nested update or ' +
                    'inside batchedUpdates. This error is likely caused by a ' +
                    'bug in React. Please file an issue.',
                );
                break;
              default:
                // This update is async. Schedule a callback.
                if (!isCallbackScheduled) {
                  scheduleDeferredCallback(performDeferredWork);
                  isCallbackScheduled = true;
                }
            }
          }
        } else {
          if (__DEV__) {
            if (!isErrorRecovery && fiber.tag === ClassComponent) {
              warnAboutUpdateOnUnmounted(fiber.stateNode);
            }
          }
          return;
        }
      }
      node = node.return;
    }
  }

  function getExpirationTime(
    fiber: Fiber,
    forceAsync: boolean,
  ): ExpirationTime {
    let expirationTime;
    if (expirationContext !== NoWork) {
      // An explicit expiration context was set;
      expirationTime = expirationContext;
    } else if (isPerformingWork) {
      if (isCommitting) {
        // Updates that occur during the commit phase should have task priority
        // by default.
        expirationTime = Sync;
      } else {
        // Updates during the render phase should expire at the same time as
        // the work that is being rendered.
        expirationTime = nextRenderExpirationTime;
      }
    } else {
      // No explicit expiration context was set, and we're not currently
      // performing work. Calculate a new expiration time.
      if (
        useSyncScheduling &&
        !(fiber.internalContextTag & AsyncUpdates) &&
        !forceAsync
      ) {
        // This is a sync update
        expirationTime = Sync;
      } else {
        // This is an async update
        const currentTime = recalculateCurrentTime();
        expirationTime = asyncExpirationTime(currentTime);
      }
    }

    if (
      expirationTime === Sync &&
      (isBatchingUpdates || (isUnbatchingUpdates && isCommitting))
    ) {
      // If we're in a batch, or in the commit phase, downgrade sync to task
      return Task;
    }
    return expirationTime;
  }

  function scheduleErrorRecovery(fiber: Fiber) {
    scheduleUpdateImpl(fiber, Task, true);
  }

  function recalculateCurrentTime(): ExpirationTime {
    // Subtract initial time so it fits inside 32bits
    const ms = now() - startTime;
    mostRecentCurrentTime = msToExpirationTime(ms);
    return mostRecentCurrentTime;
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
        performWork(Task, null);
      }
    }
  }

  function unbatchedUpdates<A>(fn: () => A): A {
    const previousIsUnbatchingUpdates = isUnbatchingUpdates;
    const previousIsBatchingUpdates = isBatchingUpdates;
    // This is only true if we're nested inside batchedUpdates.
    isUnbatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = false;
    try {
      return fn();
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      isUnbatchingUpdates = previousIsUnbatchingUpdates;
    }
  }

  function flushSync<A>(batch: () => A): A {
    const previousIsBatchingUpdates = isBatchingUpdates;
    const previousExpirationContext = expirationContext;
    isBatchingUpdates = true;
    expirationContext = Sync;
    try {
      return batch();
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      expirationContext = previousExpirationContext;

      invariant(
        !isPerformingWork,
        'flushSync was called from inside a lifecycle method. It cannot be ' +
          'called when React is already rendering.',
      );
      performWork(Task, null);
    }
  }

  function deferredUpdates<A>(fn: () => A): A {
    const previousExpirationContext = expirationContext;
    const currentTime = recalculateCurrentTime();
    expirationContext = asyncExpirationTime(currentTime);
    try {
      return fn();
    } finally {
      expirationContext = previousExpirationContext;
    }
  }

  return {
    scheduleUpdate: scheduleUpdate,
    getExpirationTime: getExpirationTime,
    batchedUpdates: batchedUpdates,
    unbatchedUpdates: unbatchedUpdates,
    flushSync: flushSync,
    deferredUpdates: deferredUpdates,
  };
};
