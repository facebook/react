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

function defaultReducer<S>(state: S, action: S | ((prev: S) => S)): S {
  if (typeof action === 'function') {
    // State value itself is not allowed to be a function, so we can safely
    // assume we are in the `(prev: S) => S` case here.
    // $FlowFixMe[incompatible-use]
    return action(state);
  }
  return action;
}

declare function createStore<S>(initialValue: S): ReactStore<S, (prev: S) => S>;

export function createStore<S, A>(
  initialValue: S,
  reducer?: (S, A) => S,
): ReactStore<S, A> {
  if (!enableStore) {
    throw new Error(
      'createStore is not available because the enableStore feature flag is not enabled.',
    );
  }
  const actualReducer = reducer ?? (defaultReducer: any);

  const subscriptions = new Set<(action: A) => void>();

  let state = initialValue;

  return {
    getState(): S {
      return state;
    },
    reducer: actualReducer,
    dispatch(action: A) {
      state = actualReducer(state, action);
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
