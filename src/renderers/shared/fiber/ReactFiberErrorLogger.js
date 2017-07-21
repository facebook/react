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

const invariant = require('fbjs/lib/invariant');

import type {CapturedError} from 'ReactFiberScheduler';

const defaultShowDialog = (capturedError: CapturedError) => true;

let showDialog = defaultShowDialog;

function logCapturedError(capturedError: CapturedError): void {
  const logError = showDialog(capturedError);

  // Allow injected showDialog() to prevent default console.error logging.
  // This enables renderers like ReactNative to better manage redbox behavior.
  if (logError === false) {
    return;
  }

  if (__DEV__) {
    const {
      componentName,
      componentStack,
      error,
      errorBoundaryName,
      errorBoundaryFound,
      willRetry,
    } = capturedError;

    const {message, name, stack} = error;

    const errorSummary = message ? `${name}: ${message}` : name;

    const componentNameMessage = componentName
      ? `React caught an error thrown by ${componentName}.`
      : 'React caught an error thrown by one of your components.';

    // Error stack varies by browser, eg:
    // Chrome prepends the Error name and type.
    // Firefox, Safari, and IE don't indent the stack lines.
    // Format it in a consistent way for error logging.
    let formattedCallStack = stack.slice(0, errorSummary.length) ===
      errorSummary
      ? stack.slice(errorSummary.length)
      : stack;
    formattedCallStack = formattedCallStack
      .trim()
      .split('\n')
      .map(line => `\n    ${line.trim()}`)
      .join();

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
      // TODO Link to componentDidCatch() documentation once it exists.
      errorBoundaryMessage =
        'Consider adding an error boundary to your tree to customize error handling behavior.';
    }

    console.error(
      `${componentNameMessage} You should fix this error in your code. ${errorBoundaryMessage}\n\n` +
        `${errorSummary}\n\n` +
        `The error is located at: ${componentStack}\n\n` +
        `The error was thrown at: ${formattedCallStack}`,
    );
  }

  if (!__DEV__) {
    const {error} = capturedError;
    console.error(
      `React caught an error thrown by one of your components.\n\n${error.stack}`,
    );
  }
}

exports.injection = {
  /**
   * Display custom dialog for lifecycle errors.
   * Return false to prevent default behavior of logging to console.error.
   */
  injectDialog(fn: (e: CapturedError) => boolean) {
    invariant(
      showDialog === defaultShowDialog,
      'The custom dialog was already injected.',
    );
    invariant(
      typeof fn === 'function',
      'Injected showDialog() must be a function.',
    );
    showDialog = fn;
  },
};

exports.logCapturedError = logCapturedError;
