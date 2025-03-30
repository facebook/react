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

export function pushPendingGestureTransitionTypes(): null | TransitionTypes {
  const prev = pendingGestureTransitionTypes;
  pendingGestureTransitionTypes = null;
  return prev;
}

export function popPendingGestureTransitionTypes(
  prev: null | TransitionTypes,
): void {
  pendingGestureTransitionTypes = prev;
}

export function addTransitionType(type: string): void {
  if (enableViewTransition) {
    let pendingTransitionTypes: null | TransitionTypes;
    if (
      enableGestureTransition &&
      ReactSharedInternals.T !== null &&
      ReactSharedInternals.T.gesture !== null
    ) {
      // We're inside a startGestureTransition which is always sync.
      pendingTransitionTypes = pendingGestureTransitionTypes;
      if (pendingTransitionTypes === null) {
        pendingTransitionTypes = pendingGestureTransitionTypes = [];
      }
    } else {
      if (__DEV__) {
        if (
          ReactSharedInternals.T === null &&
          ReactSharedInternals.asyncTransitions === 0
        ) {
          if (enableGestureTransition) {
            console.error(
              'addTransitionType can only be called inside a `startTransition()` ' +
                'or `startGestureTransition()` callback. ' +
                'It must be associated with a specific Transition.',
            );
          } else {
            console.error(
              'addTransitionType can only be called inside a `startTransition()` ' +
                'callback. It must be associated with a specific Transition.',
            );
          }
        }
      }
      // Otherwise we're either inside a synchronous startTransition
      // or in the async gap of one, which we track globally.
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
