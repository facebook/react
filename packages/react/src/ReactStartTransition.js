/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';

// Default to an arbitrarily large timeout. Effectively, this is infinite. The
// eventual goal is to never timeout when refreshing already visible content.
const IndefiniteTimeoutConfig = {timeoutMs: 100000};

export function startTransition(scope: () => void) {
  const previousConfig = ReactCurrentBatchConfig.suspense;
  ReactCurrentBatchConfig.suspense = IndefiniteTimeoutConfig;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.suspense = previousConfig;
  }
}
