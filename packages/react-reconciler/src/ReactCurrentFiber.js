/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} from 'shared/ReactTypeOfWork';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';

const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

import type {Fiber} from './ReactFiber';

type LifeCyclePhase = 'render' | 'getChildContext';

// will be removed someday; here for backward compat
export function getStackByFiberInDevAndProd(workInProgress: Fiber): string {
  let info = '';
  let node = workInProgress;
  const frames = getStackFramesByFiberInDevAndProd(node);
  frames.forEach(({fileName, lineNumber, name = null, ownerName = null}) => {
    const source = fileName && lineNumber && {fileName, lineNumber};
    info += describeComponentFrame(name, source, ownerName);
  });
  return info;
}

type ReactFrame = {
  fileName?: string | null,
  lineNumber?: number | null,
  name?: string | null,
  ownerName?: string | null,
};

export function getStackFramesByFiberInDevAndProd(
  workInProgress: Fiber,
): ReactFrame[] {
  let node = workInProgress;
  let frames = [];
  do {
    switch (node.tag) {
      case IndeterminateComponent:
      case FunctionalComponent:
      case ClassComponent:
      case HostComponent:
        const owner = node._debugOwner;
        const source = node._debugSource;
        const name = owner && getComponentName(node.type);
        let ownerName = null;
        if (owner) {
          ownerName = getComponentName(owner.type);
        }
        frames.push({
          fileName: source && source.fileName.replace(/^.*[\\\/]/, ''),
          lineNumber: source && source.lineNumber,
          name,
          ownerName,
        });
    }
    node = node.return;
  } while (node);
  return frames;
}

export let current: Fiber | null = null;
export let phase: LifeCyclePhase | null = null;

export function getCurrentFiberOwnerNameInDevOrNull(): string | null {
  if (__DEV__) {
    if (current === null) {
      return null;
    }
    const owner = current._debugOwner;
    if (owner !== null && typeof owner !== 'undefined') {
      return getComponentName(owner.type);
    }
  }
  return null;
}

// will be removed someday; here for backward compat
export function getCurrentFiberStackInDev(): string {
  if (__DEV__) {
    if (current === null) {
      return '';
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackByFiberInDevAndProd(current);
  }
  return '';
}

export function getCurrentFiberStackFramesInDev(): ReactFrame[] {
  if (__DEV__) {
    if (current === null) {
      return [];
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackFramesByFiberInDevAndProd(current);
  }
  return [];
}

export function resetCurrentFiber() {
  if (__DEV__) {
    ReactDebugCurrentFrame.getCurrentStack = null;
    ReactDebugCurrentFrame.getCurrentStackFrames = null;
    current = null;
    phase = null;
  }
}

export function setCurrentFiber(fiber: Fiber) {
  if (__DEV__) {
    ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackInDev;
    ReactDebugCurrentFrame.getCurrentStackFrames = getCurrentFiberStackFramesInDev;
    current = fiber;
    phase = null;
  }
}

export function setCurrentPhase(lifeCyclePhase: LifeCyclePhase | null) {
  if (__DEV__) {
    phase = lifeCyclePhase;
  }
}
