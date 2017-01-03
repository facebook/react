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

const invariant = require('invariant');

function formatUnexpectedArgument(arg: any) {
  let type = typeof arg;
  if (type !== 'object') {
    return type;
  }
  let displayName = arg.constructor && arg.constructor.name || type;
  let keys = Object.keys(arg);
  if (keys.length > 0 && keys.length < 20) {
    return `${displayName} (keys: ${keys.join(', ')})`;
  }
  return displayName;
}

function validateCallback(callback: ?Function, callerName: string) {
  invariant(
    !callback || typeof callback === 'function',
    '%s(...): Expected the last optional `callback` argument to be a ' +
    'function. Instead received: %s.',
    callerName,
    formatUnexpectedArgument(callback)
  );
}

module.exports = validateCallback;
