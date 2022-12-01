/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CacheDispatcher} from './ReactInternalTypes';
import type {Cache} from './ReactFiberCacheComponent';

import {enableCache} from 'shared/ReactFeatureFlags';
import {readContext} from './ReactFiberNewContext';
import {CacheContext} from './ReactFiberCacheComponent';

function getCacheSignal(): AbortSignal {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache: Cache = readContext(CacheContext);
  return cache.controller.signal;
}

function getCacheForType<T>(resourceType: () => T): T {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache: Cache = readContext(CacheContext);
  let cacheForType: T | void = (cache.data.get(resourceType): any);
  if (cacheForType === undefined) {
    cacheForType = resourceType();
    cache.data.set(resourceType, cacheForType);
  }
  return cacheForType;
}

export const DefaultCacheDispatcher: CacheDispatcher = {
  getCacheSignal,
  getCacheForType,
};
