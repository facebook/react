/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const enableAsyncSubtreeAPI = true;
export const enableAsyncSchedulingByDefaultInReactDOM = false;
// Exports React.Fragment
export const enableReactFragment = false;
// Exports ReactDOM.createRoot
export const enableCreateRoot = false;

// Mutating mode (React DOM, React ART, React Native):
export const enableMutatingReconciler = true;
// Experimental noop mode (currently unused):
export const enableNoopReconciler = false;
// Experimental persistent mode (CS):
export const enablePersistentReconciler = false;
