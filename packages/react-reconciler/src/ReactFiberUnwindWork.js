/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createCapturedValue} from './ReactCapturedValue';
import {ensureUpdateQueues} from './ReactFiberUpdateQueue';

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

import {enableGetDerivedStateFromCatch} from 'shared/ReactFeatureFlags';

import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';

type TypeOfException = 0 | 1;

const UnknownException = 0;
const ErrorException = 1;

export default function(
  hostContext: HostContext<C, CX>,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  isAlreadyFailedLegacyErrorBoundary: (instance: mixed) => boolean,
) {
  const {popHostContainer, popHostContext} = hostContext;

  function throwException(
    returnFiber: Fiber,
    sourceFiber: Fiber,
    value: mixed,
  ) {
    // The source fiber did not complete.
    sourceFiber.effectTag |= Incomplete;
    // Its effect list is no longer valid.
    sourceFiber.firstEffect = sourceFiber.lastEffect = null;

    let typeOfException: TypeOfException = UnknownException;

    let workInProgress = returnFiber;
    do {
      switch (workInProgress.tag) {
        case HostRoot: {
          switch (typeOfException) {
            case UnknownException: {
              // We didn't find a boundary that could handle this type of
              // exception. Start over and traverse parent path again, this time
              // treating the exception as an error.
              value = createCapturedValue(value, sourceFiber);
              workInProgress = returnFiber;
              typeOfException = ErrorException;
              continue;
            }
            case ErrorException: {
              // Uncaught error
              const errorInfo = value;
              ensureUpdateQueues(workInProgress);
              const updateQueue: UpdateQueue = (workInProgress.updateQueue: any);
              updateQueue.capturedValues = [errorInfo];
              workInProgress.effectTag |= ShouldCapture;
              return;
            }
          }
          return;
        }
        case ClassComponent:
          if (typeOfException === ErrorException) {
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
          }
          break;
        default:
          break;
      }
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
  }

  function unwindWork(workInProgress) {
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
