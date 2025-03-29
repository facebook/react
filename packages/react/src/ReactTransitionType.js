/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {enableViewTransition} from 'shared/ReactFeatureFlags';

export type TransitionTypes = Array<string>;

export function addTransitionType(type: string): void {
  if (enableViewTransition) {
    const pendingTransitionTypes: null | TransitionTypes =
      ReactSharedInternals.V;
    if (pendingTransitionTypes === null) {
      ReactSharedInternals.V = [type];
    } else if (pendingTransitionTypes.indexOf(type) === -1) {
      pendingTransitionTypes.push(type);
    }
  }
}
