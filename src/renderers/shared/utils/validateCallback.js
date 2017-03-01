/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule validateCallback
 * @flow
 */

'use strict';

const invariant = require('fbjs/lib/invariant');

function validateCallback(callback: ?Function) {
  invariant(
    !callback || typeof callback === 'function',
    'Invalid argument passed as callback. Expected a function. Instead ' +
    'received: %s',
    // $FlowFixMe - Intentional cast to string
    '' + callback
  );
}

module.exports = validateCallback;
