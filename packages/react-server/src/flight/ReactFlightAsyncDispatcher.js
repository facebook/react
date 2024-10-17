/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactComponentInfo} from 'shared/ReactTypes';

import type {
  AsyncCache,
  AsyncDispatcher,
} from 'react-reconciler/src/ReactInternalTypes';

import {resolveRequest, getCache} from '../ReactFlightServer';
import ReactSharedInternals from '../ReactSharedInternalsServer';

import {disableStringRefs} from 'shared/ReactFeatureFlags';

import {resolveOwner} from './ReactFlightCurrentOwner';

const previousAsyncDispatcher = ReactSharedInternals.A;

function resolveCache(): WeakMap<Function, mixed> {
  const request = resolveRequest();
  if (request) {
    return getCache(request);
  }
  return new WeakMap();
}

function getActiveCache(): AsyncCache {
  const outerCache: AsyncCache | null =
    previousAsyncDispatcher !== null
      ? previousAsyncDispatcher.getActiveCache()
      : null;

  const innerCache = resolveCache();

  if (outerCache === null) {
    return innerCache;
  }

  // If both caches are active, reads will prefer the outer cache
  // Writes will go into both caches.
  const chainedCache: AsyncCache = {
    get(resourceType: Function) {
      const outerEntry = outerCache.get(resourceType);
      if (outerEntry !== undefined) {
        return outerEntry;
      }
      return innerCache.get(resourceType);
    },
    set(resourceType: Function, value: mixed) {
      if (outerCache !== null) {
        outerCache.set(resourceType, value);
      }
      innerCache.set(resourceType, value);
      return chainedCache;
    },
  };

  return chainedCache;
}

export const DefaultAsyncDispatcher: AsyncDispatcher = ({
  getActiveCache,
}: any);

if (__DEV__) {
  DefaultAsyncDispatcher.getOwner = resolveOwner;
} else if (!disableStringRefs) {
  // Server Components never use string refs but the JSX runtime looks for it.
  DefaultAsyncDispatcher.getOwner = (): null | ReactComponentInfo => {
    return null;
  };
}
