/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';

export function startTransition(scope: () => void) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  const currentTransition = ReactCurrentBatchConfig.transition;

  if (__DEV__) {
    ReactCurrentBatchConfig.transition._updatedFibers = new Set();
  }
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;

    if (__DEV__) {
      if (prevTransition === null && currentTransition._updatedFibers) {
        const updatedFibersCount = currentTransition._updatedFibers.size;
        if (updatedFibersCount > 10) {
          console.warn(
            'Detected a large number of updates inside startTransition. ' +
              'If this is due to a subscription please re-write it to use React provided hooks. ' +
              'Otherwise concurrent mode guarantees are off the table.',
          );
        }
        currentTransition._updatedFibers.clear();
      }
    }
  }
}
