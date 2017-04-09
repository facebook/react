/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

/*:: import type { ErrorMap } from './Types' */

/**
 * turns
 *   { 'MUCH ERROR': '0', 'SUCH WRONG': '1' }
 * into
 *   { 0: 'MUCH ERROR', 1: 'SUCH WRONG' }
 */
function invertObject(targetObj /* : ErrorMap */) /* : ErrorMap */ {
  var result = {};
  var mapKeys = Object.keys(targetObj);

  for (let i = 0; i < mapKeys.length; i++) {
    var originalKey = mapKeys[i];
    var originalVal = targetObj[originalKey];

    result[originalVal] = originalKey;
  }

  return result;
}

module.exports = invertObject;
