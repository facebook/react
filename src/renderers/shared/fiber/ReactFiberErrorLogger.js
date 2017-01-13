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
 */

'use strict';

import type { CapturedError } from 'ReactFiberScheduler';

function logCapturedError(capturedError : CapturedError) : void {
  if (__DEV__) {
    const {
      componentName,
      componentStack,
      error,
      errorBoundaryName,
      errorBoundaryFound,
      willRetry,
    } = capturedError;

    const componentNameMessage = componentName
      ? `React caught an error thrown by ${componentName}.`
      : 'React caught an error thrown by one of your components.';

    let errorBoundaryMessage;
    // errorBoundaryFound check is sufficient; errorBoundaryName check is to satisfy Flow.
    if (errorBoundaryFound && errorBoundaryName) {
      if (willRetry) {
        errorBoundaryMessage =
          `React will try to recreate this component tree from scratch ` +
          `using the error boundary you provided, ${errorBoundaryName}.`;
      } else {
        errorBoundaryMessage =
          `This error was initially handled by the error boundary ${errorBoundaryName}. ` +
          `Recreating the tree from scratch failed so React will unmount the tree.`;
      }
    } else {
      // TODO Link to unstable_handleError() documentation once it exists.
      errorBoundaryMessage =
        'Consider adding an error boundary to your tree to customize error handling behavior.';
    }

    console.error(
      `${componentNameMessage} You should fix this error in your code. ${errorBoundaryMessage}\n\n` +
      `${error.stack}\n\n` +
      `The error was thrown in the following location: ${componentStack}`
    );
  }

  if (!__DEV__) {
    const { error } = capturedError;
    console.error(
      `React caught an error thrown by one of your components.\n\n${error.stack}`
    );
  }
}

exports.logCapturedError = logCapturedError;

