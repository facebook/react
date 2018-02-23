/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createCapturedValue} from './ReactCapturedValue';
import {suspendPendingWork} from './ReactFiberPendingWork';
import {
  ensureUpdateQueues,
  insertUpdateIntoFiber,
} from './ReactFiberUpdateQueue';

import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
  LoadingComponent,
  TimeoutComponent,
} from 'shared/ReactTypeOfWork';
import {
  NoEffect,
  DidCapture,
  Incomplete,
  ShouldCapture,
} from 'shared/ReactTypeOfSideEffect';
import {Sync} from './ReactFiberExpirationTime';

import {enableGetDerivedStateFromCatch} from 'shared/ReactFeatureFlags';

import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';

import invariant from 'fbjs/lib/invariant';

const SuspendException = 1;
const SuspendAndLoadingException = 2;

function createRootExpirationError(sourceFiber, renderExpirationTime) {
  try {
    // TODO: Better error messages.
    invariant(
      renderExpirationTime !== Sync,
      'A synchronous update was suspended, but no fallback UI was provided.',
    );
    invariant(
      false,
      'An update was suspended for longer than the timeout, but no fallback ' +
        'UI was provided.',
    );
  } catch (error) {
    return error;
  }
}

export default function(
  hostContext: HostContext<C, CX>,
  retryOnPromiseResolution: (
    root: FiberRoot,
    blockedTime: ExpirationTime,
  ) => void,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  isAlreadyFailedLegacyErrorBoundary: (instance: mixed) => boolean,
  markTimeout: (timeoutMs: number) => void,
) {
  const {popHostContainer, popHostContext} = hostContext;

  function waitForPromise(root, promise, suspendedTime) {
    promise.then(() => retryOnPromiseResolution(root, suspendedTime));
  }

  function scheduleLoadingState(
    workInProgress,
    renderStartTime,
    renderExpirationTime,
  ) {
    const slightlyHigherPriority = renderExpirationTime - 1;
    const loadingUpdate = {
      expirationTime: slightlyHigherPriority,
      partialState: true,
      callback: null,
      isReplace: true,
      isForced: false,
      capturedValue: null,
      next: null,
    };
    insertUpdateIntoFiber(workInProgress, loadingUpdate);

    const revertUpdate = {
      expirationTime: renderExpirationTime,
      partialState: false,
      callback: null,
      isReplace: true,
      isForced: false,
      capturedValue: null,
      next: null,
    };
    insertUpdateIntoFiber(workInProgress, revertUpdate);
    scheduleWork(workInProgress, renderStartTime, slightlyHigherPriority);
    return false;
  }

  function throwException(
    returnFiber: Fiber,
    sourceFiber: Fiber,
    value: mixed,
    renderIsExpired: boolean,
    remainingTimeMs: number,
    elapsedMs: number,
    renderStartTime: number,
    renderExpirationTime: ExpirationTime,
  ) {
    // The source fiber did not complete.
    sourceFiber.effectTag |= Incomplete;
    // Its effect list is no longer valid.
    sourceFiber.firstEffect = sourceFiber.lastEffect = null;

    if (
      value !== null &&
      typeof value === 'object' &&
      typeof value.then === 'function'
    ) {
      // This is a thenable.
      let typeOfException = SuspendAndLoadingException;
      let workInProgress = returnFiber;
      do {
        switch (workInProgress.tag) {
          case HostRoot: {
            const root: FiberRoot = workInProgress.stateNode;
            switch (typeOfException) {
              case SuspendAndLoadingException:
              case SuspendException: {
                if (!renderIsExpired) {
                  // Set-up timer using render expiration time
                  const suspendedTime = renderExpirationTime;
                  const promise = value;
                  suspendPendingWork(root, suspendedTime);
                  waitForPromise(root, promise, suspendedTime);
                  return;
                }
                // The root expired, but no fallback was provided. Throw a
                // helpful error.
                value = createRootExpirationError(
                  sourceFiber,
                  renderExpirationTime,
                );
                break;
              }
            }
            break;
          }
          case TimeoutComponent:
            switch (typeOfException) {
              case SuspendAndLoadingException:
              case SuspendException: {
                const didExpire = workInProgress.memoizedState;
                const timeout = workInProgress.pendingProps.ms;
                // Check if the boundary should capture promises that threw.
                let shouldCapture;
                if (workInProgress.effectTag & DidCapture) {
                  // Already captured during this render. Can't capture again.
                  shouldCapture = false;
                } else if (didExpire || renderIsExpired) {
                  // Render is expired.
                  shouldCapture = true;
                } else if (
                  typeof timeout === 'number' &&
                  elapsedMs >= timeout
                ) {
                  // The elapsed time exceeds the provided timeout.
                  shouldCapture = true;
                } else {
                  // There's still time left. Bubble to the next boundary.
                  shouldCapture = false;
                }
                if (shouldCapture) {
                  workInProgress.effectTag |= ShouldCapture;
                  ensureUpdateQueues(workInProgress);
                  const updateQueue: UpdateQueue = (workInProgress.updateQueue: any);
                  const capturedValues = updateQueue.capturedValues;
                  if (capturedValues === null) {
                    updateQueue.capturedValues = [value];
                  } else {
                    capturedValues.push(value);
                  }
                  return workInProgress;
                } else {
                  if (typeof timeout === 'number') {
                    markTimeout(timeout);
                  }
                }
              }
            }
            break;
          case LoadingComponent:
            switch (typeOfException) {
              case SuspendAndLoadingException: {
                const current = workInProgress.alternate;
                const isLoading = workInProgress.memoizedState;
                if (current !== null && !isLoading && !renderIsExpired) {
                  // Schedule loading update
                  scheduleLoadingState(
                    workInProgress,
                    renderStartTime,
                    renderExpirationTime,
                  );
                  typeOfException = SuspendException;
                  break;
                }
              }
            }
            break;
          default:
            break;
        }
        workInProgress = workInProgress.return;
      } while (workInProgress !== null);
    }

    // We didn't find a boundary that could handle this type of exception. Start
    // over and traverse parent path again, this time treating the exception
    // as an error.
    value = createCapturedValue(value, sourceFiber);
    let workInProgress = returnFiber;
    do {
      switch (workInProgress.tag) {
        case HostRoot: {
          // Uncaught error
          const errorInfo = value;
          ensureUpdateQueues(workInProgress);
          const updateQueue: UpdateQueue = (workInProgress.updateQueue: any);
          updateQueue.capturedValues = [errorInfo];
          workInProgress.effectTag |= ShouldCapture;
          return;
        }
        case ClassComponent:
          // Capture and retry
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
            ensureUpdateQueues(workInProgress);
            const updateQueue: UpdateQueue = (workInProgress.updateQueue: any);
            const capturedValues = updateQueue.capturedValues;
            if (capturedValues === null) {
              updateQueue.capturedValues = [value];
            } else {
              capturedValues.push(value);
            }
            workInProgress.effectTag |= ShouldCapture;
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
    workInProgress,
    elapsedMs,
    renderIsExpired,
    remainingTimeMs,
    renderStartTime,
    renderExpirationTime,
  ) {
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
  return {
    throwException,
    unwindWork,
  };
}
