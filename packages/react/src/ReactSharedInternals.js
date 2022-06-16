/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactCurrentDispatcher from './ReactCurrentDispatcher';
import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import ReactCurrentActQueue from './ReactCurrentActQueue';
import ReactCurrentOwner from './ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';
import {enableServerContext} from 'shared/ReactFeatureFlags';
import {ContextRegistry} from './ReactServerContextRegistry';

const ReactSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentBatchConfig,
  ReactCurrentOwner,
};

if (__DEV__) {
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
  ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
}

if (enableServerContext) {
  ReactSharedInternals.ContextRegistry = ContextRegistry;
}

export default ReactSharedInternals;
