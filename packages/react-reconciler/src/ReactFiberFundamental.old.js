/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {
  ReactFundamentalImpl,
  ReactFundamentalComponentInstance,
} from 'shared/ReactTypes';

export function createFundamentalStateInstance<C, H>(
  currentFiber: Fiber,
  props: Object,
  impl: ReactFundamentalImpl<C, H>,
  state: Object,
): ReactFundamentalComponentInstance<C, H> {
  return {
    currentFiber,
    impl,
    instance: null,
    prevProps: null,
    props,
    state,
  };
}
