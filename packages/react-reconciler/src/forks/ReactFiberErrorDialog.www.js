/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CapturedError} from '../ReactCapturedValue';

import invariant from 'shared/invariant';

// Provided by www
const ReactFiberErrorDialogWWW = require('ReactFiberErrorDialog');
invariant(
  typeof ReactFiberErrorDialogWWW.showErrorDialog === 'function',
  'Expected ReactFiberErrorDialog.showErrorDialog to existbe a function.',
);

export function showErrorDialog(capturedError: CapturedError): boolean {
  return ReactFiberErrorDialogWWW.showErrorDialog(capturedError);
}
