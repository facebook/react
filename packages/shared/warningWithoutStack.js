/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

let warningWithoutStack = () => {};

if (__DEV__) {
  warningWithoutStack = function(condition, format, ...args) {
    if (format === undefined) {
      throw new Error(
        '`warningWithoutStack(condition, format, ...args)` requires a warning ' +
          'message argument',
      );
    }
    if (condition) {
      return;
    }
    if (typeof console !== 'undefined') {
      const arr = args.map(item => '' + item);
      const arrLength = arr.length;

      if (arrLength === 0) {
        console.error('Warning: ' + format);
      } else if (arrLength === 1) {
        console.error('Warning: ' + format, arr[0]);
      } else if (arrLength === 2) {
        console.error('Warning: ' + format, arr[0], arr[1]);
      } else if (arrLength === 3) {
        console.error('Warning: ' + format, arr[0], arr[1], arr[2]);
      } else if (arrLength === 4) {
        console.error('Warning: ' + format, arr[0], arr[1], arr[2], arr[3]);
      } else if (arrLength === 5) {
        console.error(
          'Warning: ' + format,
          arr[0],
          arr[1],
          arr[2],
          arr[3],
          arr[4],
        );
      } else if (arrLength === 6) {
        console.error(
          'Warning: ' + format,
          arr[0],
          arr[1],
          arr[2],
          arr[3],
          arr[4],
          arr[5],
        );
      } else if (arrLength === 7) {
        console.error(
          'Warning: ' + format,
          arr[0],
          arr[1],
          arr[2],
          arr[3],
          arr[4],
          arr[5],
          arr[6],
        );
      } else if (arrLength === 8) {
        console.error(
          'Warning: ' + format,
          arr[0],
          arr[1],
          arr[2],
          arr[3],
          arr[4],
          arr[5],
          arr[6],
          arr[7],
        );
      }
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      let argIndex = 0;
      const message =
        'Warning: ' + format.replace(/%s/g, () => args[argIndex++]);
      throw new Error(message);
    } catch (x) {}
  };
}

export default warningWithoutStack;
