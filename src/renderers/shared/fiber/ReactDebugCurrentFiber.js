/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugCurrentFiber
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';

import getComponentName from 'getComponentName';
import {ReactDebugCurrentFrame} from 'ReactGlobalSharedState';
import {
  getStackAddendumByWorkInProgressFiber,
} from 'ReactFiberComponentTreeHook';

const {setCurrentStackImplementation} = ReactDebugCurrentFrame;

type LifeCyclePhase = 'render' | 'getChildContext';

export function getCurrentFiberOwnerName(): string | null {
  if (__DEV__) {
    const fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    if (fiber._debugOwner != null) {
      return getComponentName(fiber._debugOwner);
    }
  }
  return null;
}

export function getCurrentFiberStackAddendum(): string | null {
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

export function resetCurrentFiber() {
  setCurrentStackImplementation(null);
  ReactDebugCurrentFiber.current = null;
  ReactDebugCurrentFiber.phase = null;
}

export function setCurrentFiber(
  fiber: Fiber | null,
  phase: LifeCyclePhase | null,
) {
  setCurrentStackImplementation(getCurrentFiberStackAddendum);
  ReactDebugCurrentFiber.current = fiber;
  ReactDebugCurrentFiber.phase = phase;
}

const ReactDebugCurrentFiber = {
  current: (null: Fiber | null),
  phase: (null: LifeCyclePhase | null),
};

export default ReactDebugCurrentFiber;
