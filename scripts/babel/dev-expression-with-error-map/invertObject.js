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

/**
 * turns
 *   { a: 1, b: 2 }
 * into
 *   { 1: a, 2: b }
 */
// TODO dont use `Object` here
function invertObject(targetObj/* : Object */)/* : Object */ {
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
