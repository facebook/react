/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Helpers to patch console.logs to avoid logging during side-effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.

let prevLog;
let prevInfo;
let prevWarn;
let prevError;

function disabledLog() {}

export function disableLogs(): void {
  if (__DEV__) {
    /* eslint-disable react-internal/no-production-logging */
    prevLog = console.log;
    prevInfo = console.info;
    prevWarn = console.warn;
    prevError = console.error;
    // $FlowFixMe Flow thinks console is immutable.
    console.log = console.info = console.warn = console.error = disabledLog;
    /* eslint-enable react-internal/no-production-logging */
  }
}

export function reenableLogs(): void {
  if (__DEV__) {
    /* eslint-disable react-internal/no-production-logging */
    // $FlowFixMe Flow thinks console is immutable.
    console.log = prevLog;
    // $FlowFixMe Flow thinks console is immutable.
    console.info = prevInfo;
    // $FlowFixMe Flow thinks console is immutable.
    console.warn = prevWarn;
    // $FlowFixMe Flow thinks console is immutable.
    console.error = prevError;
    /* eslint-enable react-internal/no-production-logging */
  }
}
