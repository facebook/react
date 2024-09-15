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

import ReactSharedInternals from 'shared/ReactSharedInternals';

import {
  enableAsyncActions,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';

import reportGlobalError from 'shared/reportGlobalError';

export function startTransition(
  scope: () => void,
  options?: StartTransitionOptions,
) {
  const prevTransition = ReactSharedInternals.T;
  const transition: BatchConfigTransition = {};
  ReactSharedInternals.T = transition;
  const currentTransition = ReactSharedInternals.T;

  if (__DEV__) {
    ReactSharedInternals.T._updatedFibers = new Set();
  }

  if (enableTransitionTracing) {
    if (options !== undefined && options.name !== undefined) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      ReactSharedInternals.T.name = options.name;
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      ReactSharedInternals.T.startTime = -1;
    }
  }

  if (enableAsyncActions) {
    try {
      const returnValue = scope();
      const onStartTransitionFinish = ReactSharedInternals.S;
      if (onStartTransitionFinish !== null) {
        onStartTransitionFinish(transition, returnValue);
      }
      if (
        typeof returnValue === 'object' &&
        returnValue !== null &&
        typeof returnValue.then === 'function'
      ) {
        returnValue.then(noop, reportGlobalError);
      }
    } catch (error) {
      reportGlobalError(error);
    } finally {
      warnAboutTransitionSubscriptions(prevTransition, currentTransition);
      ReactSharedInternals.T = prevTransition;
    }
  } else {
    // When async actions are not enabled, startTransition does not
    // capture errors.
    try {
      scope();
    } finally {
      warnAboutTransitionSubscriptions(prevTransition, currentTransition);
      ReactSharedInternals.T = prevTransition;
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
