/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mergeDeep
 */

"use strict";

var mergeHelpers = require('mergeHelpers');
var mergeDeepInto = require('mergeDeepInto');

var checkArrayStrategy = mergeHelpers.checkArrayStrategy;
var checkMergeObjectArgs = mergeHelpers.checkMergeObjectArgs;
var normalizeMergeArg = mergeHelpers.normalizeMergeArg;

/**
 * @see mergeDeepImpl comments.
 *
 * @param {!Object} one returned will be an structural extension of this.
 * @param {!Object} two values from two take precedence over values in one.
 * @param {?Enum=} arrayStrategy One of `arrayStrategies`.
 * @return {!Object} the extension of one by two.
 */
var mergeDeep = function(oneParam, twoParam, arrayStrategy) {
  var one = normalizeMergeArg(oneParam);
  var two = normalizeMergeArg(twoParam);
  checkMergeObjectArgs(one, two);
  checkArrayStrategy(arrayStrategy);
  var newObj = {};
  // TODO: This is horribly inefficient. Even when some deep object in `one`
  // will be clobbered by another entity in `two`, we perform a clone of that
  // entire structure. To make this code more efficient, we'll need to either
  // enhance `mergeDeepInto` to accept multiple arguments or mirror that code
  // here.
  mergeDeepInto(newObj, one, arrayStrategy);
  mergeDeepInto(newObj, two, arrayStrategy);
  return newObj;
};


module.exports = mergeDeep;
