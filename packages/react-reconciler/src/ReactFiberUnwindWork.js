/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {CapturedValue} from './ReactCapturedValue';
import type {Update} from './ReactUpdateQueue';
import type {Thenable} from './ReactFiberScheduler';

import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
  TimeoutComponent,
} from 'shared/ReactTypeOfWork';
import {
  DidCapture,
  Incomplete,
  NoEffect,
  ShouldCapture,
} from 'shared/ReactTypeOfSideEffect';
import {
  enableGetDerivedStateFromCatch,
  enableProfilerTimer,
  enableSuspense,
} from 'shared/ReactFeatureFlags';
import {ProfileMode} from './ReactTypeOfMode';

import {createCapturedValue} from './ReactCapturedValue';
import {
  enqueueCapturedUpdate,
  createUpdate,
  enqueueUpdate,
  CaptureUpdate,
} from './ReactUpdateQueue';
import {logError} from './ReactFiberCommitWork';
import {Never, Sync, expirationTimeToMs} from './ReactFiberExpirationTime';
import {popHostContainer, popHostContext} from './ReactFiberHostContext';
import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';
import {
  resumeActualRenderTimerIfPaused,
  recordElapsedActualRenderTime,
} from './ReactProfilerTimer';
import {
  markTimeout,
  onUncaughtError,
  markLegacyErrorBoundaryAsFailed,
  isAlreadyFailedLegacyErrorBoundary,
  recalculateCurrentTime,
  computeExpirationForFiber,
  scheduleWork,
  retrySuspendedRoot,
} from './ReactFiberScheduler';

function createRootErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  expirationTime: ExpirationTime,
): Update<null> {
  const update = createUpdate(expirationTime);
  // Unmount the root by rendering null.
  update.tag = CaptureUpdate;
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element: null};
  const error = errorInfo.value;
  update.callback = () => {
    onUncaughtError(error);
    logError(fiber, errorInfo);
  };
  return update;
}

function createClassErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  expirationTime: ExpirationTime,
): Update<mixed> {
  const update = createUpdate(expirationTime);
  update.tag = CaptureUpdate;
  const getDerivedStateFromCatch = fiber.type.getDerivedStateFromCatch;
  if (
    enableGetDerivedStateFromCatch &&
    typeof getDerivedStateFromCatch === 'function'
  ) {
    const error = errorInfo.value;
    update.payload = () => {
      return getDerivedStateFromCatch(error);
    };
  }

  const inst = fiber.stateNode;
  if (inst !== null && typeof inst.componentDidCatch === 'function') {
    update.callback = function callback() {
      if (
        !enableGetDerivedStateFromCatch ||
        getDerivedStateFromCatch !== 'function'
      ) {
        // To preserve the preexisting retry behavior of error boundaries,
        // we keep track of which ones already failed during this batch.
        // This gets reset before we yield back to the browser.
        // TODO: Warn in strict mode if getDerivedStateFromCatch is
        // not defined.
        markLegacyErrorBoundaryAsFailed(this);
      }
      const error = errorInfo.value;
      const stack = errorInfo.stack;
      logError(fiber, errorInfo);
      this.componentDidCatch(error, {
        componentStack: stack !== null ? stack : '',
      });
    };
  }
  return update;
}

function schedulePing(finishedWork) {
  // Once the promise resolves, we should try rendering the non-
  // placeholder state again.
  const currentTime = recalculateCurrentTime();
  const expirationTime = computeExpirationForFiber(currentTime, finishedWork);
  const recoveryUpdate = createUpdate(expirationTime);
  enqueueUpdate(finishedWork, recoveryUpdate, expirationTime);
  scheduleWork(finishedWork, expirationTime);
}

function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  renderExpirationTime: ExpirationTime,
  currentTimeMs: number,
) {
  // The source fiber did not complete.
  sourceFiber.effectTag |= Incomplete;
  // Its effect list is no longer valid.
  sourceFiber.firstEffect = sourceFiber.lastEffect = null;

  // Check if there is lower priority work, regardless of whether it's pending.
  // If so, it may have the effect of fixing the exception that was just thrown.
  const latestPendingTime = root.latestPendingTime;
  const latestSuspendedTime = root.latestSuspendedTime;
  if (
    renderExpirationTime !== latestPendingTime &&
    renderExpirationTime !== latestSuspendedTime &&
    renderExpirationTime !== Never
  ) {
    // There's lower priority work. Exit to suspend this render and retry at
    // the lower priority.
    return;
  }

  if (
    enableSuspense &&
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  ) {
    // This is a thenable.
    const thenable: Thenable = (value: any);

    // TODO: Should use the earliest known expiration time
    const expirationTimeMs = expirationTimeToMs(renderExpirationTime);
    const startTimeMs = expirationTimeMs - 5000;
    let elapsedMs = currentTimeMs - startTimeMs;
    if (elapsedMs < 0) {
      elapsedMs = 0;
    }
    const remainingTimeMs = expirationTimeMs - currentTimeMs;

    // Find the earliest timeout of all the timeouts in the ancestor path.
    // TODO: Alternatively, we could store the earliest timeout on the context
    // stack, rather than searching on every suspend.
    let workInProgress = returnFiber;
    let earliestTimeoutMs = -1;
    searchForEarliestTimeout: do {
      if (workInProgress.tag === TimeoutComponent) {
        const current = workInProgress.alternate;
        if (current !== null && current.memoizedState === true) {
          // A parent Timeout already committed in a placeholder state. We
          // need to handle this promise immediately. In other words, we
          // should never suspend inside a tree that already expired.
          earliestTimeoutMs = 0;
          break searchForEarliestTimeout;
        }
        let timeoutPropMs = workInProgress.pendingProps.ms;
        if (typeof timeoutPropMs === 'number') {
          if (timeoutPropMs <= 0) {
            earliestTimeoutMs = 0;
            break searchForEarliestTimeout;
          } else if (
            earliestTimeoutMs === -1 ||
            timeoutPropMs < earliestTimeoutMs
          ) {
            earliestTimeoutMs = timeoutPropMs;
          }
        } else if (earliestTimeoutMs === -1) {
          earliestTimeoutMs = remainingTimeMs;
        }
      }
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);

    // Compute the remaining time until the timeout.
    const msUntilTimeout = earliestTimeoutMs - elapsedMs;

    if (renderExpirationTime === Never || msUntilTimeout > 0) {
      // There's still time remaining.
      markTimeout(root, thenable, msUntilTimeout, renderExpirationTime);
      const onResolveOrReject = () => {
        retrySuspendedRoot(root, renderExpirationTime);
      };
      thenable.then(onResolveOrReject, onResolveOrReject);
      return;
    } else {
      // No time remaining. Need to fallback to placeholder.
      // Find the nearest timeout that can be retried.
      workInProgress = returnFiber;
      do {
        switch (workInProgress.tag) {
          case HostRoot: {
            // The root expired, but no fallback was provided. Throw a
            // helpful error.
            const message =
              renderExpirationTime === Sync
                ? 'A synchronous update was suspended, but no fallback UI ' +
                  'was provided.'
                : 'An update was suspended for longer than the timeout, ' +
                  'but no fallback UI was provided.';
            value = new Error(message);
            break;
          }
          case TimeoutComponent: {
            if ((workInProgress.effectTag & DidCapture) === NoEffect) {
              workInProgress.effectTag |= ShouldCapture;
              const onResolveOrReject = schedulePing.bind(null, workInProgress);
              thenable.then(onResolveOrReject, onResolveOrReject);
              return;
            }
            // Already captured during this render. Continue to the next
            // Timeout ancestor.
            break;
          }
        }
        workInProgress = workInProgress.return;
      } while (workInProgress !== null);
    }
  }

  // We didn't find a boundary that could handle this type of exception. Start
  // over and traverse parent path again, this time treating the exception
  // as an error.
  value = createCapturedValue(value, sourceFiber);
  let workInProgress = returnFiber;
  do {
    switch (workInProgress.tag) {
      case HostRoot: {
        const errorInfo = value;
        workInProgress.effectTag |= ShouldCapture;
        const update = createRootErrorUpdate(
          workInProgress,
          errorInfo,
          renderExpirationTime,
        );
        enqueueCapturedUpdate(workInProgress, update, renderExpirationTime);
        return;
      }
      case ClassComponent:
        // Capture and retry
        const errorInfo = value;
        const ctor = workInProgress.type;
        const instance = workInProgress.stateNode;
        if (
          (workInProgress.effectTag & DidCapture) === NoEffect &&
          ((typeof ctor.getDerivedStateFromCatch === 'function' &&
            enableGetDerivedStateFromCatch) ||
            (instance !== null &&
              typeof instance.componentDidCatch === 'function' &&
              !isAlreadyFailedLegacyErrorBoundary(instance)))
        ) {
          workInProgress.effectTag |= ShouldCapture;
          // Schedule the error boundary to re-render using updated state
          const update = createClassErrorUpdate(
            workInProgress,
            errorInfo,
            renderExpirationTime,
          );
          enqueueCapturedUpdate(workInProgress, update, renderExpirationTime);
          return;
        }
        break;
      default:
        break;
    }
    workInProgress = workInProgress.return;
  } while (workInProgress !== null);
}

function unwindWork(
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
) {
  if (enableProfilerTimer) {
    if (workInProgress.mode & ProfileMode) {
      recordElapsedActualRenderTime(workInProgress);
    }
  }

  switch (workInProgress.tag) {
    case ClassComponent: {
      popLegacyContextProvider(workInProgress);
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }
      return null;
    }
    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelLegacyContextObject(workInProgress);
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }
      return null;
    }
    case HostComponent: {
      popHostContext(workInProgress);
      return null;
    }
    case TimeoutComponent: {
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }
      return null;
    }
    case HostPortal:
      popHostContainer(workInProgress);
      return null;
    case ContextProvider:
      popProvider(workInProgress);
      return null;
    default:
      return null;
  }
}

function unwindInterruptedWork(interruptedWork: Fiber) {
  if (enableProfilerTimer) {
    if (interruptedWork.mode & ProfileMode) {
      // Resume in case we're picking up on work that was paused.
      resumeActualRenderTimerIfPaused();
      recordElapsedActualRenderTime(interruptedWork);
    }
  }

  switch (interruptedWork.tag) {
    case ClassComponent: {
      popLegacyContextProvider(interruptedWork);
      break;
    }
    case HostRoot: {
      popHostContainer(interruptedWork);
      popTopLevelLegacyContextObject(interruptedWork);
      break;
    }
    case HostComponent: {
      popHostContext(interruptedWork);
      break;
    }
    case HostPortal:
      popHostContainer(interruptedWork);
      break;
    case ContextProvider:
      popProvider(interruptedWork);
      break;
    default:
      break;
  }
}

export {
  throwException,
  unwindWork,
  unwindInterruptedWork,
  createRootErrorUpdate,
  createClassErrorUpdate,
};
