/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import * as dynamicFlagsUntyped from 'ReactNativeInternalFeatureFlags';
const enableRemoveConsolePatches =
  dynamicFlagsUntyped && dynamicFlagsUntyped.enableRemoveConsolePatches;

let suppressWarning = false;
export function setSuppressWarning(newSuppressWarning) {
  if (enableRemoveConsolePatches) {
    return;
  }
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
  if (enableRemoveConsolePatches) {
    if (__DEV__) {
      console['warn'](format, ...args);
    }
  } else if (__DEV__) {
    if (!suppressWarning) {
      printWarning('warn', format, args);
    }
  }
}

export function error(format, ...args) {
  if (enableRemoveConsolePatches) {
    if (__DEV__) {
      console['error'](format, ...args);
    }
  } else if (__DEV__) {
    if (!suppressWarning) {
      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  if (enableRemoveConsolePatches) {
    return;
  }
  if (__DEV__) {
    if (ReactSharedInternals.getCurrentStack) {
      const stack = ReactSharedInternals.getCurrentStack();
      if (stack !== '') {
        format += '%s';
        args = args.concat([stack]);
      }
    }

    args.unshift(format);
    // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging
    Function.prototype.apply.call(console[level], console, args);
  }
}
