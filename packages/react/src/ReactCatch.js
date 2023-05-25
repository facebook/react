/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactCatch} from 'shared/ReactTypes';

import {REACT_CATCH_TYPE, REACT_TYPED_CATCH_TYPE} from 'shared/ReactSymbols';
import {enableCreateCatch} from 'shared/ReactFeatureFlags';

export const Catch = REACT_CATCH_TYPE;

export function createCatch<T>(): ReactCatch<T> {
  if (!enableCreateCatch) {
    throw new Error('Not implemented.');
  }
  const catchType = {
    $$typeof: REACT_TYPED_CATCH_TYPE,
  };
  return __DEV__ ? Object.freeze(catchType) : catchType;
}

export function raise<T>(catchType: ReactCatch<T>, value: T): empty {
  throw new Error('Not implemented.');
}
