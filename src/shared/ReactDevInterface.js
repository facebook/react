/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDevInterface
 * @flow
 */

'use strict';

export type CapturedError = {
  componentName : ?string,
  componentStack : string,
  error : Error,
  errorBoundaryFound : boolean,
  errorBoundaryName : ?string,
  willRetry : boolean,
};

export type Warning = {
  componentName : ?string,
  componentStack : string,
  message : string,
};

export type DevInterface = {
  error(capturedError : CapturedError) : void,
  warn(warning : Warning) : void,
};

function error(capturedError : CapturedError) : void {
  if (__DEV__) {
    const {
      componentName,
      componentStack,
      error,
      errorBoundaryName,
      errorBoundaryFound,
      willRetry,
    } = capturedError;

    const {
      message,
      name,
      stack,
    } = error;

    const errorSummary = message
      ? `${name}: ${message}`
      : name;

    const componentNameMessage = componentName
      ? `React caught an error thrown by ${componentName}.`
      : 'React caught an error thrown by one of your components.';

    // Error stack varies by browser, eg:
    // Chrome prepends the Error name and type.
    // Firefox, Safari, and IE don't indent the stack lines.
    // Format it in a consistent way for error logging.
    let formattedCallStack = stack.slice(0, errorSummary.length) === errorSummary
      ? stack.slice(errorSummary.length)
      : stack;
    formattedCallStack = formattedCallStack
      .trim()
      .split('\n')
      .map((line) => `\n    ${line.trim()}`)
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
      // TODO Link to unstable_handleError() documentation once it exists.
      errorBoundaryMessage =
        'Consider adding an error boundary to your tree to customize error handling behavior.';
    }

    console.error(
      `${componentNameMessage} You should fix this error in your code. ${errorBoundaryMessage}\n\n` +
      `${errorSummary}\n\n` +
      `The error is located at: ${componentStack}\n\n` +
      `The error was thrown at: ${formattedCallStack}`
    );
  }

  if (!__DEV__) {
    const { error } = capturedError;
    console.error(
      `React caught an error thrown by one of your components.\n\n${error.stack}`
    );
  }
}

function warn(warning : Warning) : void {
  console.warn(`${warning.message}${warning.componentStack}`);
}

const ReactDevInterface = {
  injection: {
    injectDevInterface: function(devInterface : DevInterface) : void {
      ReactDevInterface.error = devInterface.error;
      ReactDevInterface.warn = devInterface.warn;
    }
  },
  error,
  warn,
};

module.exports = ReactDevInterface;
