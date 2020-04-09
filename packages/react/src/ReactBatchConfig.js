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

// Within the scope of the callback, mark all updates as being allowed to suspend.
export function withSuspenseConfig(scope: () => void, config?: SuspenseConfig) {
  const previousConfig = ReactCurrentBatchConfig.suspense;
  ReactCurrentBatchConfig.suspense = config === undefined ? null : config;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.suspense = previousConfig;
  }
}
