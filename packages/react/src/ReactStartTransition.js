/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {BatchConfigTransition} from 'react-reconciler/src/ReactFiberTracingMarkerComponent';
import type {StartTransitionOptions} from 'shared/ReactTypes';

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import {enableTransitionTracing} from 'shared/ReactFeatureFlags';

export function startTransition(
  scope: () => void,
  options?: StartTransitionOptions,
) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = ({}: BatchConfigTransition);
  const currentTransition = ReactCurrentBatchConfig.transition;

  if (__DEV__) {
    ReactCurrentBatchConfig.transition._updatedFibers = new Set();
  }

  if (enableTransitionTracing) {
    if (options !== undefined && options.name !== undefined) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      ReactCurrentBatchConfig.transition.name = options.name;
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      ReactCurrentBatchConfig.transition.startTime = -1;
    }
  }

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;

    if (__DEV__) {
      if (prevTransition === null && currentTransition._updatedFibers) {
        const updatedFibersCount = currentTransition._updatedFibers.size;
        currentTransition._updatedFibers.clear();
        if (updatedFibersCount > 10) {
          console.warn(
            'Detected a large number of updates inside startTransition. ' +
              'If this is due to a subscription please re-write it to use React provided hooks. ' +
              'Otherwise concurrent mode guarantees are off the table.',
          );
        }
      }
    }
  }
}
