/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactFoundationImpl, ReactFoundation} from 'shared/ReactTypes';
import {REACT_FOUNDATION_TYPE} from 'shared/ReactSymbols';
import {hasBadMapPolyfill} from './hasBadMapPolyfill';

export default function createFoundation<C, H>(
  impl: ReactFoundationImpl<C, H>,
): ReactFoundation<C, H> {
  // We use responder as a Map key later on. When we have a bad
  // polyfill, then we can't use it as a key as the polyfill tries
  // to add a property to the object.
  if (__DEV__ && !hasBadMapPolyfill) {
    Object.freeze(impl);
  }
  const foundation = {
    $$typeof: REACT_FOUNDATION_TYPE,
    impl,
  };
  if (__DEV__) {
    Object.freeze(foundation);
  }
  return foundation;
}
