/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

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

export function pushCacheProvider(
  workInProgress: Fiber,
  cacheInstance: CacheInstance,
) {
  pushProvider(workInProgress, CacheContext, cacheInstance);
}

export function popCacheProvider(
  workInProgress: Fiber,
  // We don't actually use the cache instance object, but you're not supposed to
  // call this function unless it exists.
  cacheInstance: CacheInstance,
) {
  popProvider(CacheContext, workInProgress);
}
