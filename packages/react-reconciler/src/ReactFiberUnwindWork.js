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
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
  PlaceholderComponent,
} from 'shared/ReactTypeOfWork';
import {
  DidCapture,
  Incomplete,
  NoEffect,
  ShouldCapture,
  Update as UpdateEffect,
} from 'shared/ReactTypeOfSideEffect';
import {
  enableGetDerivedStateFromCatch,
  enableProfilerTimer,
  enableSuspense,
} from 'shared/ReactFeatureFlags';
import {ProfileMode, StrictMode, AsyncMode} from './ReactTypeOfMode';

import {createCapturedValue} from './ReactCapturedValue';
import {
  enqueueCapturedUpdate,
  createUpdate,
  CaptureUpdate,
} from './ReactUpdateQueue';
import {logError} from './ReactFiberCommitWork';
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
  renderDidSuspend,
  renderDidError,
  onUncaughtError,
  markLegacyErrorBoundaryAsFailed,
  isAlreadyFailedLegacyErrorBoundary,
  retrySuspendedRoot,
} from './ReactFiberScheduler';
import {Sync} from './ReactFiberExpirationTime';

import invariant from 'shared/invariant';
import maxSigned31BitInt from './maxSigned31BitInt';
import {
  expirationTimeToMs,
  LOW_PRIORITY_EXPIRATION,
} from './ReactFiberExpirationTime';
import {findEarliestOutstandingPriorityLevel} from './ReactFiberPendingPriority';
import {reconcileChildrenAtExpirationTime} from './ReactFiberBeginWork';

function createRootErrorUpdate(
  fiber: Fiber,
  errorInfo: CapturedValue<mixed>,
  expirationTime: ExpirationTime,
): Update<mixed> {
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

function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  renderExpirationTime: ExpirationTime,
) {
  // The source fiber did not complete.
  sourceFiber.effectTag |= Incomplete;
  // Its effect list is no longer valid.
  sourceFiber.firstEffect = sourceFiber.lastEffect = null;

  if (
    enableSuspense &&
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  ) {
    // This is a thenable.
    const thenable: Thenable = (value: any);

    // Find the earliest timeout threshold of all the placeholders in the
    // ancestor path. We could avoid this traversal by storing the thresholds on
    // the stack, but we choose not to because we only hit this path if we're
    // IO-bound (i.e. if something suspends). Whereas the stack is used even in
    // the non-IO- bound case.
    let workInProgress = returnFiber;
    let earliestTimeoutMs = -1;
    let startTimeMs = -1;
    do {
      if (workInProgress.tag === PlaceholderComponent) {
        const current = workInProgress.alternate;
        if (
          current !== null &&
          current.memoizedState === true &&
          current.stateNode !== null
        ) {
          // Reached a placeholder that already timed out. Each timed out
          // placeholder acts as the root of a new suspense boundary.

          // Use the time at which the placeholder timed out as the start time
          // for the current render.
          const timedOutAt = current.stateNode.timedOutAt;
          startTimeMs = expirationTimeToMs(timedOutAt);

          // Do not search any further.
          break;
        }
        let timeoutPropMs = workInProgress.pendingProps.delayMs;
        if (typeof timeoutPropMs === 'number') {
          if (timeoutPropMs <= 0) {
            earliestTimeoutMs = 0;
          } else if (
            earliestTimeoutMs === -1 ||
            timeoutPropMs < earliestTimeoutMs
          ) {
            earliestTimeoutMs = timeoutPropMs;
          }
        }
      }
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);

    // Schedule the nearest Placeholder to re-render the timed out view.
    workInProgress = returnFiber;
    do {
      if (workInProgress.tag === PlaceholderComponent) {
        const didTimeout = workInProgress.memoizedState;
        if (!didTimeout) {
          // Found the nearest boundary.

          // If the boundary is not in async mode, we should not suspend, and
          // likewise, when the promise resolves, we should ping synchronously.
          const pingTime =
            (workInProgress.mode & AsyncMode) === NoEffect
              ? Sync
              : renderExpirationTime;

          // Attach a listener to the promise to "ping" the root and retry.
          const onResolveOrReject = retrySuspendedRoot.bind(
            null,
            root,
            workInProgress,
            pingTime,
          );
          thenable.then(onResolveOrReject, onResolveOrReject);

          // If the boundary is outside of strict mode, we should *not* suspend
          // the commit. Pretend as if the suspended component rendered null and
          // keep rendering. In the commit phase, we'll schedule a subsequent
          // synchronous update to re-render the Placeholder.
          //
          // Note: It doesn't matter whether the component that suspended was
          // inside a strict mode tree. If the Placeholder is outside of it, we
          // should *not* suspend the commit.
          if ((workInProgress.mode & StrictMode) === NoEffect) {
            workInProgress.effectTag |= UpdateEffect;

            // Unmount the source fiber's children
            const nextChildren = null;
            reconcileChildrenAtExpirationTime(
              sourceFiber.alternate,
              sourceFiber,
              nextChildren,
              renderExpirationTime,
            );
            sourceFiber.effectTag &= ~Incomplete;
            if (sourceFiber.tag === IndeterminateComponent) {
              // Let's just assume it's a functional component. This fiber will
              // be unmounted in the immediate next commit, anyway.
              sourceFiber.tag = FunctionalComponent;
            }

            // Exit without suspending.
            return;
          }

          // Confirmed that the bounary is in a strict mode tree. Continue with
          // the normal suspend path.

          let absoluteTimeoutMs;
          if (earliestTimeoutMs === -1) {
            // If no explicit threshold is given, default to an abitrarily large
            // value. The actual size doesn't matter because the threshold for the
            // whole tree will be clamped to the expiration time.
            absoluteTimeoutMs = maxSigned31BitInt;
          } else {
            if (startTimeMs === -1) {
              // This suspend happened outside of any already timed-out
              // placeholders. We don't know exactly when the update was scheduled,
              // but we can infer an approximate start time from the expiration
              // time. First, find the earliest uncommitted expiration time in the
              // tree, including work that is suspended. Then subtract the offset
              // used to compute an async update's expiration time. This will cause
              // high priority (interactive) work to expire earlier than neccessary,
              // but we can account for this by adjusting for the Just Noticable
              // Difference.
              const earliestExpirationTime = findEarliestOutstandingPriorityLevel(
                root,
                renderExpirationTime,
              );
              const earliestExpirationTimeMs = expirationTimeToMs(
                earliestExpirationTime,
              );
              startTimeMs = earliestExpirationTimeMs - LOW_PRIORITY_EXPIRATION;
            }
            absoluteTimeoutMs = startTimeMs + earliestTimeoutMs;
          }

          // Mark the earliest timeout in the suspended fiber's ancestor path.
          // After completing the root, we'll take the largest of all the
          // suspended fiber's timeouts and use it to compute a timeout for the
          // whole tree.
          renderDidSuspend(root, absoluteTimeoutMs, renderExpirationTime);

          workInProgress.effectTag |= ShouldCapture;
          return;
        }
        // This boundary already captured during this render. Continue to the
        // next boundary.
      }
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
    // No boundary was found. Fallthrough to error mode.
    value = new Error(
      'An update was suspended, but no placeholder UI was provided.',
    );
  }

  // We didn't find a boundary that could handle this type of exception. Start
  // over and traverse parent path again, this time treating the exception
  // as an error.
  renderDidError();
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
      invariant(
        (effectTag & DidCapture) === NoEffect,
        'The root failed to unmount after an error. This is likely a bug in ' +
          'React. Please file an issue.',
      );
      workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
      return workInProgress;
    }
    case HostComponent: {
      popHostContext(workInProgress);
      return null;
    }
    case PlaceholderComponent: {
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
