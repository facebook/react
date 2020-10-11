/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assign from 'object-assign';
import ReactCurrentDispatcher from 'shared/ReactCurrentDispatcher';
import ReactCurrentBatchConfig from 'shared/ReactCurrentBatchConfig';
import ReactCurrentOwner from 'shared/ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';
import IsSomeRendererActing from 'shared/IsSomeRendererActing';

const ReactSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentBatchConfig,
  ReactCurrentOwner,
  IsSomeRendererActing,
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign,
};

if (__DEV__) {
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
}

export default ReactSharedInternals;
