/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {HostConfig, Deadline} from 'react-reconciler';
import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {HydrationContext} from './ReactFiberHydrationContext';
import type {ExpirationTime} from './ReactFiberExpirationTime';

var {
  getStackAddendumByWorkInProgressFiber,
} = require('shared/ReactFiberComponentTreeHook');
var {
  invokeGuardedCallback,
  hasCaughtError,
  clearCaughtError,
} = require('shared/ReactErrorUtils');
var {ReactCurrentOwner} = require('shared/ReactGlobalSharedState');
var getComponentName = require('shared/getComponentName');
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
} = require('shared/ReactTypeOfSideEffect');
var {
  HostRoot,
  HostComponent,
  HostPortal,
  ClassComponent,
} = require('shared/ReactTypeOfWork');
var invariant = require('fbjs/lib/invariant');

var ReactFiberBeginWork = require('./ReactFiberBeginWork');
var ReactFiberCompleteWork = require('./ReactFiberCompleteWork');
var ReactFiberCommitWork = require('./ReactFiberCommitWork');
var ReactFiberHostContext = require('./ReactFiberHostContext');
var ReactFiberHydrationContext = require('./ReactFiberHydrationContext');
var {popContextProvider} = require('./ReactFiberContext');
const {reset} = require('./ReactFiberStack');
var {logCapturedError} = require('./ReactFiberErrorLogger');
var {createWorkInProgress} = require('./ReactFiber');
var {onCommitRoot} = require('./ReactFiberDevToolsHook');
var {
  NoWork,
  Sync,
  Never,
  msToExpirationTime,
  computeExpirationBucket,
} = require('./ReactFiberExpirationTime');
var {AsyncUpdates} = require('./ReactTypeOfInternalContext');
var {getUpdateExpirationTime} = require('./ReactFiberUpdateQueue');
var {resetContext} = require('./ReactFiberContext');

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

if (__DEV__) {
  var warning = require('fbjs/lib/warning');

  var ReactFiberInstrumentation = require('./ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('./ReactDebugCurrentFiber');
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
  } = require('./ReactDebugFiberPerf');

  var didWarnAboutStateTransition = false;
  var didWarnSetStateChildContext = false;
  var didWarnStateUpdateForUnmountedComponent = {};

  var warnAboutUpdateOnUnmounted = function(fiber: Fiber) {
    const componentName = getComponentName(fiber) || 'ReactClass';
    if (didWarnStateUpdateForUnmountedComponent[componentName]) {
      return;
    }
    warning(
      false,
      'Can only update a mounted or mounting ' +
        'component. This usually means you called setState, replaceState, ' +
        'or forceUpdate on an unmounted component. This is a no-op.\n\nPlease ' +
        'check the code for the %s component.',
      componentName,
    );
    didWarnStateUpdateForUnmountedComponent[componentName] = true;
  };

  var warnAboutInvalidUpdates = function(instance: React$Component<any>) {
    switch (ReactDebugCurrentFiber.phase) {
      case 'getChildContext':
        if (didWarnSetStateChildContext) {
          return;
        }
        warning(
          false,
          'setState(...): Cannot call setState() inside getChildContext()',
        );
        didWarnSetStateChildContext = true;
        break;
      case 'render':
        if (didWarnAboutStateTransition) {
          return;
        }
        warning(
          false,
          'Cannot update during an existing state transition (such as within ' +
            "`render` or another component's constructor). Render methods should " +
            'be a pure function of props and state; constructor side-effects are ' +
            'an anti-pattern, but can be moved to `componentWillMount`.',
        );
        didWarnAboutStateTransition = true;
        break;
    }
  };
}

module.exports = function<T, P, I, TI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CC, CX, PL>,
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
    scheduleWork,
    computeExpirationForFiber,
  );
  const {completeWork} = ReactFiberCompleteWork(
    config,
    hostContext,
    hydrationContext,
  );
  const {
    commitResetTextContent,
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

  let isWorking: boolean = false;

  // The next work in progress fiber that we're currently working on.
  let nextUnitOfWork: Fiber | null = null;
  let nextRoot: FiberRoot | null = null;
  // The time at which we're currently rendering work.
  let nextRenderExpirationTime: ExpirationTime = NoWork;

  // The next fiber with an effect that we're currently committing.
  let nextEffect: Fiber | null = null;

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

  function resetContextStack() {
    // Reset the stack
    reset();
    // Reset the cursors
    resetContext();
    resetHostContainer();
  }

  function commitAllHostEffects() {
    while (nextEffect !== null) {
      if (__DEV__) {
        ReactDebugCurrentFiber.setCurrentFiber(nextEffect);
        recordEffect();
      }

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

  function commitRoot(finishedWork: Fiber): ExpirationTime {
    // We keep track of this so that captureError can collect any boundaries
    // that capture an error during the commit phase. The reason these aren't
    // local to this function is because errors that occur during cWU are
    // captured elsewhere, to prevent the unmount from being interrupted.
    isWorking = true;
    isCommitting = true;
    if (__DEV__) {
      startCommitTimer();
    }

    const root: FiberRoot = finishedWork.stateNode;
    invariant(
      root.current !== finishedWork,
      'Cannot commit the same tree as before. This is probably a bug ' +
        'related to the return field. This error is likely caused by a bug ' +
        'in React. Please file an issue.',
    );
    root.isReadyForCommit = false;

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
    isWorking = false;
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

    if (firstUncaughtError !== null) {
      const error = firstUncaughtError;
      firstUncaughtError = null;
      onUncaughtError(error);
    }

    const remainingTime = root.current.expirationTime;

    if (remainingTime === NoWork) {
      capturedErrors = null;
      failedBoundaries = null;
    }

    return remainingTime;
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

    // TODO: Calls need to visit stateNode

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
        // We've reached the root.
        const root: FiberRoot = workInProgress.stateNode;
        root.isReadyForCommit = true;
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

  function workLoop(expirationTime: ExpirationTime) {
    if (capturedErrors !== null) {
      // If there are unhandled errors, switch to the slow work loop.
      // TODO: How to avoid this check in the fast path? Maybe the renderer
      // could keep track of which roots have unhandled errors and call a
      // forked version of renderRoot.
      slowWorkLoopThatChecksForFailedWork(expirationTime);
      return;
    }
    if (
      nextRenderExpirationTime === NoWork ||
      nextRenderExpirationTime > expirationTime
    ) {
      return;
    }

    if (nextRenderExpirationTime <= mostRecentCurrentTime) {
      // Flush all expired work.
      while (nextUnitOfWork !== null) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }
    } else {
      // Flush asynchronous work until the deadline runs out of time.
      while (nextUnitOfWork !== null && !shouldYield()) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }
    }
  }

  function slowWorkLoopThatChecksForFailedWork(expirationTime: ExpirationTime) {
    if (
      nextRenderExpirationTime === NoWork ||
      nextRenderExpirationTime > expirationTime
    ) {
      return;
    }

    if (nextRenderExpirationTime <= mostRecentCurrentTime) {
      // Flush all expired work.
      while (nextUnitOfWork !== null) {
        if (hasCapturedError(nextUnitOfWork)) {
          // Use a forked version of performUnitOfWork
          nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
        } else {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
      }
    } else {
      // Flush asynchronous work until the deadline runs out of time.
      while (nextUnitOfWork !== null && !shouldYield()) {
        if (hasCapturedError(nextUnitOfWork)) {
          // Use a forked version of performUnitOfWork
          nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
        } else {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
      }
    }
  }

  function renderRootCatchBlock(
    root: FiberRoot,
    failedWork: Fiber,
    boundary: Fiber,
    expirationTime: ExpirationTime,
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
    workLoop(expirationTime);
  }

  function renderRoot(
    root: FiberRoot,
    expirationTime: ExpirationTime,
  ): Fiber | null {
    if (__DEV__) {
      startWorkLoopTimer();
    }

    invariant(
      !isWorking,
      'renderRoot was called recursively. This error is likely caused ' +
        'by a bug in React. Please file an issue.',
    );
    isWorking = true;

    // We're about to mutate the work-in-progress tree. If the root was pending
    // commit, it no longer is: we'll need to complete it again.
    root.isReadyForCommit = false;

    // Check if we're starting from a fresh stack, or if we're resuming from
    // previously yielded work.
    if (
      root !== nextRoot ||
      expirationTime !== nextRenderExpirationTime ||
      nextUnitOfWork === null
    ) {
      // This is a restart. Reset the stack.
      resetContextStack();
      nextRoot = root;
      nextRenderExpirationTime = expirationTime;
      nextUnitOfWork = createWorkInProgress(
        nextRoot.current,
        null,
        expirationTime,
      );
    }

    let didError = false;
    let error = null;
    if (__DEV__) {
      invokeGuardedCallback(null, workLoop, null, expirationTime);
      if (hasCaughtError()) {
        didError = true;
        error = clearCaughtError();
      }
    } else {
      try {
        workLoop(expirationTime);
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
          renderRootCatchBlock,
          null,
          root,
          failedWork,
          boundary,
          expirationTime,
        );
        if (hasCaughtError()) {
          didError = true;
          error = clearCaughtError();
          continue;
        }
      } else {
        try {
          renderRootCatchBlock(root, failedWork, boundary, expirationTime);
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

    const uncaughtError = firstUncaughtError;

    // We're done performing work. Time to clean up.
    isWorking = false;
    didFatal = false;
    firstUncaughtError = null;

    if (__DEV__) {
      stopWorkLoopTimer();
    }

    if (uncaughtError !== null) {
      onUncaughtError(uncaughtError);
    }

    return root.isReadyForCommit ? root.current.alternate : null;
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

  function computeAsyncExpiration() {
    // Given the current clock time, returns an expiration time. We use rounding
    // to batch like updates together.
    // Should complete within ~1000ms. 1200ms max.
    const currentTime = recalculateCurrentTime();
    const expirationMs = 1000;
    const bucketSizeMs = 200;
    return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
  }

  function computeExpirationForFiber(fiber: Fiber) {
    let expirationTime;
    if (expirationContext !== NoWork) {
      // An explicit expiration context was set;
      expirationTime = expirationContext;
    } else if (isWorking) {
      if (isCommitting) {
        // Updates that occur during the commit phase should have sync priority
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
      if (useSyncScheduling && !(fiber.internalContextTag & AsyncUpdates)) {
        // This is a sync update
        expirationTime = Sync;
      } else {
        // This is an async update
        expirationTime = computeAsyncExpiration();
      }
    }
    return expirationTime;
  }

  function scheduleWork(fiber: Fiber, expirationTime: ExpirationTime) {
    return scheduleWorkImpl(fiber, expirationTime, false);
  }

  function scheduleWorkImpl(
    fiber: Fiber,
    expirationTime: ExpirationTime,
    isErrorRecovery: boolean,
  ) {
    if (__DEV__) {
      recordScheduleUpdate();
    }

    if (__DEV__) {
      if (!isErrorRecovery && fiber.tag === ClassComponent) {
        const instance = fiber.stateNode;
        warnAboutInvalidUpdates(instance);
      }
    }

    let node = fiber;
    while (node !== null) {
      // Walk the parent path to the root and update each node's
      // expiration time.
      if (
        node.expirationTime === NoWork ||
        node.expirationTime > expirationTime
      ) {
        node.expirationTime = expirationTime;
      }
      if (node.alternate !== null) {
        if (
          node.alternate.expirationTime === NoWork ||
          node.alternate.expirationTime > expirationTime
        ) {
          node.alternate.expirationTime = expirationTime;
        }
      }
      if (node.return === null) {
        if (node.tag === HostRoot) {
          const root: FiberRoot = (node.stateNode: any);
          if (
            !isWorking &&
            root === nextRoot &&
            expirationTime <= nextRenderExpirationTime
          ) {
            // This is an interruption. Restart the root from the top.
            nextRoot = null;
            nextUnitOfWork = null;
            nextRenderExpirationTime = NoWork;
          }
          requestWork(root, expirationTime);
        } else {
          if (__DEV__) {
            if (!isErrorRecovery && fiber.tag === ClassComponent) {
              warnAboutUpdateOnUnmounted(fiber);
            }
          }
          return;
        }
      }
      node = node.return;
    }
  }

  function scheduleErrorRecovery(fiber: Fiber) {
    scheduleWorkImpl(fiber, Sync, true);
  }

  function recalculateCurrentTime(): ExpirationTime {
    // Subtract initial time so it fits inside 32bits
    const ms = now() - startTime;
    mostRecentCurrentTime = msToExpirationTime(ms);
    return mostRecentCurrentTime;
  }

  function deferredUpdates<A>(fn: () => A): A {
    const previousExpirationContext = expirationContext;
    expirationContext = computeAsyncExpiration();
    try {
      return fn();
    } finally {
      expirationContext = previousExpirationContext;
    }
  }

  function syncUpdates<A>(fn: () => A): A {
    const previousExpirationContext = expirationContext;
    expirationContext = Sync;
    try {
      return fn();
    } finally {
      expirationContext = previousExpirationContext;
    }
  }

  // TODO: Everything below this is written as if it has been lifted to the
  // renderers. I'll do this in a follow-up.

  // Linked-list of roots
  let firstScheduledRoot: FiberRoot | null = null;
  let lastScheduledRoot: FiberRoot | null = null;

  let isCallbackScheduled: boolean = false;
  let isRendering: boolean = false;
  let nextFlushedRoot: FiberRoot | null = null;
  let nextFlushedExpirationTime: ExpirationTime = NoWork;
  let deadlineDidExpire: boolean = false;
  let hasUnhandledError: boolean = false;
  let unhandledError: mixed | null = null;
  let deadline: Deadline | null = null;

  let isBatchingUpdates: boolean = false;
  let isUnbatchingUpdates: boolean = false;

  // Use these to prevent an infinite loop of nested updates
  const NESTED_UPDATE_LIMIT = 1000;
  let nestedUpdateCount: number = 0;

  const timeHeuristicForUnitOfWork = 1;

  // requestWork is called by the scheduler whenever a root receives an update.
  // It's up to the renderer to call renderRoot at some point in the future.
  function requestWork(root: FiberRoot, expirationTime: ExpirationTime) {
    if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
      invariant(
        false,
        'Maximum update depth exceeded. This can happen when a ' +
          'component repeatedly calls setState inside componentWillUpdate or ' +
          'componentDidUpdate. React limits the number of nested updates to ' +
          'prevent infinite loops.',
      );
    }

    // Add the root to the schedule.
    // Check if this root is already part of the schedule.
    if (root.nextScheduledRoot === null) {
      // This root is not already scheduled. Add it.
      root.remainingExpirationTime = expirationTime;
      if (lastScheduledRoot === null) {
        firstScheduledRoot = lastScheduledRoot = root;
        root.nextScheduledRoot = root;
      } else {
        lastScheduledRoot.nextScheduledRoot = root;
        lastScheduledRoot = root;
        lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
      }
    } else {
      // This root is already scheduled, but its priority may have increased.
      const remainingExpirationTime = root.remainingExpirationTime;
      if (
        remainingExpirationTime === NoWork ||
        expirationTime < remainingExpirationTime
      ) {
        // Update the priority.
        root.remainingExpirationTime = expirationTime;
      }
    }

    if (isRendering) {
      // Prevent reentrancy. Remaining work will be scheduled at the end of
      // the currently rendering batch.
      return;
    }

    if (isBatchingUpdates) {
      // Flush work at the end of the batch.
      if (isUnbatchingUpdates) {
        // ...unless we're inside unbatchedUpdates, in which case we should
        // flush it now.
        performWorkOnRoot(root, Sync);
      }
      return;
    }

    // TODO: Get rid of Sync and use current time?
    if (expirationTime === Sync) {
      performWork(Sync, null);
    } else if (!isCallbackScheduled) {
      isCallbackScheduled = true;
      scheduleDeferredCallback(performAsyncWork);
    }
  }

  function findHighestPriorityRoot() {
    let highestPriorityWork = NoWork;
    let highestPriorityRoot = null;

    if (lastScheduledRoot !== null) {
      let previousScheduledRoot = lastScheduledRoot;
      let root = firstScheduledRoot;
      while (root !== null) {
        const remainingExpirationTime = root.remainingExpirationTime;
        if (remainingExpirationTime === NoWork) {
          // This root no longer has work. Remove it from the scheduler.

          // TODO: This check is redudant, but Flow is confused by the branch
          // below where we set lastScheduledRoot to null, even though we break
          // from the loop right after.
          invariant(
            previousScheduledRoot !== null && lastScheduledRoot !== null,
            'Should have a previous and last root. This error is likely ' +
              'caused by a bug in React. Please file an issue.',
          );
          if (root === root.nextScheduledRoot) {
            // This is the only root in the list.
            root.nextScheduledRoot = null;
            firstScheduledRoot = lastScheduledRoot = null;
            break;
          } else if (root === firstScheduledRoot) {
            // This is the first root in the list.
            const next = root.nextScheduledRoot;
            firstScheduledRoot = next;
            lastScheduledRoot.nextScheduledRoot = next;
            root.nextScheduledRoot = null;
          } else if (root === lastScheduledRoot) {
            // This is the last root in the list.
            lastScheduledRoot = previousScheduledRoot;
            lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
            root.nextScheduledRoot = null;
            break;
          } else {
            previousScheduledRoot.nextScheduledRoot = root.nextScheduledRoot;
            root.nextScheduledRoot = null;
          }
          root = previousScheduledRoot.nextScheduledRoot;
        } else {
          if (
            highestPriorityWork === NoWork ||
            remainingExpirationTime < highestPriorityWork
          ) {
            // Update the priority, if it's higher
            highestPriorityWork = remainingExpirationTime;
            highestPriorityRoot = root;
          }
          if (root === lastScheduledRoot) {
            break;
          }
          previousScheduledRoot = root;
          root = root.nextScheduledRoot;
        }
      }
    }

    // If the next root is the same as the previous root, this is a nested
    // update. To prevent an infinite loop, increment the nested update count.
    const previousFlushedRoot = nextFlushedRoot;
    if (
      previousFlushedRoot !== null &&
      previousFlushedRoot === highestPriorityRoot
    ) {
      nestedUpdateCount++;
    } else {
      // Reset whenever we switch roots.
      nestedUpdateCount = 0;
    }
    nextFlushedRoot = highestPriorityRoot;
    nextFlushedExpirationTime = highestPriorityWork;
  }

  function performAsyncWork(dl) {
    performWork(NoWork, dl);
  }

  function performWork(minExpirationTime: ExpirationTime, dl: Deadline | null) {
    deadline = dl;

    // Keep working on roots until there's no more work, or until the we reach
    // the deadlne.
    findHighestPriorityRoot();
    while (
      nextFlushedRoot !== null &&
      nextFlushedExpirationTime !== NoWork &&
      (minExpirationTime === NoWork ||
        nextFlushedExpirationTime <= minExpirationTime) &&
      !deadlineDidExpire
    ) {
      performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime);
      // Find the next highest priority work.
      findHighestPriorityRoot();
    }

    // We're done flushing work. Either we ran out of time in this callback,
    // or there's no more work left with sufficient priority.

    // If we're inside a callback, set this to false since we just completed it.
    if (deadline !== null) {
      isCallbackScheduled = false;
    }
    // If there's work left over, schedule a new callback.
    if (nextFlushedRoot !== null && !isCallbackScheduled) {
      isCallbackScheduled = true;
      scheduleDeferredCallback(performAsyncWork);
    }

    // Clean-up.
    deadline = null;
    deadlineDidExpire = false;
    nestedUpdateCount = 0;

    if (hasUnhandledError) {
      const error = unhandledError;
      unhandledError = null;
      hasUnhandledError = false;
      throw error;
    }
  }

  function performWorkOnRoot(root, expirationTime) {
    invariant(
      !isRendering,
      'performWorkOnRoot was called recursively. This error is likely caused ' +
        'by a bug in React. Please file an issue.',
    );

    isRendering = true;

    // Check if this is async work or sync/expired work.
    // TODO: Pass current time as argument to renderRoot, commitRoot
    if (expirationTime <= recalculateCurrentTime()) {
      // Flush sync work.
      let finishedWork = root.finishedWork;
      if (finishedWork !== null) {
        // This root is already complete. We can commit it.
        root.finishedWork = null;
        root.remainingExpirationTime = commitRoot(finishedWork);
      } else {
        root.finishedWork = null;
        finishedWork = renderRoot(root, expirationTime);
        if (finishedWork !== null) {
          // We've completed the root. Commit it.
          root.remainingExpirationTime = commitRoot(finishedWork);
        }
      }
    } else {
      // Flush async work.
      let finishedWork = root.finishedWork;
      if (finishedWork !== null) {
        // This root is already complete. We can commit it.
        root.finishedWork = null;
        root.remainingExpirationTime = commitRoot(finishedWork);
      } else {
        root.finishedWork = null;
        finishedWork = renderRoot(root, expirationTime);
        if (finishedWork !== null) {
          // We've completed the root. Check the deadline one more time
          // before committing.
          if (!shouldYield()) {
            // Still time left. Commit the root.
            root.remainingExpirationTime = commitRoot(finishedWork);
          } else {
            // There's no time left. Mark this root as complete. We'll come
            // back and commit it later.
            root.finishedWork = finishedWork;
          }
        }
      }
    }

    isRendering = false;
  }

  // When working on async work, the reconciler asks the renderer if it should
  // yield execution. For DOM, we implement this with requestIdleCallback.
  function shouldYield() {
    if (deadline === null) {
      return false;
    }
    if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
      return false;
    }
    deadlineDidExpire = true;
    return true;
  }

  // TODO: Not happy about this hook. Conceptually, renderRoot should return a
  // tuple of (isReadyForCommit, didError, error)
  function onUncaughtError(error) {
    invariant(
      nextFlushedRoot !== null,
      'Should be working on a root. This error is likely caused by a bug in ' +
        'React. Please file an issue.',
    );
    // Unschedule this root so we don't work on it again until there's
    // another update.
    nextFlushedRoot.remainingExpirationTime = NoWork;
    if (!hasUnhandledError) {
      hasUnhandledError = true;
      unhandledError = error;
    }
  }

  // TODO: Batching should be implemented at the renderer level, not inside
  // the reconciler.
  function batchedUpdates<A, R>(fn: (a: A) => R, a: A): R {
    const previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      return fn(a);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      if (!isBatchingUpdates && !isRendering) {
        performWork(Sync, null);
      }
    }
  }

  // TODO: Batching should be implemented at the renderer level, not inside
  // the reconciler.
  function unbatchedUpdates<A>(fn: () => A): A {
    if (isBatchingUpdates && !isUnbatchingUpdates) {
      isUnbatchingUpdates = true;
      try {
        return fn();
      } finally {
        isUnbatchingUpdates = false;
      }
    }
    return fn();
  }

  // TODO: Batching should be implemented at the renderer level, not within
  // the reconciler.
  function flushSync<A>(fn: () => A): A {
    const previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      return syncUpdates(fn);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      invariant(
        !isRendering,
        'flushSync was called from inside a lifecycle method. It cannot be ' +
          'called when React is already rendering.',
      );
      performWork(Sync, null);
    }
  }

  return {
    computeAsyncExpiration,
    computeExpirationForFiber,
    scheduleWork,
    batchedUpdates,
    unbatchedUpdates,
    flushSync,
    deferredUpdates,
  };
};
