/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {
  ReactFundamentalImpl,
  ReactFundamentalComponent,
} from 'shared/ReactTypes';
import {REACT_FUNDAMENTAL_TYPE} from 'shared/ReactSymbols';
import {hasBadMapPolyfill} from './hasBadMapPolyfill';

export default function createFundamentalComponent<C, H>(
  impl: ReactFundamentalImpl<C, H>,
): ReactFundamentalComponent<C, H> {
  // We use responder as a Map key later on. When we have a bad
  // polyfill, then we can't use it as a key as the polyfill tries
  // to add a property to the object.
  if (__DEV__ && !hasBadMapPolyfill) {
    Object.freeze(impl);
  }
  const fundamantalComponent = {
    $$typeof: REACT_FUNDAMENTAL_TYPE,
    impl,
  };
  if (__DEV__) {
    Object.freeze(fundamantalComponent);
  }
  return fundamantalComponent;
}
