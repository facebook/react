/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFiberErrorDialog
 * @flow
 */

'use strict';

const ExceptionsManager = require('ExceptionsManager');

import type {CapturedError} from 'ReactFiberScheduler';

/**
 * Intercept lifecycle errors and ensure they are shown with the correct stack
 * trace within the native redbox component.
 */
function ReactNativeFiberErrorDialog(capturedError: CapturedError): boolean {
  const {componentStack, error} = capturedError;
  const {message, name} = error;

  const errorSummary = message ? `${name}: ${message}` : name;

  // Trimmed down version of the text we normally log to console.error via
  // ReactFiberErrorLogger. The reduced message is easier to read on a smaller
  // mobile screen.
  const newError = new error.constructor(
    `${errorSummary}\n\nThis error is located at:${componentStack}`,
  );
  newError.stack = error.stack;

  ExceptionsManager.handleException(newError, false);

  // Return false here to prevent ReactFiberErrorLogger default behavior of
  // logging error details to console.error. Calls to console.error are
  // automatically routed to the native redbox controller, which we've already
  // done above by calling ExceptionsManager.
  return false;
}

module.exports.showDialog = ReactNativeFiberErrorDialog;
