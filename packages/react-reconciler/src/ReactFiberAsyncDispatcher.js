/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AsyncDispatcher, Fiber} from './ReactInternalTypes';
import type {Cache} from './ReactFiberCacheComponent';

import {enableCache} from 'shared/ReactFeatureFlags';
import {readContext} from './ReactFiberNewContext';
import {CacheContext} from './ReactFiberCacheComponent';

import {disableStringRefs} from 'shared/ReactFeatureFlags';

import {current as currentOwner} from './ReactCurrentFiber';

function getActiveCache(): Map<Function, mixed> {
  const cache: Cache = readContext(CacheContext);

  return cache.data;
}

function getCacheForType<T>(resourceType: () => T): T {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache = getActiveCache();
  let cacheForType: T | void = (cache.get(resourceType): any);
  if (cacheForType === undefined) {
    cacheForType = resourceType();
    cache.set(resourceType, cacheForType);
  }
  return cacheForType;
}

export const DefaultAsyncDispatcher: AsyncDispatcher = ({
  getActiveCache,
  getCacheForType,
}: any);

if (__DEV__ || !disableStringRefs) {
  DefaultAsyncDispatcher.getOwner = (): null | Fiber => {
    return currentOwner;
  };
}
