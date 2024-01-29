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
import {
  enableAsyncActions,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';

export function startTransition(
  scope: () => void,
  options?: StartTransitionOptions,
) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  // Each renderer registers a callback to receive the return value of
  // the scope function. This is used to implement async actions.
  const callbacks = new Set<(BatchConfigTransition, mixed) => mixed>();
  const transition: BatchConfigTransition = {
    _callbacks: callbacks,
  };
  ReactCurrentBatchConfig.transition = transition;
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

  if (enableAsyncActions) {
    try {
      const returnValue = scope();
      if (
        typeof returnValue === 'object' &&
        returnValue !== null &&
        typeof returnValue.then === 'function'
      ) {
        callbacks.forEach(callback => callback(currentTransition, returnValue));
        returnValue.then(noop, onError);
      }
    } catch (error) {
      onError(error);
    } finally {
      warnAboutTransitionSubscriptions(prevTransition, currentTransition);
      ReactCurrentBatchConfig.transition = prevTransition;
    }
  } else {
    // When async actions are not enabled, startTransition does not
    // capture errors.
    try {
      scope();
    } finally {
      warnAboutTransitionSubscriptions(prevTransition, currentTransition);
      ReactCurrentBatchConfig.transition = prevTransition;
    }
  }
}

function warnAboutTransitionSubscriptions(
  prevTransition: BatchConfigTransition | null,
  currentTransition: BatchConfigTransition,
) {
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

function noop() {}

// Use reportError, if it exists. Otherwise console.error. This is the same as
// the default for onRecoverableError.
const onError =
  typeof reportError === 'function'
    ? // In modern browsers, reportError will dispatch an error event,
      // emulating an uncaught JavaScript error.
      reportError
    : (error: mixed) => {
        // In older browsers and test environments, fallback to console.error.
        // eslint-disable-next-line react-internal/no-production-logging
        console['error'](error);
      };
