/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactStore} from 'shared/ReactTypes';

export function createStore<S, A>(
  reducer: (S, A) => S,
  initialValue: S,
): ReactStore<S, A> {
  const subscriptions = new Set<() => void>();

  const self = {
    _current: initialValue,
    _reducer: reducer,
    dispatch(action: A) {
      const nextValue = reducer(self._current, action);
      if (nextValue !== self._current) {
        self._current = nextValue;
        subscriptions.forEach(callback => callback());
      }
    },
    subscribe(callback: () => void): () => void {
      subscriptions.add(callback);
      return () => {
        subscriptions.delete(callback);
      };
    },
  };
  return self;
}
