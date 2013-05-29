/**
 * @providesModule accumulate
 */

"use strict";

var throwIf = require('throwIf');

var INVALID_ARGS = 'INVALID_ACCUM_ARGS';

if (__DEV__) {
  INVALID_ARGS =
    'accumulate requires non empty (non-null, defined) next ' +
    'values. All arrays accumulated must not contain any empty items.';
}

/**
 * Accumulates items that must never be empty, into a result in a manner that
 * conserves memory - avoiding allocation of arrays until they are needed. The
 * accumulation may start and/or end up being a single element or an array
 * depending on the total count (if greater than one, an array is allocated).
 * Handles most common case first (starting with an empty current value and
 * acquiring one).
 * @returns {Accumulation} An accumulation which is either a single item or an
 * Array of items.
 */
function accumulate(cur, next) {
  var curValIsEmpty = cur == null;   // Will test for emptiness (null/undef)
  var nextValIsEmpty = next === null;
  if (__DEV__) {
    throwIf(nextValIsEmpty, INVALID_ARGS);
  }
  if (nextValIsEmpty) {
    return cur;
  } else {
    if (curValIsEmpty) {
      return next;
    } else {
      // Both are not empty. Warning: Never call x.concat(y) when you are not
      // certain that x is an Array (x could be a string with concat method).
      var curIsArray = Array.isArray(cur);
      var nextIsArray = Array.isArray(next);
      if (curIsArray) {
        return cur.concat(next);
      } else {
        if (nextIsArray) {
          return [cur].concat(next);
        } else {
          return [cur, next];
        }
      }
    }
  }
}

module.exports = accumulate;
