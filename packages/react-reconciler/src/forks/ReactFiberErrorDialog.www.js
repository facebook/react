/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Provided by www
const ReactFiberErrorDialogWWW = require('ReactFiberErrorDialog');

if (typeof ReactFiberErrorDialogWWW.showErrorDialog !== 'function') {
  throw new Error(
    'Expected ReactFiberErrorDialog.showErrorDialog to be a function.',
  );
}

export function showErrorDialog(
  errorBoundary: ?React$Component<any, any>,
  error: mixed,
  componentStack: string,
): boolean {
  return ReactFiberErrorDialogWWW.showErrorDialog({
    errorBoundary,
    error,
    componentStack,
  });
}
