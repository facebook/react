/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import warningWithoutStack from 'shared/warningWithoutStack';
import ReactSharedInternals from 'shared/ReactSharedInternals';

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

let warning = warningWithoutStack;

if (__DEV__) {
  warning = function(condition, format, ...args) {
    if (condition) {
      return;
    }
    const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    // eslint-disable-next-line react-internal/warning-and-invariant-args
    warningWithoutStack(false, format + '%s', ...args, stack);
  };
}

export default warning;
