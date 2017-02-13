/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiberDevInterface
 * @flow
 */

'use strict';

import type { CapturedError, Warning } from 'ReactDevInterface';

const { error, warn } = require('ReactDevInterface');

module.exports = {
  error: function (capturedError : CapturedError) : void {
    if (__DEV__) {
      error(capturedError);

      // TODO (bvaughn) Add UI
    }
  },

  warn: function (warning : Warning) : void {
    if (__DEV__) {
      warn(warning);

      // TODO (bvaughn) Add UI
    }
  },
};
