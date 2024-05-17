/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

export let currentOwner: Fiber | null = null;

export function setCurrentOwner(fiber: null | Fiber) {
  currentOwner = fiber;
}
