/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from '../ReactFiber.old';
import type {CapturedValue} from '../ReactCapturedValue';

import {ClassComponent} from '../ReactWorkTags';

import invariant from 'shared/invariant';

// Provided by www
const ReactFiberErrorDialogWWW = require('ReactFiberErrorDialog');
invariant(
  typeof ReactFiberErrorDialogWWW.showErrorDialog === 'function',
  'Expected ReactFiberErrorDialog.showErrorDialog to be a function.',
);

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
  return ReactFiberErrorDialogWWW.showErrorDialog(capturedError);
}
