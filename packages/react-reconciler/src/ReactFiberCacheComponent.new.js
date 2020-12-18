/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';
import type {FiberRoot} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane.new';

import {enableCache} from 'shared/ReactFeatureFlags';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';
import {HostRoot} from './ReactWorkTags';

import {pushProvider, popProvider} from './ReactFiberNewContext.new';

export type Cache = Map<() => mixed, mixed>;

export type SuspendedCacheFresh = {|
  tag: 0,
  cache: Cache,
|};

export type SuspendedCachePool = {|
  tag: 1,
  cache: Cache,
|};

export type SuspendedCache = SuspendedCacheFresh | SuspendedCachePool;

export const SuspendedCacheFreshTag = 0;
export const SuspendedCachePoolTag = 1;

export const CacheContext: ReactContext<Cache> = enableCache
  ? {
      $$typeof: REACT_CONTEXT_TYPE,
      // We don't use Consumer/Provider for Cache components. So we'll cheat.
      Consumer: (null: any),
      Provider: (null: any),
      _calculateChangedBits: null,
      // We'll initialize these at the root.
      _currentValue: (null: any),
      _currentValue2: (null: any),
      _threadCount: 0,
    }
  : (null: any);

if (__DEV__ && enableCache) {
  CacheContext._currentRenderer = null;
  CacheContext._currentRenderer2 = null;
}

// A parent cache refresh always overrides any nested cache. So there will only
// ever be a single fresh cache on the context stack.
let freshCache: Cache | null = null;

// The cache that we retrived from the pool during this render, if any
let pooledCache: Cache | null = null;

export function pushStaleCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (freshCache !== null) {
      console.error(
        'Already inside a fresh cache boundary. This is a bug in React.',
      );
    }
  }
  pushProvider(workInProgress, CacheContext, cache);
}

export function pushFreshCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (
      freshCache !== null &&
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
  freshCache = cache;
  pushProvider(workInProgress, CacheContext, cache);
}

export function popCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (freshCache !== null && freshCache !== cache) {
      console.error(
        'Unexpected cache instance on context. This is a bug in React.',
      );
    }
  }
  freshCache = null;
  popProvider(CacheContext, workInProgress);
}

export function hasFreshCacheProvider() {
  if (!enableCache) {
    return false;
  }
  return freshCache !== null;
}

export function getFreshCacheProviderIfExists(): Cache | null {
  if (!enableCache) {
    return null;
  }
  return freshCache;
}

export function requestCacheFromPool(renderLanes: Lanes): Cache {
  if (!enableCache) {
    return (null: any);
  }
  if (pooledCache !== null) {
    return pooledCache;
  }
  // Create a fresh cache.
  pooledCache = new Map();
  return pooledCache;
}

export function getPooledCacheIfExists(): Cache | null {
  return pooledCache;
}

export function pushRootCachePool(root: FiberRoot) {
  if (!enableCache) {
    return;
  }
  // When we start rendering a tree, read the pooled cache for this render
  // from `root.pooledCache`. If it's currently `null`, we will lazily
  // initialize it the first type it's requested. However, we only mutate
  // the root itself during the complete/unwind phase of the HostRoot.
  pooledCache = root.pooledCache;
}

export function popRootCachePool(root: FiberRoot, renderLanes: Lanes) {
  if (!enableCache) {
    return;
  }
  // The `pooledCache` variable points to the cache that was used for new
  // cache boundaries during this render, if any. Stash it on the root so that
  // parallel transitions may share the same cache. We will clear this field
  // once all the transitions that depend on it (which we track with
  // `pooledCacheLanes`) have committed.
  root.pooledCache = pooledCache;
  root.pooledCacheLanes |= renderLanes;
}

export function pushCachePool(suspendedCache: SuspendedCachePool) {
  if (!enableCache) {
    return;
  }
  // This will temporarily override the pooled cache for this render, so that
  // any new Cache boundaries in the subtree use this one. The previous value on
  // the "stack" is stored on the cache instance. We will restore it during the
  // complete phase.
  //
  // The more straightforward way to do this would be to use the array-based
  // stack (push/pop). Maybe this is too clever.
  const prevPooledCacheOnStack = pooledCache;
  pooledCache = suspendedCache.cache;
  // This is never supposed to be null. I'm cheating. Sorry. It will be reset to
  // the correct type when we pop.
  suspendedCache.cache = ((prevPooledCacheOnStack: any): Cache);
}

export function popCachePool(suspendedCache: SuspendedCachePool) {
  if (!enableCache) {
    return;
  }
  const retryCache: Cache = (pooledCache: any);
  if (__DEV__) {
    if (retryCache === null) {
      console.error('Expected to have a pooled cache. This is a bug in React.');
    }
  }
  pooledCache = suspendedCache.cache;
  suspendedCache.cache = retryCache;
}
