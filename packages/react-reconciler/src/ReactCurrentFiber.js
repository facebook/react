/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  getStackByFiberInDevAndProd,
  getOwnerStackByFiberInDev,
} from './ReactFiberComponentStack';
import {getComponentNameFromOwner} from 'react-reconciler/src/getComponentNameFromFiber';
import {enableOwnerStacks} from 'shared/ReactFeatureFlags';

export let current: Fiber | null = null;
export let isRendering: boolean = false;

export function getCurrentFiberOwnerNameInDevOrNull(): string | null {
  if (__DEV__) {
    if (current === null) {
      return null;
    }
    const owner = current._debugOwner;
    if (owner != null) {
      return getComponentNameFromOwner(owner);
    }
  }
  return null;
}

export function getCurrentParentStackInDev(): string {
  // This is used to get the parent stack even with owner stacks turned on.
  if (__DEV__) {
    if (current === null) {
      return '';
    }
    return getStackByFiberInDevAndProd(current);
  }
  return '';
}

function getCurrentFiberStackInDev(): string {
  if (__DEV__) {
    if (current === null) {
      return '';
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    // TODO: The above comment is not actually true. We might be
    // in a commit phase or preemptive set state callback.
    if (enableOwnerStacks) {
      return getOwnerStackByFiberInDev(current);
    }
    return getStackByFiberInDevAndProd(current);
  }
  return '';
}

export function resetCurrentDebugFiberInDEV() {
  if (__DEV__) {
    resetCurrentFiber();
  }
}

export function setCurrentDebugFiberInDEV(fiber: Fiber | null) {
  if (__DEV__) {
    setCurrentFiber(fiber);
  }
}

export function resetCurrentFiber() {
  if (__DEV__) {
    ReactSharedInternals.getCurrentStack = null;
    isRendering = false;
  }
  current = null;
}

export function setCurrentFiber(fiber: Fiber | null) {
  if (__DEV__) {
    ReactSharedInternals.getCurrentStack =
      fiber === null ? null : getCurrentFiberStackInDev;
    isRendering = false;
  }
  current = fiber;
}

export function getCurrentFiber(): Fiber | null {
  if (__DEV__) {
    return current;
  }
  return null;
}

export function setIsRendering(rendering: boolean) {
  if (__DEV__) {
    isRendering = rendering;
  }
}

export function getIsRendering(): void | boolean {
  if (__DEV__) {
    return isRendering;
  }
}
