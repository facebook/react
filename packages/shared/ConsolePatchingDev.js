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

let disabledDepth = 0;
let prevLog;
let prevInfo;
let prevWarn;
let prevError;
let prevGroup;
let prevgGoupCollapsed;
let prevGroupEnd;

function disabledLog() {}
disabledLog.__reactDisabledLog = true;

export function disableLogs(): void {
  if (__DEV__) {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevgGoupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd;
      // $FlowFixMe Flow thinks console is immutable.
      console.log = console.info = console.warn = console.error = console.group = console.groupCollapsed = console.groupEnd = disabledLog;
      /* eslint-enable react-internal/no-production-logging */
    }
    disabledDepth++;
  }
}

export function reenableLogs(): void {
  if (__DEV__) {
    disabledDepth--;
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      // $FlowFixMe Flow thinks console is immutable.
      console.log = prevLog;
      // $FlowFixMe Flow thinks console is immutable.
      console.info = prevInfo;
      // $FlowFixMe Flow thinks console is immutable.
      console.warn = prevWarn;
      // $FlowFixMe Flow thinks console is immutable.
      console.error = prevError;
      // $FlowFixMe Flow thinks console is immutable.
      console.group = prevGroup;
      // $FlowFixMe Flow thinks console is immutable.
      console.groupCollapsed = prevgGoupCollapsed;
      // $FlowFixMe Flow thinks console is immutable.
      console.groupEnd = prevGroupEnd;
      /* eslint-enable react-internal/no-production-logging */
    }
    if (disabledDepth < 0) {
      console.error(
        'disabledDepth fell below zero. ' +
          'This is a bug in React. Please file an issue.',
      );
    }
  }
}
