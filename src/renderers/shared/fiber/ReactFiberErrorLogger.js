/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberErrorLogger
 * @flow
 */

'use strict';

import type { CapturedError } from 'ReactFiberScheduler';

function logCapturedError(capturedError : CapturedError) : void {
  if (__DEV__) {
    // console.log rather than console.error to avoid breaking tests
    // (Jest complains about unexpected console.error calls.)
    console.log(capturedError.error);
    console.log(`Error location: ${capturedError.componentStack}`);
  }
}

exports.logCapturedError = logCapturedError;
