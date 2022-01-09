/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

let suppressWarning = false;
export function setSuppressWarning(newSuppressWarning) {
  if (__DEV__) {
    suppressWarning = newSuppressWarning;
  }
}

// In DEV, calls to console.warn and console.error get replaced
// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.

export function warn(format, ...args) {
  if (__DEV__) {
    if (!suppressWarning) {
      printWarning('warn', format, args);
    }
  }
}

export function error(format, ...args) {
  if (__DEV__) {
    if (!suppressWarning) {
      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  // When changing this logic, you might want to also
  // update consoleWithStackDev.www.js as well.
  if (__DEV__) {
    const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      format += '%s';
      args = args.concat([stack]);
    }

    // eslint-disable-next-line react-internal/safe-string-coercion
    const argsWithFormat = args.map(item => String(item));
    // Careful: RN currently depends on this prefix
    argsWithFormat.unshift('Warning: ' + format);
    // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging
    Function.prototype.apply.call(console[level], console, argsWithFormat);
  }
}
