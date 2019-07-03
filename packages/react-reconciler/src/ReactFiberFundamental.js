/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {
  ReactFundamentalImpl,
  ReactFundamentalInstance,
} from 'shared/ReactTypes';

export function createFundamentalInstance<C, H>(
  currentFiber: Fiber,
  props: Object,
  impl: ReactFundamentalImpl<C, H>,
  state: Object,
): ReactFundamentalInstance<C, H> {
  return {
    currentFiber,
    impl,
    instance: null,
    prevProps: null,
    props,
    state,
  };
}
