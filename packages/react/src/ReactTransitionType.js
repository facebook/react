/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  enableViewTransition,
  enableGestureTransition,
} from 'shared/ReactFeatureFlags';

export type TransitionTypes = Array<string>;

// This one is only available synchronously so we don't need to use ReactSharedInternals
// for this state. Instead, we track it in isomorphic and pass it to the renderer.
export let pendingGestureTransitionTypes: null | TransitionTypes = null;

export function addTransitionType(type: string): void {
  if (enableViewTransition) {
    let pendingTransitionTypes: null | TransitionTypes = null;
    if (
      enableGestureTransition &&
      ReactSharedInternals.T !== null &&
      ReactSharedInternals.T.gesture !== null
    ) {
    } else {
      pendingTransitionTypes = ReactSharedInternals.V;
      if (pendingTransitionTypes === null) {
        pendingTransitionTypes = ReactSharedInternals.V = [];
      }
    }
    if (pendingTransitionTypes.indexOf(type) === -1) {
      pendingTransitionTypes.push(type);
    }
  }
}
