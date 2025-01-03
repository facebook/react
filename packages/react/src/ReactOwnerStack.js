/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableOwnerStacks} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';

export function captureOwnerStack(): null | string {
  if (!enableOwnerStacks || !__DEV__) {
    return null;
  }
  const getCurrentStack = ReactSharedInternals.getCurrentStack;
  if (getCurrentStack === null) {
    return null;
  }
  // The current stack will be the owner stack if enableOwnerStacks is true
  // which it is always here. Otherwise it's the parent stack.
  return getCurrentStack();
}
