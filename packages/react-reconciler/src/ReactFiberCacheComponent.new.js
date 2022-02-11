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
import type {StackCursor} from './ReactFiberStack.new';

import {enableCache} from 'shared/ReactFeatureFlags';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

import {isPrimaryRenderer} from './ReactFiberHostConfig';
import {createCursor, push, pop} from './ReactFiberStack.new';
import {pushProvider, popProvider} from './ReactFiberNewContext.new';
import * as Scheduler from 'scheduler';
import {getWorkInProgressRoot} from './ReactFiberWorkLoop.new';

export type Cache = {|
  controller: AbortController,
  data: Map<() => mixed, mixed>,
  refCount: number,
|};

export type CacheComponentState = {|
  +parent: Cache,
  +cache: Cache,
|};

export type SpawnedCachePool = {|
  +parent: Cache,
  +pool: Cache,
|};

// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
const {
  unstable_scheduleCallback: scheduleCallback,
  unstable_NormalPriority: NormalPriority,
} = Scheduler;

export const CacheContext: ReactContext<Cache> = enableCache
  ? {
      $$typeof: REACT_CONTEXT_TYPE,
      // We don't use Consumer/Provider for Cache components. So we'll cheat.
      Consumer: (null: any),
      Provider: (null: any),
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

// When retrying a Suspense/Offscreen boundary, we restore the cache that was
// used during the previous render by placing it here, on the stack.
const resumedCache: StackCursor<Cache | null> = createCursor(null);

// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).
export function createCache(): Cache {
  if (!enableCache) {
    return (null: any);
  }
  const cache: Cache = {
    controller: new AbortController(),
    data: new Map(),
    refCount: 0,
  };

  return cache;
}

export function retainCache(cache: Cache) {
  if (!enableCache) {
    return;
  }
  if (__DEV__) {
    if (cache.controller.signal.aborted) {
      console.warn(
        'A cache instance was retained after it was already freed. ' +
          'This likely indicates a bug in React.',
      );
    }
  }
  cache.refCount++;
}

// Cleanup a cache instance, potentially freeing it if there are no more references
export function releaseCache(cache: Cache) {
  if (!enableCache) {
    return;
  }
  cache.refCount--;
  if (__DEV__) {
    if (cache.refCount < 0) {
      console.warn(
        'A cache instance was released after it was already freed. ' +
          'This likely indicates a bug in React.',
      );
    }
  }
  if (cache.refCount === 0) {
    scheduleCallback(NormalPriority, () => {
      cache.controller.abort();
    });
  }
}

export function pushCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  pushProvider(workInProgress, CacheContext, cache);
}

export function popCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  popProvider(CacheContext, workInProgress);
}

function peekCacheFromPool(): Cache | null {
  if (!enableCache) {
    return (null: any);
  }

  // Check if the cache pool already has a cache we can use.

  // If we're rendering inside a Suspense boundary that is currently hidden,
  // we should use the same cache that we used during the previous render, if
  // one exists.
  const cacheResumedFromPreviousRender = resumedCache.current;
  if (cacheResumedFromPreviousRender !== null) {
    return cacheResumedFromPreviousRender;
  }

  // Otherwise, check the root's cache pool.
  const root = (getWorkInProgressRoot(): any);
  const cacheFromRootCachePool = root.pooledCache;

  return cacheFromRootCachePool;
}

export function requestCacheFromPool(renderLanes: Lanes): Cache {
  // Similar to previous function, except if there's not already a cache in the
  // pool, we allocate a new one.
  const cacheFromPool = peekCacheFromPool();
  if (cacheFromPool !== null) {
    return cacheFromPool;
  }

  // Create a fresh cache and add it to the root cache pool. A cache can have
  // multiple owners:
  // - A cache pool that lives on the FiberRoot. This is where all fresh caches
  //   are originally created (TODO: except during refreshes, until we implement
  //   this correctly). The root takes ownership immediately when the cache is
  //   created. Conceptually, root.pooledCache is an Option<Arc<Cache>> (owned),
  //   and the return value of this function is a &Arc<Cache> (borrowed).
  // - One of several fiber types: host root, cache boundary, suspense
  //   component. These retain and release in the commit phase.

  const root = (getWorkInProgressRoot(): any);
  const freshCache = createCache();
  root.pooledCache = freshCache;
  retainCache(freshCache);
  if (freshCache !== null) {
    root.pooledCacheLanes |= renderLanes;
  }
  return freshCache;
}

export function pushRootCachePool(root: FiberRoot) {
  if (!enableCache) {
    return;
  }
  // Note: This function currently does nothing but I'll leave it here for
  // code organization purposes in case that changes.
}

export function popRootCachePool(root: FiberRoot, renderLanes: Lanes) {
  if (!enableCache) {
    return;
  }
  // Note: This function currently does nothing but I'll leave it here for
  // code organization purposes in case that changes.
}

export function restoreSpawnedCachePool(
  offscreenWorkInProgress: Fiber,
  prevCachePool: SpawnedCachePool,
): SpawnedCachePool | null {
  if (!enableCache) {
    return (null: any);
  }
  const nextParentCache = isPrimaryRenderer
    ? CacheContext._currentValue
    : CacheContext._currentValue2;
  if (nextParentCache !== prevCachePool.parent) {
    // There was a refresh. Don't bother restoring anything since the refresh
    // will override it.
    return null;
  } else {
    // No refresh. Resume with the previous cache. New Cache boundaries in the
    // subtree use this one instead of requesting a fresh one (see
    // peekCacheFromPool).
    push(resumedCache, prevCachePool.pool, offscreenWorkInProgress);

    // Return the cache pool to signal that we did in fact push it. We will
    // assign this to the field on the fiber so we know to pop the context.
    return prevCachePool;
  }
}

export function popCachePool(workInProgress: Fiber) {
  if (!enableCache) {
    return;
  }
  pop(resumedCache, workInProgress);
}

export function getSuspendedCachePool(): SpawnedCachePool | null {
  if (!enableCache) {
    return null;
  }
  // This function is called when a Suspense boundary suspends. It returns the
  // cache that would have been used to render fresh data during this render,
  // if there was any, so that we can resume rendering with the same cache when
  // we receive more data.
  const cacheFromPool = peekCacheFromPool();
  if (cacheFromPool === null) {
    return null;
  }

  return {
    // We must also save the parent, so that when we resume we can detect
    // a refresh.
    parent: isPrimaryRenderer
      ? CacheContext._currentValue
      : CacheContext._currentValue2,
    pool: cacheFromPool,
  };
}

export function getOffscreenDeferredCachePool(): SpawnedCachePool | null {
  if (!enableCache) {
    return null;
  }

  const cacheFromPool = peekCacheFromPool();
  if (cacheFromPool === null) {
    return null;
  }

  return {
    // We must also store the parent, so that when we resume we can detect
    // a refresh.
    parent: isPrimaryRenderer
      ? CacheContext._currentValue
      : CacheContext._currentValue2,
    pool: cacheFromPool,
  };
}
