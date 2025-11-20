/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactStore} from 'shared/ReactTypes';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import is from 'shared/objectIs';

export function createStore<S, A>(
  reducer: (S, A) => S,
  initialValue: S,
): ReactStore<S, A> {
  const subscriptions = new Set<() => void>();

  const self = {
    _current: initialValue,
    _transition: initialValue,
    _reducer: reducer,
    dispatch(action: A) {
      if (ReactSharedInternals.T !== null) {
        // We are in a transition, update the transition state
        self._transition = reducer(self._transition, action);
      } else if (is(self._current, self._transition)) {
        // We are updating sync and no transition is in progress, update both
        self._current = self._transition = reducer(self._transition, action);
      } else {
        // We are updating sync, but a transition is in progress. Implement
        // React's update reordering semantics.
        self._transition = reducer(self._transition, action);
        self._current = reducer(self._current, action);
      }
      subscriptions.forEach(callback => callback());
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
