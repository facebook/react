/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TransitionTypes} from 'react/src/ReactTransitionType';

import {enableViewTransition} from 'shared/ReactFeatureFlags';

let queuedTransitionTypes: null | TransitionTypes = null;

export function queueTransitionTypes(
  transitionTypes: null | TransitionTypes,
): void {
  // Currently, we assume that all Transitions are batched together into a global single commit.
  if (enableViewTransition && transitionTypes !== null) {
    let queued = queuedTransitionTypes;
    if (queued === null) {
      queued = queuedTransitionTypes = [];
    }
    for (let i = 0; i < transitionTypes.length; i++) {
      const transitionType = transitionTypes[i];
      if (queued.indexOf(transitionType) === -1) {
        queued.push(transitionType);
      }
    }
  }
}

export function claimQueuedTransitionTypes(): null | TransitionTypes {
  const claimed = queuedTransitionTypes;
  queuedTransitionTypes = null;
  return claimed;
}
