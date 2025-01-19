/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableViewTransition} from 'shared/ReactFeatureFlags';

export let viewTransitionMutationContext: boolean = false;

export function pushMutationContext(): boolean {
  if (!enableViewTransition) {
    return false;
  }
  const prev = viewTransitionMutationContext;
  viewTransitionMutationContext = false;
  return prev;
}

export function popMutationContext(prev: boolean): void {
  if (enableViewTransition) {
    viewTransitionMutationContext = prev;
  }
}

export function trackHostMutation(): void {
  if (enableViewTransition) {
    viewTransitionMutationContext = true;
  }
}
