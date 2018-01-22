/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'fbjs/lib/invariant';

export const enableAsyncSubtreeAPI = true;
// Exports ReactDOM.createRoot
export const enableCreateRoot = false;
export const enableUserTimingAPI = __DEV__;

// Mutating mode (React DOM, React ART, React Native):
export const enableMutatingReconciler = true;
// Experimental noop mode (currently unused):
export const enableNoopReconciler = false;
// Experimental persistent mode (Fabric):
export const enablePersistentReconciler = false;

// Helps identify side effects in begin-phase lifecycle hooks and setState reducers:
export const debugRenderPhaseSideEffects = false;

// Warn about deprecated, async-unsafe lifecycles; relates to RFC #6:
export const warnAboutDeprecatedLifecycles = false;

// Only used in www builds.
export function addUserTimingListener() {
  invariant(false, 'Not implemented.');
}
