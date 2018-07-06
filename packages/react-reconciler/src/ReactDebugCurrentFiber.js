/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ReactDebugCurrentFrame} from 'shared/ReactGlobalSharedState';
import {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} from 'shared/ReactTypeOfWork';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';

import type {Fiber} from './ReactFiber';

type LifeCyclePhase = 'render' | 'getChildContext';

function describeFiber(fiber: Fiber): string {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent:
      const owner = fiber._debugOwner;
      const source = fiber._debugSource;
      const name = getComponentName(fiber);
      let ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner);
      }
      return describeComponentFrame(name, source, ownerName);
    default:
      return '';
  }
}

// This function can only be called with a work-in-progress fiber and
// only during begin or complete phase. Do not call it under any other
// circumstances. Note that this method works both in DEV and PROD.
export function getStackAddendumByWorkInProgressFiber(
  workInProgress: Fiber,
): string {
  let info = '';
  let node = workInProgress;
  do {
    info += describeFiber(node);
    // Otherwise this return pointer might point to the wrong tree:
    node = node.return;
  } while (node);
  return info;
}

export let current: Fiber | null = null;
export let phase: LifeCyclePhase | null = null;

export function getCurrentFiberOwnerName(): string | null {
  if (__DEV__) {
    if (current === null) {
      return null;
    }
    const owner = current._debugOwner;
    if (owner !== null && typeof owner !== 'undefined') {
      return getComponentName(owner);
    }
  }
  return null;
}

export function getCurrentFiberStackAddendum(): string | null {
  if (__DEV__) {
    if (current === null) {
      return null;
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackAddendumByWorkInProgressFiber(current);
  }
  return null;
}

export function resetCurrentFiber() {
  if (__DEV__) {
    ReactDebugCurrentFrame.getCurrentStack = null;
    current = null;
    phase = null;
  }
}

export function setCurrentFiber(fiber: Fiber) {
  if (__DEV__) {
    ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackAddendum;
    current = fiber;
    phase = null;
  }
}

export function setCurrentPhase(lifeCyclePhase: LifeCyclePhase | null) {
  if (__DEV__) {
    phase = lifeCyclePhase;
  }
}
