/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import {getStackByFiberInDevAndProd} from './ReactFiberComponentStack';

const CapturedStacks: WeakMap<any, string> = new WeakMap();

export type CapturedValue<+T> = {
  +value: T,
  source: Fiber | null,
  stack: string | null,
};

export function createCapturedValueAtFiber<T>(
  value: T,
  source: Fiber,
): CapturedValue<T> {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  let stack;
  if (typeof value === 'object' && value !== null) {
    const capturedStack = CapturedStacks.get(value);
    if (typeof capturedStack === 'string') {
      stack = capturedStack;
    } else {
      stack = getStackByFiberInDevAndProd(source);
      CapturedStacks.set(value, stack);
    }
  } else {
    stack = getStackByFiberInDevAndProd(source);
  }

  return {
    value,
    source,
    stack,
  };
}

export function createCapturedValueFromError(
  value: Error,
  stack: null | string,
): CapturedValue<Error> {
  if (typeof stack === 'string') {
    CapturedStacks.set(value, stack);
  }
  return {
    value,
    source: null,
    stack: stack,
  };
}
