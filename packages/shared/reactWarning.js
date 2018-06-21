/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Forked from fbjs/warning:
 * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
 *
 * This replaces use of 'warning' and 'lowPriorityWarning' in React,
 * adding support for changing the prefix from 'Warning: ', to
 * 'Strict Mode Warning: '
 * and do nothing when 'console' is not supported.
 * It is part of a general move to give the 'warning' method more context on
 * what Fiber we are currently rendering, what the stack is, whether we are in
 * strict mode, etc.
 * ---
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

import ReactDebugCurrentFiber from 'shared/ReactDebugCurrentFiber';

let reactWarning = function() {};

if (__DEV__) {
  const printWarning = function(format, ...args) {
    let argIndex = 0;
    const prefix = ReactDebugCurrentFiber.isInStrictMode
      ? 'Strict Mode Warning: '
      : 'Warning: ';
    const message = prefix + format.replace(/%s/g, () => args[argIndex++]);
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  reactWarning = function(condition, format, ...args) {
    // TODO: warn if ReactDebugCurrentFiber is not set up.
    if (format === undefined) {
      throw new Error(
        '`reactWarning(condition, config, format, ...args)` requires a warning ' +
          'message argument',
      );
    }
    if (!condition) {
      printWarning(format, ...args);
    }
  };
}

export default reactWarning;
