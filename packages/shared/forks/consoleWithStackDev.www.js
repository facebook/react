/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This refers to a WWW module.
const warningWWW = require('warning');

let suppressWarning = false;
export function setSuppressWarning(newSuppressWarning) {
  if (__DEV__) {
    suppressWarning = newSuppressWarning;
  }
}

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
  if (__DEV__) {
    const React = require('react');
    const ReactSharedInternals =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    // Defensive in case this is fired before React is initialized.
    if (ReactSharedInternals != null) {
      const ReactDebugCurrentFrame =
        ReactSharedInternals.ReactDebugCurrentFrame;
      const stack = ReactDebugCurrentFrame.getStackAddendum();
      if (stack !== '') {
        format += '%s';
        args.push(stack);
      }
    }
    // TODO: don't ignore level and pass it down somewhere too.
    args.unshift(format);
    args.unshift(false);
    warningWWW.apply(null, args);
  }
}
