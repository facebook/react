/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type FeatureFlags = {|
  enableAsyncSubtreeAPI: boolean,
  enableAsyncSchedulingByDefaultInReactDOM: boolean,
  enableMutatingReconciler: boolean,
  enableNoopReconciler: boolean,
  enablePersistentReconciler: boolean,
  enableReactFragment: boolean,
  enableCreateRoot: boolean,
|};

var ReactFeatureFlags: FeatureFlags = {
  enableAsyncSubtreeAPI: true,
  enableAsyncSchedulingByDefaultInReactDOM: false,
  // Mutating mode (React DOM, React ART, React Native):
  enableMutatingReconciler: true,
  // Experimental noop mode (currently unused):
  enableNoopReconciler: false,
  // Experimental persistent mode (CS):
  enablePersistentReconciler: false,
  // Exports React.Fragment
  enableReactFragment: false,
  // Exports ReactDOM.createRoot
  enableCreateRoot: false,
};

if (__DEV__) {
  if (Object.freeze) {
    Object.freeze(ReactFeatureFlags);
  }
}

export default ReactFeatureFlags;
