/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactStore} from 'shared/ReactTypes';
import {REACT_STORE_TYPE} from 'shared/ReactSymbols';
import {enableStore} from 'shared/ReactFeatureFlags';

export function createStore<T>(
  defaultValue: T,
  reducer?: (T, mixed) => T,
): ReactStore<T> {
  if (!enableStore) {
    throw new Error('Not implemented.');
  }

  const store: ReactStore<T> = {
    $$typeof: REACT_STORE_TYPE,

    _current: defaultValue,
    _sync: defaultValue,
    _transition: defaultValue,
  };

  return store;
}
