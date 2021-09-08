/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';

/**
 *  If a certain number of fibers are updated inside startTransition then we suspect
 *  that a user-space defined subscription is being wrapped by startTransition.
 *  This is no good, they should instead use built-in APIs for concurrent mode to work correctly.
 */

export function startTransition(scope: () => void) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
    if (__DEV__ && ReactCurrentBatchConfig._updatedFibers) {
      const updatedFibersCount = ReactCurrentBatchConfig._updatedFibers.size;
      if (updatedFibersCount > 10) {
        if (__DEV__) {
          console.warn(
            'Detected a suspicious number of fibers being updated (10) inside startTransition. ' +
              'If this is due to a user-space defined subscription please re-write ' +
              'it to use React provided hooks. Otherwise concurrent mode guarantees ' +
              'are off the table.',
          );
        }
      }
      ReactCurrentBatchConfig._updatedFibers.clear();
    }
  }
}
