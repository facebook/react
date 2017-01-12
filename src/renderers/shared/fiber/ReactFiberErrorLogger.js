/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberErrorLogger
 * @flow
 */3

'use strict';

import type { CapturedError } from 'ReactFiberScheduler';

function logCapturedError(capturedError : CapturedError) : void {
  if (__DEV__) {
    const { componentName, componentStack, error } = capturedError;
    // TODO Link to unstable_handleError() documentation once it exists.
    console.error(
      `React caught an error thrown by ${componentName}. ` +
      `Consider using an error boundary to capture this and other errors.\n\n` +
      `${error}\n\n` +
      `The error was thrown in the following location: ${componentStack}`
    );
  }
}

exports.logCapturedError = logCapturedError;

