/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule canDefinePropertyDev
 */

'use strict';

var canDefinePropertyDev = false;
if (__DEV__) {
  try {
    Object.defineProperty({}, 'x', {get: function() {}});
    canDefinePropertyDev = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

module.exports = canDefinePropertyDev;
