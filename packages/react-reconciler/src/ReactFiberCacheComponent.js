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

export type Cache = {|
  providers: Set<Fiber> | null,
  data: Map<() => mixed, mixed> | null,
|};

export const CacheContext: ReactContext<Cache | null> = {
  $$typeof: REACT_CONTEXT_TYPE,
  // We don't use Consumer/Provider for Cache components. So we'll cheat.
  Consumer: (null: any),
  Provider: (null: any),
  _calculateChangedBits: null,
  _currentValue: null,
  _currentValue2: null,
  _threadCount: 0,
};

if (__DEV__) {
  CacheContext._currentRenderer = null;
  CacheContext._currentRenderer2 = null;
}
