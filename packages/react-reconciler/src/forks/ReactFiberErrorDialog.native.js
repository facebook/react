/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from '../ReactFiber';
import type {CapturedValue} from '../ReactCapturedValue';

import {ClassComponent} from '../ReactWorkTags';

// Module provided by RN:
import {ReactFiberErrorDialog as RNImpl} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

if (typeof RNImpl.showErrorDialog !== 'function') {
  throw new Error(
    'Expected ReactFiberErrorDialog.showErrorDialog to be a function.',
  );
}

export function showErrorDialog(
  boundary: Fiber,
  errorInfo: CapturedValue<mixed>,
): boolean {
  const capturedError = {
    componentStack: errorInfo.stack !== null ? errorInfo.stack : '',
    error: errorInfo.value,
    errorBoundary:
      boundary !== null && boundary.tag === ClassComponent
        ? boundary.stateNode
        : null,
  };
  return RNImpl.showErrorDialog(capturedError);
}
