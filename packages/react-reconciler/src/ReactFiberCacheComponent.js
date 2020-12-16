/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import {enableCache} from 'shared/ReactFeatureFlags';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';
import {HostRoot} from './ReactWorkTags';

import {pushProvider, popProvider} from './ReactFiberNewContext.new';

export type Cache = Map<() => mixed, mixed>;

export type CacheInstance = {|
  cache: Cache | null,
  provider: Fiber,
|};

export const CacheContext: ReactContext<CacheInstance> = {
  $$typeof: REACT_CONTEXT_TYPE,
  // We don't use Consumer/Provider for Cache components. So we'll cheat.
  Consumer: (null: any),
  Provider: (null: any),
  _calculateChangedBits: null,
  // We'll initialize these at the root.
  _currentValue: (null: any),
  _currentValue2: (null: any),
  _threadCount: 0,
};

if (__DEV__) {
  CacheContext._currentRenderer = null;
  CacheContext._currentRenderer2 = null;
}

// A parent cache refresh always overrides any nested cache. So there will only
// ever be a single fresh cache on the context stack.
let freshCacheInstance: CacheInstance | null = null;

export function pushStaleCacheProvider(
  workInProgress: Fiber,
  cacheInstance: CacheInstance,
) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (freshCacheInstance !== null) {
      console.error(
        'Already inside a fresh cache boundary. This is a bug in React.',
      );
    }
  }
  pushProvider(workInProgress, CacheContext, cacheInstance);
}

export function pushFreshCacheProvider(
  workInProgress: Fiber,
  cacheInstance: CacheInstance,
) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (
      freshCacheInstance !== null &&
      // TODO: Remove this exception for roots. There are a few tests that throw
      // in pushHostContainer, before the cache context is pushed. Not a huge
      // issue, but should still fix.
      workInProgress.tag !== HostRoot
    ) {
      console.error(
        'Already inside a fresh cache boundary. This is a bug in React.',
      );
    }
  }
  freshCacheInstance = cacheInstance;
  pushProvider(workInProgress, CacheContext, cacheInstance);
}

export function popCacheProvider(
  workInProgress: Fiber,
  cacheInstance: CacheInstance,
) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (freshCacheInstance !== null && freshCacheInstance !== cacheInstance) {
      console.error(
        'Unexpected cache instance on context. This is a bug in React.',
      );
    }
  }
  freshCacheInstance = null;
  popProvider(CacheContext, workInProgress);
}

export function hasFreshCacheProvider() {
  if (!enableCache) {
    return false;
  }
  return freshCacheInstance !== null;
}

export function getFreshCacheProviderIfExists(): CacheInstance | null {
  if (!enableCache) {
    return null;
  }
  return freshCacheInstance;
}
