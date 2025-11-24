/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactStore} from 'shared/ReactTypes';
import {enableStore} from 'shared/ReactFeatureFlags';

export function createStore<S, A>(
  reducer: (S, A) => S,
  initialValue: S,
): ReactStore<S, A> {
  if (!enableStore) {
    throw new Error(
      'createStore is not available because the enableStore feature flag is not enabled.',
    );
  }

  const subscriptions = new Set<(action: A) => void>();

  let state = initialValue;

  return {
    getState(): S {
      return state;
    },
    reducer: reducer,
    dispatch(action: A) {
      state = reducer(state, action);
      subscriptions.forEach(callback => callback(action));
    },
    subscribe(callback: (action: A) => void): () => void {
      subscriptions.add(callback);
      return () => {
        subscriptions.delete(callback);
      };
    },
  };
}
