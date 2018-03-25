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
import type {UpdateQueue} from './ReactFiberUpdateQueue';

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

export default function<C, CX>(
  hostContext: HostContext<C, CX>,
  legacyContext: LegacyContext,
  newContext: NewContext,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  isAlreadyFailedLegacyErrorBoundary: (instance: mixed) => boolean,
) {
  const {popHostContainer, popHostContext} = hostContext;
  const {
    popContextProvider: popLegacyContextProvider,
    popTopLevelContextObject: popTopLevelLegacyContextObject,
  } = legacyContext;
  const {popProvider} = newContext;

  function throwException(
    returnFiber: Fiber,
    sourceFiber: Fiber,
    rawValue: mixed,
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
          // Uncaught error
          const errorInfo = value;
          ensureUpdateQueues(workInProgress);
          const updateQueue: UpdateQueue<
            any,
          > = (workInProgress.updateQueue: any);
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
            const updateQueue: UpdateQueue<
              any,
            > = (workInProgress.updateQueue: any);
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

  function unwindWork(workInProgress: Fiber) {
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
  };
}
