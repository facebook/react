/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ReactDebugCurrentFrame} from 'shared/ReactGlobalSharedState';
import {getStackAddendumByWorkInProgressFiber} from 'shared/ReactFiberComponentTreeHook';
import getComponentName from 'shared/getComponentName';
import {StrictMode} from 'shared/ReactTypeOfMode';

import type {Fiber} from 'react-reconciler/src/ReactFiber';

type LifeCyclePhase = 'render' | 'getChildContext';

function getCurrentFiberOwnerName(): string | null {
  if (__DEV__) {
    const fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    const owner = fiber._debugOwner;
    if (owner !== null && typeof owner !== 'undefined') {
      return getComponentName(owner);
    }
  }
  return null;
}

function getCurrentFiberStackAddendum(): string | null {
  if (__DEV__) {
    const fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackAddendumByWorkInProgressFiber(fiber);
  }
  return null;
}

function resetCurrentFiber() {
  ReactDebugCurrentFrame.getCurrentStack = null;
  ReactDebugCurrentFiber.current = null;
  ReactDebugCurrentFiber.phase = null;
}

function setCurrentFiber(fiber: Fiber) {
  ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackAddendum;
  ReactDebugCurrentFiber.current = fiber;
  ReactDebugCurrentFiber.phase = null;
}

function setCurrentPhase(phase: LifeCyclePhase | null) {
  ReactDebugCurrentFiber.phase = phase;
}

function isInStrictMode(): boolean {
  const currentFiber = ReactDebugCurrentFiber.current;
  return currentFiber !== null && !!(currentFiber.mode & StrictMode);
}

const ReactDebugCurrentFiber = {
  current: (null: Fiber | null),
  getCurrentFiberOwnerName,
  getCurrentFiberStackAddendum,
  phase: (null: LifeCyclePhase | null),
  resetCurrentFiber,
  setCurrentFiber,
  setCurrentPhase,
  isInStrictMode,
};

export default ReactDebugCurrentFiber;
