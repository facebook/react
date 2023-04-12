/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CacheDispatcher} from 'react-reconciler/src/ReactInternalTypes';

import {
  supportsRequestStorage,
  requestStorage,
} from './ReactFlightServerConfig';

function createSignal(): AbortSignal {
  return new AbortController().signal;
}

function resolveCache(): Map<Function, mixed> {
  if (currentCache) return currentCache;
  if (supportsRequestStorage) {
    const cache = requestStorage.getStore();
    if (cache) return cache;
  }
  // Since we override the dispatcher all the time, we're effectively always
  // active and so to support cache() and fetch() outside of render, we yield
  // an empty Map.
  return new Map();
}

export const DefaultCacheDispatcher: CacheDispatcher = {
  getCacheSignal(): AbortSignal {
    const cache = resolveCache();
    let entry: AbortSignal | void = (cache.get(createSignal): any);
    if (entry === undefined) {
      entry = createSignal();
      cache.set(createSignal, entry);
    }
    return entry;
  },
  getCacheForType<T>(resourceType: () => T): T {
    const cache = resolveCache();
    let entry: T | void = (cache.get(resourceType): any);
    if (entry === undefined) {
      entry = resourceType();
      // TODO: Warn if undefined?
      cache.set(resourceType, entry);
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
