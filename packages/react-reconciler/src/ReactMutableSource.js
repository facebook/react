/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ExpirationTime} from 'react-reconciler/src/ReactFiberExpirationTime';
import type {FiberRoot} from 'react-reconciler/src/ReactFiberRoot';
import type {MutableSource, MutableSourceVersion} from 'shared/ReactTypes';

import {isPrimaryRenderer} from './ReactFiberHostConfig';
import {NoWork} from './ReactFiberExpirationTime';

// Work in progress version numbers only apply to a single render,
// and should be reset before starting a new render.
// This tracks which mutable sources need to be reset after a render.
let workInProgressPrimarySources: Array<MutableSource<any>> = [];
let workInProgressSecondarySources: Array<MutableSource<any>> = [];

export function clearPendingUpdates(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  if (root.mutableSourcePendingUpdateTime <= expirationTime) {
    root.mutableSourcePendingUpdateTime = NoWork;
  }
}

export function getPendingExpirationTime(root: FiberRoot): ExpirationTime {
  return root.mutableSourcePendingUpdateTime;
}

export function setPendingExpirationTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  root.mutableSourcePendingUpdateTime = expirationTime;
}

export function resetWorkInProgressVersions(): void {
  if (isPrimaryRenderer) {
    for (let i = 0; i < workInProgressPrimarySources.length; i++) {
      const mutableSource = workInProgressPrimarySources[i];
      mutableSource._workInProgressVersionPrimary = null;
    }
    workInProgressPrimarySources.length = 0;
  } else {
    for (let i = 0; i < workInProgressSecondarySources.length; i++) {
      const mutableSource = workInProgressSecondarySources[i];
      mutableSource._workInProgressVersionSecondary = null;
    }
    workInProgressSecondarySources.length = 0;
  }
}

export function getWorkInProgressVersion(
  mutableSource: MutableSource<any>,
): null | MutableSourceVersion {
  if (isPrimaryRenderer) {
    return mutableSource._workInProgressVersionPrimary;
  } else {
    return mutableSource._workInProgressVersionSecondary;
  }
}

export function setWorkInProgressVersion(
  mutableSource: MutableSource<any>,
  version: MutableSourceVersion,
): void {
  if (isPrimaryRenderer) {
    mutableSource._workInProgressVersionPrimary = version;
    workInProgressPrimarySources.push(mutableSource);
  } else {
    mutableSource._workInProgressVersionSecondary = version;
    workInProgressSecondarySources.push(mutableSource);
  }
}
