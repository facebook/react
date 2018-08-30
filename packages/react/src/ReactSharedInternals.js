/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  __interactionsRef,
  __subscriberRef,
  unstable_getThreadID as getThreadID,
} from 'interaction-tracking';
import assign from 'object-assign';
import ReactCurrentOwner from './ReactCurrentOwner';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';

const ReactSharedInternals = {
  ReactCurrentOwner,
  // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  assign,
  // Re-export the interaction-tracking API for UMD bundles.
  // This avoids introducing a dependency on a new UMD global in a minor update,
  // Since this would be a breaking change.
  InteractionTracking: {
    __interactionsRef,
    __subscriberRef,
    getThreadID,
  },
};

if (__DEV__) {
  Object.assign(ReactSharedInternals, {
    // These should not be included in production.
    ReactDebugCurrentFrame,
    // Shim for React DOM 16.0.0 which still destructured (but not used) this.
    // TODO: remove in React 17.0.
    ReactComponentTreeHook: {},
  });
}

export default ReactSharedInternals;
