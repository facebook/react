/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule smartWarning
 */

"use strict";

var warning = require('warning');
var invariant = require('invariant');
var emptyFunction = require('emptyFunction');

/**
 * Similar to warning except warnings are intelligently deduplicated.
 */

var smartWarning = emptyFunction;

var cache = {};
var hasOwnProperty = {}.hasOwnProperty;

/** Puts an item into the cache, returning true if the cache was modified **/
function putCache(cacheKey) {
  var list = cache[cacheKey];
  if (list == null) {
    list = [];
  }
  if (list.indexOf(cacheKey) > -1) {
    return false;
  }

  list.push(cacheKey);
  cache[cacheKey] = list;
  return true;
}

if (__DEV__) {
  smartWarning = function(condition, format, ...args) {
    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, () => args[argIndex++]);
    var cacheKey;
    if (args.length-1 === argIndex) {
      cacheKey = args.pop();
    } else {
      cacheKey = message;
    }
    if (putCache(cacheKey)) {
      var warningArgs = args.slice();
      warningArgs.unshift(condition, format);
      warning.apply(null, warningArgs);
    }
  };
}

module.exports = smartWarning;
