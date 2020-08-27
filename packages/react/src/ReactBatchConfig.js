/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SuspenseConfig} from 'react-reconciler/src/ReactFiberTransition';

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';

// This is a copy of startTransition, except if null or undefined is passed,
// then updates inside the scope are opted-out of the outer transition scope.
// TODO: Deprecated. Remove in favor of startTransition. Figure out how scopes
// should nest, and whether we need an API to opt-out nested scopes.
export function withSuspenseConfig(scope: () => void, config?: SuspenseConfig) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition =
    config === undefined || config === null ? 0 : 1;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
