/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Module provided by RN:
import {ReactFiberErrorDialog as RNImpl} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

if (typeof RNImpl.showErrorDialog !== 'function') {
  throw new Error(
    'Expected ReactFiberErrorDialog.showErrorDialog to be a function.',
  );
}

export function showErrorDialog(
  errorBoundary: ?React$Component<any, any>,
  error: mixed,
  componentStack: string,
): boolean {
  return RNImpl.showErrorDialog({
    componentStack,
    error,
    errorBoundary,
  });
}
