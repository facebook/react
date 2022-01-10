/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {StartTransitionOptions} from 'shared/ReactTypes';

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import {
  warnOnSubscriptionInsideStartTransition,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';

export function startTransition(
  scope: () => void,
  options?: StartTransitionOptions,
) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;

  let prevTransitionInfo = null;
  if (enableTransitionTracing) {
    prevTransitionInfo = ReactCurrentBatchConfig.transitionInfo;
    if (options !== undefined && options.name !== undefined) {
      ReactCurrentBatchConfig.transitionInfo = {
        name: options.name,
        startTime: -1,
      };
    } else {
      ReactCurrentBatchConfig.transitionInfo = null;
    }
  }

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;

    if (enableTransitionTracing) {
      ReactCurrentBatchConfig.transitionInfo = prevTransitionInfo;
    }

    if (__DEV__) {
      if (
        prevTransition !== 1 &&
        warnOnSubscriptionInsideStartTransition &&
        ReactCurrentBatchConfig._updatedFibers
      ) {
        const updatedFibersCount = ReactCurrentBatchConfig._updatedFibers.size;
        if (updatedFibersCount > 10) {
          console.warn(
            'Detected a large number of updates inside startTransition. ' +
              'If this is due to a subscription please re-write it to use React provided hooks. ' +
              'Otherwise concurrent mode guarantees are off the table.',
          );
        }
        ReactCurrentBatchConfig._updatedFibers.clear();
      }
    }
  }
}
