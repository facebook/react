/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactScope} from 'shared/ReactTypes';
import {REACT_SCOPE_TYPE} from 'shared/ReactSymbols';

export function createScope(): ReactScope {
  const scopeComponent = {
    $$typeof: REACT_SCOPE_TYPE,
  };
  if (__DEV__) {
    Object.freeze(scopeComponent);
  }
  return scopeComponent;
}
