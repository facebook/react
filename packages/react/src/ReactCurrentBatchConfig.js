/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import {warnOnSubscriptionInsideStartTransition} from 'shared/ReactFeatureFlags';

type BatchConfig = {
  transition: number,
  _updatedFibers?: Set<Fiber>,
};
/**
 * Keeps track of the current batch's configuration such as how long an update
 * should suspend for if it needs to.
 */
const ReactCurrentBatchConfig: BatchConfig = {
  transition: 0,
};

if (__DEV__) {
  ReactCurrentBatchConfig._updatedFibers = new Set();
}

export function warnIfSubscriptionDetected() {
  if (
    __DEV__ &&
    warnOnSubscriptionInsideStartTransition &&
    ReactCurrentBatchConfig._updatedFibers
  ) {
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

export default ReactCurrentBatchConfig;
