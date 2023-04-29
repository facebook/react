/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CacheDispatcher} from 'react-reconciler/src/ReactInternalTypes';

import {resolveRequest, getCache} from '../ReactFlightServer';

function createSignal(): AbortSignal {
  return new AbortController().signal;
}

function resolveCache(): Map<Function, mixed> {
  const request = resolveRequest();
  if (request) {
    return getCache(request);
  }
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
