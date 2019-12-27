/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CapturedError} from '../ReactCapturedValue';

// Module provided by RN:
import {ReactFiberErrorDialog as RNImpl} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import invariant from 'shared/invariant';

invariant(
  typeof RNImpl.showErrorDialog === 'function',
  'Expected ReactFiberErrorDialog.showErrorDialog to be a function.',
);

export function showErrorDialog(capturedError: CapturedError): boolean {
  return RNImpl.showErrorDialog(capturedError);
}
