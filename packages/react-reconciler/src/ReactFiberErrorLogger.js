/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CapturedError} from './ReactCapturedValue';

import {showErrorDialog} from './ReactFiberErrorDialog';

export function logCapturedError(capturedError: CapturedError): void {
  const logError = showErrorDialog(capturedError);

  // Allow injected showErrorDialog() to prevent default console.error logging.
  // This enables renderers like ReactNative to better manage redbox behavior.
  if (logError === false) {
    return;
  }

  const error = (capturedError.error: any);
  const suppressLogging = error && error.suppressReactErrorLogging;
  if (suppressLogging) {
    return;
  }

  if (__DEV__) {
    const {
      componentName,
      componentStack,
      errorBoundaryName,
      errorBoundaryFound,
      willRetry,
    } = capturedError;

    // Browsers support silencing uncaught errors by calling
    // `preventDefault()` in window `error` handler.
    // We record this information as an expando on the error.
    if (error != null && error._suppressLogging) {
      if (errorBoundaryFound && willRetry) {
        // The error is recoverable and was silenced.
        // Ignore it and don't print the stack addendum.
        // This is handy for testing error boundaries without noise.
        return;
      }
      // The error is fatal. Since the silencing might have
      // been accidental, we'll surface it anyway.
      // However, the browser would have silenced the original error
      // so we'll print it first, and then print the stack addendum.
      console.error(error);
      // For a more detailed description of this block, see:
      // https://github.com/facebook/react/pull/13384
    }

    const componentNameMessage = componentName
      ? `The above error occurred in the <${componentName}> component:`
      : 'The above error occurred in one of your React components:';

    let errorBoundaryMessage;
    // errorBoundaryFound check is sufficient; errorBoundaryName check is to satisfy Flow.
    if (errorBoundaryFound && errorBoundaryName) {
      if (willRetry) {
        errorBoundaryMessage =
          `React will try to recreate this component tree from scratch ` +
          `using the error boundary you provided, ${errorBoundaryName}.`;
      } else {
        errorBoundaryMessage =
          `This error was initially handled by the error boundary ${errorBoundaryName}.\n` +
          `Recreating the tree from scratch failed so React will unmount the tree.`;
      }
    } else {
      errorBoundaryMessage =
        'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
        'Visit https://fb.me/react-error-boundaries to learn more about error boundaries.';
    }
    const combinedMessage =
      `${componentNameMessage}${componentStack}\n\n` +
      `${errorBoundaryMessage}`;

    // In development, we provide our own message with just the component stack.
    // We don't include the original error message and JS stack because the browser
    // has already printed it. Even if the application swallows the error, it is still
    // displayed by the browser thanks to the DEV-only fake event trick in ReactErrorUtils.
    console.error(combinedMessage);
  } else {
    // In production, we print the error directly.
    // This will include the message, the JS stack, and anything the browser wants to show.
    // We pass the error object instead of custom message so that the browser displays the error natively.
    console.error(error);
  }
}
