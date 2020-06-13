/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {MutableSource, MutableSourceVersion} from 'shared/ReactTypes';
import type {FiberRoot} from './ReactInternalTypes';

import {isPrimaryRenderer} from './ReactFiberHostConfig';

// Work in progress version numbers only apply to a single render,
// and should be reset before starting a new render.
// This tracks which mutable sources need to be reset after a render.
const workInProgressSources: Array<MutableSource<any>> = [];

let rendererSigil;
if (__DEV__) {
  // Used to detect multiple renderers using the same mutable source.
  rendererSigil = {};
}

export function markSourceAsDirty(mutableSource: MutableSource<any>): void {
  workInProgressSources.push(mutableSource);
}

export function resetWorkInProgressVersions(): void {
  for (let i = 0; i < workInProgressSources.length; i++) {
    const mutableSource = workInProgressSources[i];
    if (isPrimaryRenderer) {
      mutableSource._workInProgressVersionPrimary = null;
    } else {
      mutableSource._workInProgressVersionSecondary = null;
    }
  }
  workInProgressSources.length = 0;
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
  } else {
    mutableSource._workInProgressVersionSecondary = version;
  }
  workInProgressSources.push(mutableSource);
}

export function warnAboutMultipleRenderersDEV(
  mutableSource: MutableSource<any>,
): void {
  if (__DEV__) {
    if (isPrimaryRenderer) {
      if (mutableSource._currentPrimaryRenderer == null) {
        mutableSource._currentPrimaryRenderer = rendererSigil;
      } else if (mutableSource._currentPrimaryRenderer !== rendererSigil) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same mutable source. This is currently unsupported.',
        );
      }
    } else {
      if (mutableSource._currentSecondaryRenderer == null) {
        mutableSource._currentSecondaryRenderer = rendererSigil;
      } else if (mutableSource._currentSecondaryRenderer !== rendererSigil) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same mutable source. This is currently unsupported.',
        );
      }
    }
  }
}

// Eager reads the version of a mutable source and stores it on the root.
// This ensures that the version used for server rendering matches the one
// that is eventually read during hydration.
// If they don't match there's a potential tear and a full deopt render is required.
export function registerMutableSourceForHydration(
  root: FiberRoot,
  mutableSource: MutableSource<any>,
): void {
  const getVersion = mutableSource._getVersion;
  const version = getVersion(mutableSource._source);

  // TODO Clear this data once all pending hydration work is finished.
  // Retaining it forever may interfere with GC.
  if (root.mutableSourceEagerHydrationData == null) {
    root.mutableSourceEagerHydrationData = [mutableSource, version];
  } else {
    root.mutableSourceEagerHydrationData.push(mutableSource, version);
  }
}
