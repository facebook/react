/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CapturedError} from '../ReactFiberScheduler';

// Provided by www
const ReactFiberErrorDialogWWW = require('ReactFiberErrorDialog');

export function showErrorDialog(capturedError: CapturedError): boolean {
  return ReactFiberErrorDialogWWW.showErrorDialog(capturedError);
}
