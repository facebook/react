/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactCurrentOwner from './ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';
import {enableServerContext} from 'shared/ReactFeatureFlags';
import {ContextRegistry} from './ReactServerContextRegistry';

const ReactSharedInternals = {
  ReactCurrentOwner,
};

if (__DEV__) {
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
}

if (enableServerContext) {
  ReactSharedInternals.ContextRegistry = ContextRegistry;
}

export default ReactSharedInternals;
