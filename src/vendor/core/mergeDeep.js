/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
