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
 * @providesModule mergeHelpers
 *
 * requiresPolyfills: Array.isArray
 */

"use strict";

var keyMirror = require('keyMirror');
var throwIf = require('throwIf');

/**
 * Maximum number of levels to traverse. Will catch circular structures.
 * @const
 */
var MAX_MERGE_DEPTH = 36;

var ERRORS = keyMirror({
  MERGE_ARRAY_FAIL: null,
  MERGE_CORE_FAILURE: null,
  MERGE_TYPE_USAGE_FAILURE: null,
  MERGE_DEEP_MAX_LEVELS: null,
  MERGE_DEEP_NO_ARR_STRATEGY: null
});

if (__DEV__) {
  ERRORS = {
    MERGE_ARRAY_FAIL:
      'Unsupported type passed to a merge function. You may have passed a ' +
      'structure that contains an array and the merge function does not know ' +
      'how to merge arrays. ',

    MERGE_CORE_FAILURE:
      'Critical assumptions about the merge functions have been violated. ' +
      'This is the fault of the merge functions themselves, not necessarily ' +
      'the callers.',

    MERGE_TYPE_USAGE_FAILURE:
      'Calling merge function with invalid types. You may call merge ' +
      'functions (non-array non-terminal) OR (null/undefined) arguments. ' +
      'mergeInto functions have the same requirements but with an added ' +
      'restriction that the first parameter must not be null/undefined.',

    MERGE_DEEP_MAX_LEVELS:
      'Maximum deep merge depth exceeded. You may attempting to merge ' +
      'circular structures in an unsupported way.',
    MERGE_DEEP_NO_ARR_STRATEGY:
      'You must provide an array strategy to deep merge functions to ' +
      'instruct the deep merge how to resolve merging two arrays.'
  };
}

/**
 * We won't worry about edge cases like new String('x') or new Boolean(true).
 * Functions are considered terminals, and arrays are not.
 * @param {*} o The item/object/value to test.
 * @return {boolean} true iff the argument is a terminal.
 */
var isTerminal = function(o) {
  return typeof o !== 'object' || o === null;
};

var mergeHelpers = {

  MAX_MERGE_DEPTH: MAX_MERGE_DEPTH,

  isTerminal: isTerminal,

  /**
   * Converts null/undefined values into empty object.
   *
   * @param {?Object=} arg Argument to be normalized (nullable optional)
   * @return {!Object}
   */
  normalizeMergeArg: function(arg) {
    return arg === undefined || arg === null ? {} : arg;
  },

  /**
   * If merging Arrays, a merge strategy *must* be supplied. If not, it is
   * likely the caller's fault. If this function is ever called with anything
   * but `one` and `two` being `Array`s, it is the fault of the merge utilities.
   *
   * @param {*} one Array to merge into.
   * @param {*} two Array to merge from.
   */
  checkMergeArrayArgs: function(one, two) {
    throwIf(
      !Array.isArray(one) || !Array.isArray(two),
      ERRORS.MERGE_CORE_FAILURE
    );
  },

  /**
   * @param {*} one Object to merge into.
   * @param {*} two Object to merge from.
   */
  checkMergeObjectArgs: function(one, two) {
    mergeHelpers.checkMergeObjectArg(one);
    mergeHelpers.checkMergeObjectArg(two);
  },

  /**
   * @param {*} arg
   */
  checkMergeObjectArg: function(arg) {
    throwIf(isTerminal(arg) || Array.isArray(arg), ERRORS.MERGE_CORE_FAILURE);
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkMergeLevel: function(level) {
    throwIf(level >= MAX_MERGE_DEPTH, ERRORS.MERGE_DEEP_MAX_LEVELS);
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkArrayStrategy: function(strategy) {
    throwIf(
      strategy !== undefined && !(strategy in mergeHelpers.ArrayStrategies),
      ERRORS.MERGE_DEEP_NO_ARR_STRATEGY
    );
  },

  /**
   * Set of possible behaviors of merge algorithms when encountering two Arrays
   * that must be merged together.
   * - `clobber`: The left `Array` is ignored.
   * - `indexByIndex`: The result is achieved by recursively deep merging at
   *   each index. (not yet supported.)
   */
  ArrayStrategies: keyMirror({
    Clobber: true,
    IndexByIndex: true
  }),

  ERRORS: ERRORS
};

module.exports = mergeHelpers;
