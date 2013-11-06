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
 * @providesModule mergeDeepInto
 */

// Empty blocks improve readability so disable that warning
// jshint -W035

"use strict";

var invariant = require('invariant');
var mergeHelpers = require('mergeHelpers');

var ArrayStrategies = mergeHelpers.ArrayStrategies;
var checkArrayStrategy = mergeHelpers.checkArrayStrategy;
var checkMergeArrayArgs = mergeHelpers.checkMergeArrayArgs;
var checkMergeLevel = mergeHelpers.checkMergeLevel;
var checkMergeObjectArgs = mergeHelpers.checkMergeObjectArgs;
var isTerminal = mergeHelpers.isTerminal;
var normalizeMergeArg = mergeHelpers.normalizeMergeArg;

/**
 * Every deep merge function must handle merging in each of the following cases
 * at every level. We may refer to letters below in implementations. For each
 * case listed, the "Result" listed describes the *value* of the result, but
 * does not specify anything about the memory graph of the result. In other
 * words the Results listed below will be the same for `merge` and `mergeInto`
 * but `merge` may have different guarantees about mutation/cloning. In the
 * table, "Object" refers to a non- Array, non-terminal object. One result is
 * undefined and requires that the caller specify the resolution policy (only
 * when trying to merge two arrays).
 *
 * Scenario                     Result
 * --------------------------------------------------------------
 * [A]: (terminal, terminal)    right terminal
 * [B]: (terminal, Array)       right Array
 * [C]: (terminal, Object)      right Object
 * [D]: (terminal, not present) left terminal
 * [E]: (Array, terminal)       right terminal
 * [F]: (Array, Array)          UNDEFINED - MUST SPECIFY POLICY
 * [G]: (Array, Object)         right Object
 * [H]: (Array, not present)    left Array
 * [I]: (Object, terminal)      right terminal
 * [J]: (Object, Array)         right Array
 * [K]: (Object, Object)        merge of left and right Objects
 * [L]: (Object, not present)   left Object
 * [M]: (not present, terminal) right terminal
 * [N]: (not present, Array)    right Array
 * [O]: (not present, Object)   right Object
 *
 * All merge functions are only expected to reason about "own" properties and,
 * any prototypical properties should have no effect on the result. At the first
 * level of recursion in deep merges, we may choose to normalize arguments
 * (convert undefined to empty objects etc.) The above chart does not describe
 * the result of those top level operations which behave specially due to the
 * normalization.
 */

/**
 * Deep merge implementation for non-Array, non-terminal Objects.
 *
 * @param {!Object} one non-Array, non-terminal Object to be mutated deeply.
 * @param {!Object} two non-Array, non-terminal taking precedence over `one`.
 * @param {?Enum=} arrayStrategy one of `arrayStrategies`.
 * @param {!number} level The level of recursion.
 */
var mergeDeepIntoObjects = function(one, two, arrayStrategy, level) {
  checkMergeObjectArgs(one, two);
  checkMergeLevel(level);
  var twoKeys = two ? Object.keys(two) : [];
  for (var i = 0; i < twoKeys.length; i++) {
    var twoKey = twoKeys[i];
    mergeSingleFieldDeep(one, two, twoKey, arrayStrategy, level);
  }
};

/**
 * Deep merge implementation for Arrays.
 *
 * @param {!Array} one Array to deep merge.
 * @param {!Array} two Array to deep merge "into" `one`.
 * @param {?Enum=} arrayStrategy one of `arrayStrategies`.
 * @param {!number} level Level of recursion.
 */
var mergeDeepIntoArrays = function(one, two, arrayStrategy, level) {
  checkMergeArrayArgs(one, two);
  checkMergeLevel(level);

  var maxLen = Math.max(one.length, two.length);
  for (var i = 0; i < maxLen; i++) {
    mergeSingleFieldDeep(one, two, i, arrayStrategy, level);
  }
};

/**
 * Given two truthy containers `one` and `two`, and a `key`, performs a deep
 * merge on a logical field.
 *
 * @param {!Array|Object} one Container to merge into.
 * @param {!Array|Object} two Container to merge from.
 * @param {!string} key Key of field that should be merged.
 * @param {lEnum=} arrayStrategy One of `arrayStrategies`.
 * @param {!number} level Current level of recursion.
 */
var mergeSingleFieldDeep = function(one, two, key, arrayStrategy, level) {
  var twoVal = two[key];
  var twoValIsPresent = two.hasOwnProperty(key);
  var twoValIsTerminal = twoValIsPresent && isTerminal(twoVal);
  var twoValIsArray = twoValIsPresent && Array.isArray(twoVal);
  var twoValIsProperObject =
      twoValIsPresent && !twoValIsArray && !twoValIsArray;

  var oneVal = one[key];
  var oneValIsPresent = one.hasOwnProperty(key);
  var oneValIsTerminal = oneValIsPresent && isTerminal(oneVal);
  var oneValIsArray = oneValIsPresent && Array.isArray(oneVal);
  var oneValIsProperObject =
    oneValIsPresent && !oneValIsArray && !oneValIsArray;

  if (oneValIsTerminal) {
    if (twoValIsTerminal) {             // [A]
      one[key] = twoVal;
    } else if (twoValIsArray) {         // [B]
      one[key] = [];
      mergeDeepIntoArrays(one[key], twoVal, arrayStrategy, level + 1);
    } else if (twoValIsProperObject) {  // [C]
      one[key] = {};
      mergeDeepIntoObjects(one[key], twoVal, arrayStrategy, level + 1);
    } else if (!twoValIsPresent) {      // [D]
      one[key] = oneVal;
    }
  } else if (oneValIsArray) {
    if (twoValIsTerminal) {             // [E]
      one[key] = twoVal;
    } else if (twoValIsArray) {         // [F]
      invariant(
        ArrayStrategies[arrayStrategy],
        'mergeDeepInto(...): Attempted to merge two arrays, but a valid ' +
        'ArrayStrategy was not specified.'
      );
      // Else: At this point, the only other valid option is `IndexByIndex`
      if (arrayStrategy === ArrayStrategies.Clobber) {
        oneVal.length = 0;
      }
      mergeDeepIntoArrays(oneVal, twoVal, arrayStrategy, level + 1);
    } else if (twoValIsProperObject) {  // [G]
      one[key] = {};
      mergeDeepIntoObjects(one[key], twoVal, arrayStrategy, level + 1);
    } else if (!twoValIsPresent) {      // [H]
      // Leave the left Array alone
    }
  } else if (oneValIsProperObject) {
    if (twoValIsTerminal) {             // [I]
      one[key] = twoVal;
    } else if (twoValIsArray) {         // [J]
      one[key] = [];
      mergeDeepIntoArrays(one[key], twoVal, arrayStrategy, level + 1);
    } else if (twoValIsProperObject) {  // [K]
      mergeDeepIntoObjects(oneVal, twoVal, arrayStrategy, level + 1);
    } else if (!twoValIsPresent) {      // [L]
      // Leave the left Object alone
    }
  } else if (!oneValIsPresent) {
    if (twoValIsTerminal) {             // [M]
      one[key] = twoVal;
    } else if (twoValIsArray) {         // [N]
      one[key] = [];
      mergeDeepIntoArrays(one[key], twoVal, arrayStrategy, level + 1);
    } else if (twoValIsProperObject) {  // [O]
      one[key] = {};
      mergeDeepIntoObjects(one[key], twoVal, arrayStrategy, level + 1);
    } else if (!twoValIsPresent) {
      // Could/should never happen
    }
  }
};



/**
 * Provides same functionality as mergeInto, but merges by mutating the first
 * argument. Will never mutate the second argument.
 *
 * mergeDeepInto provides two guarantees:
 * 1. In the process of mutating one, will not mutate two.
 * 2. Will not cause any nonTerminal memory to be shared between one and two.
 * This means that no further mutations to one will effect two (unless some
 * other part of your application forms shared memory between one and two).
 *
 * mergeDeepInto does not guarantee that it will *preserve* any shared memory
 * between two and one that existed before invocation. After calling
 * mergeDeepInto, there will be less (or equal) amount of shared memory between
 * one and two.
 *
 * Will tolerate a circular structure as the first parameter, but not the
 * second.
 *
 * Requires that first parameter be a non-Array, non-terminal `Object`, and the
 * second argument either be an `Object` or `null/undefined`. Arrays may exist
 * in the depths of either `Object` as long as an `arrayStrategy` is supplied.
 *
 * The third parameter indicates how merging two `Array`s should be performed.
 *
 * @param {!Object} one Object to be mutated deeply.
 * @param {?Object} two Values from two take precedence over values in one.
 * @param {?Enum=} arrayStrategy One of arrayStrategy
 */
var mergeDeepInto = function(one, twoParam, arrayStrategy) {
  var two = normalizeMergeArg(twoParam);
  checkArrayStrategy(arrayStrategy); // Will be checked twice, for now.
  mergeDeepIntoObjects(one, two, arrayStrategy, 0);
};

module.exports = mergeDeepInto;
