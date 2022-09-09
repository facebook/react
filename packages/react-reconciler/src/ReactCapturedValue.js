/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import {getStackByFiberInDevAndProd} from './ReactFiberComponentStack';

export type CapturedValue<T> = {
  value: T,
  source: Fiber | null,
  stack: string | null,
  digest: string | null,
};

export function createCapturedValueAtFiber<T>(
  value: T,
  source: Fiber,
): CapturedValue<T> {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  return {
    value,
    source,
    stack: getStackByFiberInDevAndProd(source),
    digest: null,
  };
}

export function createCapturedValue<T>(
  value: T,
  digest: ?string,
  stack: ?string,
): CapturedValue<T> {
  return {
    value,
    source: null,
    stack: stack != null ? stack : null,
    digest: digest != null ? digest : null,
  };
}
