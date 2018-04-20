/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {HostContext} from './ReactFiberHostContext';
import type {LegacyContext} from './ReactFiberContext';
import type {NewContext} from './ReactFiberNewContext';
import type {CapturedValue} from './ReactCapturedValue';
import type {Update} from './ReactUpdateQueue';

import {createCapturedValue} from './ReactCapturedValue';
import {enqueueRenderPhaseUpdate, createUpdate} from './ReactUpdateQueue';
import {logError} from './ReactFiberCommitWork';

import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
} from 'shared/ReactTypeOfWork';
import {
  NoEffect,
  DidCapture,
  Incomplete,
  ShouldCapture,
} from 'shared/ReactTypeOfSideEffect';
import {StrictMode} from './ReactTypeOfMode';

import {
  enableGetDerivedStateFromCatch,
  debugRenderPhaseSideEffects,
  debugRenderPhaseSideEffectsForStrictMode,
} from 'shared/ReactFeatureFlags';

export default function<C, CX>(
  hostContext: HostContext<C, CX>,
  legacyContext: LegacyContext,
  newContext: NewContext,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  markLegacyErrorBoundaryAsFailed: (instance: mixed) => void,
  isAlreadyFailedLegacyErrorBoundary: (instance: mixed) => boolean,
  onUncaughtError: (error: mixed) => void,
) {
  const {popHostContainer, popHostContext} = hostContext;
  const {
    popContextProvider: popLegacyContextProvider,
    popTopLevelContextObject: popTopLevelLegacyContextObject,
  } = legacyContext;
  const {popProvider} = newContext;

  function createRootErrorUpdate(
    errorInfo: CapturedValue<mixed>,
    expirationTime: ExpirationTime,
  ): Update<null> {
    const update = createUpdate(expirationTime);
    update.process = nextWorkInProgress => {
      // Unmount the root by rendering null.
      return null;
    };
    update.commit = finishedWork => {
      const error = errorInfo.value;
      onUncaughtError(error);
      logError(finishedWork, errorInfo);
    };
    return update;
  }

  function createClassErrorUpdate(
    fiber: Fiber,
    errorInfo: CapturedValue<mixed>,
    expirationTime: ExpirationTime,
  ): Update<mixed> {
    const update = createUpdate(expirationTime);
    update.process = (workInProgress, prevState) => {
      const getDerivedStateFromCatch =
        workInProgress.type.getDerivedStateFromCatch;

      workInProgress.effectTag =
        (workInProgress.effectTag & ~ShouldCapture) | DidCapture;

      if (
        enableGetDerivedStateFromCatch &&
        typeof getDerivedStateFromCatch === 'function'
      ) {
        const error = errorInfo.value;
        if (
          debugRenderPhaseSideEffects ||
          (debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode)
        ) {
          // Invoke the function an extra time to help detect side-effects.
          getDerivedStateFromCatch(error);
        }

        // TODO: Pass prevState as second argument?
        const partialState = getDerivedStateFromCatch(error);

        // Merge the partial state and the previous state.
        return Object.assign({}, prevState, partialState);
      } else {
        return prevState;
      }
    };

    const inst = fiber.stateNode;
    if (inst !== null && typeof inst.componentDidCatch === 'function') {
      update.commit = finishedWork => {
        const instance = finishedWork.stateNode;
        const ctor = finishedWork.type;

        if (
          !enableGetDerivedStateFromCatch ||
          typeof ctor.getDerivedStateFromCatch !== 'function'
        ) {
          // To preserve the preexisting retry behavior of error boundaries,
          // we keep track of which ones already failed during this batch.
          // This gets reset before we yield back to the browser.
          // TODO: Warn in strict mode if getDerivedStateFromCatch is
          // not defined.
          markLegacyErrorBoundaryAsFailed(instance);
        }

        instance.props = finishedWork.memoizedProps;
        instance.state = finishedWork.memoizedState;
        const error = errorInfo.value;
        const stack = errorInfo.stack;
        logError(finishedWork, errorInfo);
        instance.componentDidCatch(error, {
          componentStack: stack !== null ? stack : '',
        });
      };
    }
    return update;
  }

  function throwException(
    returnFiber: Fiber,
    sourceFiber: Fiber,
    rawValue: mixed,
    renderExpirationTime: ExpirationTime,
  ) {
    // The source fiber did not complete.
    sourceFiber.effectTag |= Incomplete;
    // Its effect list is no longer valid.
    sourceFiber.firstEffect = sourceFiber.lastEffect = null;

    const value = createCapturedValue(rawValue, sourceFiber);

    let workInProgress = returnFiber;
    do {
      switch (workInProgress.tag) {
        case HostRoot: {
          const errorInfo = value;
          workInProgress.effectTag |= ShouldCapture;
          const update = createRootErrorUpdate(errorInfo, renderExpirationTime);
          enqueueRenderPhaseUpdate(
            workInProgress,
            update,
            renderExpirationTime,
          );
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
            enqueueRenderPhaseUpdate(
              workInProgress,
              update,
              renderExpirationTime,
            );
            return;
          }
          break;
        default:
          break;
      }
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
  }

  function unwindWork(workInProgress: Fiber) {
    switch (workInProgress.tag) {
      case ClassComponent: {
        popLegacyContextProvider(workInProgress);
        const effectTag = workInProgress.effectTag;
        if (effectTag & ShouldCapture) {
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

  return {
    throwException,
    unwindWork,
    unwindInterruptedWork,
    createRootErrorUpdate,
    createClassErrorUpdate,
  };
}
