/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

let resetOwnerStackIntervalId: mixed = null;

export function startResettingOwnerStackLimit() {
  if (__DEV__) {
    ReactSharedInternals.recentlyCreatedOwnerStacks = 0;

    if (typeof setInterval === 'function') {
      // Renderers might start in render but stop in commit.
      // So we need to be resilient against start being called multiple times.
      if (resetOwnerStackIntervalId !== null) {
        clearInterval((resetOwnerStackIntervalId: any));
      }
      resetOwnerStackIntervalId = setInterval(() => {
        ReactSharedInternals.recentlyCreatedOwnerStacks = 0;
      }, 1000);
    }
  } else {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'startResettingOwnerStackLimit should never be called in production mode. This is a bug in React.',
    );
  }
}

export function stopResettingOwnerStackLimit() {
  if (__DEV__) {
    if (typeof setInterval === 'function') {
      if (resetOwnerStackIntervalId !== null) {
        clearInterval((resetOwnerStackIntervalId: any));
        resetOwnerStackIntervalId = null;
      }
    }
  } else {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'stopResettingOwnerStackLimit should never be called in production mode. This is a bug in React.',
    );
  }
}
