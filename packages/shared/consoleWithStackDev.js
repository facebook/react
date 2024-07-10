/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {enableOwnerStacks} from 'shared/ReactFeatureFlags';

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
      printWarning('warn', format, args, new Error('react-stack-top-frame'));
    }
  }
}

export function error(format, ...args) {
  if (__DEV__) {
    if (!suppressWarning) {
      printWarning('error', format, args, new Error('react-stack-top-frame'));
    }
  }
}

// eslint-disable-next-line react-internal/no-production-logging
const supportsCreateTask = __DEV__ && enableOwnerStacks && !!console.createTask;

export let isWritingAppendedStack = false;

function printWarning(level, format, args, currentStack) {
  // When changing this logic, you might want to also
  // update consoleWithStackDev.www.js as well.
  if (__DEV__) {
    if (!supportsCreateTask && ReactSharedInternals.getCurrentStack) {
      // We only add the current stack to the console when createTask is not supported.
      // Since createTask requires DevTools to be open to work, this means that stacks
      // can be lost while DevTools isn't open but we can't detect this.
      const stack = ReactSharedInternals.getCurrentStack(currentStack);
      if (stack !== '') {
        isWritingAppendedStack = true;
        format += '%s';
        args = args.concat([stack]);
      }
    }

    args.unshift(format);
    // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging
    Function.prototype.apply.call(console[level], console, args);
    isWritingAppendedStack = false;
  }
}
