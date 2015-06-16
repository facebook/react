/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

 /*eslint-disable no-extend-native*/

'use strict';

function findIndex(predicate, context) {
  if (this == null) {
    throw new TypeError(
      'Array.prototype.findIndex called on null or undefined'
    );
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('predicate must be a function');
  }
  var list = Object(this);
  var length = list.length >>> 0;
  for (var i = 0; i < length; i++) {
    if (predicate.call(context, list[i], i, list)) {
      return i;
    }
  }
  return -1;
}

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = findIndex;
}

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate, context) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    var index = findIndex.call(this, predicate, context);
    return index === -1 ? undefined : this[index];
  };
}
