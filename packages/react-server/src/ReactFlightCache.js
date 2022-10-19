/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CacheDispatcher} from 'react-reconciler/src/ReactInternalTypes';

function createSignal(): AbortSignal {
  return new AbortController().signal;
}

export const DefaultCacheDispatcher: CacheDispatcher = {
  getCacheSignal(): AbortSignal {
    if (!currentCache) {
      throw new Error('Reading the cache is only supported while rendering.');
    }
    let entry: AbortSignal | void = (currentCache.get(createSignal): any);
    if (entry === undefined) {
      entry = createSignal();
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentCache.set(createSignal, entry);
    }
    return entry;
  },
  getCacheForType<T>(resourceType: () => T): T {
    if (!currentCache) {
      throw new Error('Reading the cache is only supported while rendering.');
    }

    let entry: T | void = (currentCache.get(resourceType): any);
    if (entry === undefined) {
      entry = resourceType();
      // TODO: Warn if undefined?
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentCache.set(resourceType, entry);
    }
    return entry;
  },
};

let currentCache: Map<Function, mixed> | null = null;

export function setCurrentCache(
  cache: Map<Function, mixed> | null,
): Map<Function, mixed> | null {
  currentCache = cache;
  return currentCache;
}

export function getCurrentCache(): Map<Function, mixed> | null {
  return currentCache;
}
