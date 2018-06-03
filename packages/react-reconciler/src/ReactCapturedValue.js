/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {getStackAddendumByWorkInProgressFiber} from 'shared/ReactFiberComponentTreeHook';

export type CapturedValue<T> = {
  value: T,
  source: Fiber | null,
  stack: string | null,
};

export type CapturedError = {
  componentName: ?string,
  componentStack: string,
  error: mixed,
  errorBoundary: ?Object,
  errorBoundaryFound: boolean,
  errorBoundaryName: string | null,
  willRetry: boolean,
};

export function createCapturedValue<T>(
  value: T,
  source: Fiber,
): CapturedValue<T> {
  // If the value is an error, call this function immediately after it is thrown
  // so the stack is accurate.
  return {
    value,
    source,
    stack: getStackAddendumByWorkInProgressFiber(source),
  };
}
