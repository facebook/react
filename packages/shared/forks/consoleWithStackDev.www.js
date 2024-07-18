/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
      React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    // Defensive in case this is fired before React is initialized.
    if (ReactSharedInternals != null && ReactSharedInternals.getCurrentStack) {
      const stack = ReactSharedInternals.getCurrentStack();
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
