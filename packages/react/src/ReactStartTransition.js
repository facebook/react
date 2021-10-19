/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import {warnOnSubscriptionInsideStartTransition} from 'shared/ReactFeatureFlags';
import {getInteractionID} from 'shared/getInteractionID';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

const {unstable_now: now} = Scheduler;

export function startTransition(scope: () => void, name?: string) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  const prevTransitionInfo = ReactCurrentBatchConfig.transitionInfo;
  ReactCurrentBatchConfig.transition = 1;
  if (name) {
    ReactCurrentBatchConfig.transitionInfo = {
      id: getInteractionID(),
      name,
      startTime: now(),
    };
  } else {
    ReactCurrentBatchConfig.transitionInfo = null;
  }
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
    ReactCurrentBatchConfig.transitionInfo = prevTransitionInfo;
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
