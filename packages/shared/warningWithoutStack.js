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
    if (args.length > 8) {
      // Check before the condition to catch violations early.
      throw new Error(
        'warningWithoutStack() currently supports at most 8 arguments.',
      );
    }
    if (condition) {
      return;
    }
    if (typeof console !== 'undefined') {
      const argsWithFormat = args.map(item => '' + item);
      argsWithFormat.unshift('Warning: ' + format);

      // We intentionally don't use spread (or .apply) directly because it
      // breaks IE9: https://github.com/facebook/react/issues/13610
      Function.prototype.apply.call(console.error, console, argsWithFormat);
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
