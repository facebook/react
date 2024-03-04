/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {disableLegacyMode} from 'shared/ReactFeatureFlags';
import {DiscreteEventPriority} from 'react-reconciler/src/ReactEventPriorities';

import ReactSharedInternals from 'shared/ReactSharedInternals';
const ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher =
  ReactDOMSharedInternals.ReactDOMCurrentDispatcher;
const ReactDOMCurrentEventConfig =
  ReactDOMSharedInternals.ReactDOMCurrentEventConfig;

declare function flushSyncImpl<R>(fn: () => R): R;
declare function flushSyncImpl(void): void;
function flushSyncImpl<R>(fn: (() => R) | void): R | void {
  const previousTransition = ReactCurrentBatchConfig.transition;
  const preivousEventPriority = ReactDOMCurrentEventConfig.eventPriority;

  try {
    ReactCurrentBatchConfig.transition = null;
    ReactDOMCurrentEventConfig.eventPriority = DiscreteEventPriority;
    if (fn) {
      return fn();
    } else {
      return undefined;
    }
  } finally {
    ReactCurrentBatchConfig.transition = previousTransition;
    ReactDOMCurrentEventConfig.eventPriority = preivousEventPriority;
    ReactDOMCurrentDispatcher.current.flushSyncWork();
  }
}

declare function flushSyncErrorInBuildsThatSupportLegacyMode<R>(fn: () => R): R;
declare function flushSyncErrorInBuildsThatSupportLegacyMode(void): void;
function flushSyncErrorInBuildsThatSupportLegacyMode() {
  // eslint-disable-next-line react-internal/prod-error-codes
  throw new Error(
    'Expected this build of React to not support legacy mode but it does. This is a bug in React.',
  );
}

export const flushSync: typeof flushSyncImpl = disableLegacyMode
  ? flushSyncImpl
  : flushSyncErrorInBuildsThatSupportLegacyMode;
