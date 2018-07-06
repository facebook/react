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

import type {Fiber} from './ReactFiber';

type LifeCyclePhase = 'render' | 'getChildContext';

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
