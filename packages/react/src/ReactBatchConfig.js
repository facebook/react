/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SuspenseConfig} from 'react-reconciler/src/ReactFiberSuspenseConfig';

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';

const DefaultSuspenseConfig: SuspenseConfig = {
  timeoutMs: 5000,
  loadingDelayMs: 0,
  minLoadingDurationMs: 0,
};

// Within the scope of the callback, mark all updates as being allowed to suspend.
export function suspendIfNeeded(scope: () => void, config?: SuspenseConfig) {
  const previousConfig = ReactCurrentBatchConfig.suspense;
  ReactCurrentBatchConfig.suspense = config || DefaultSuspenseConfig;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.suspense = previousConfig;
  }
}
