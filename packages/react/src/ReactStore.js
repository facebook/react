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
  return {
    _current: initialValue,
    _reducer: reducer,
  };
}
