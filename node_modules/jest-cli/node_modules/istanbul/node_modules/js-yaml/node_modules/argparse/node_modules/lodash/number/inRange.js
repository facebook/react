/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Checks if `n` is between `start` and up to but not including, `end`. If
 * `end` is not specified it is set to `start` with `start` then set to `0`.
 *
 * @static
 * @memberOf _
 * @category Number
 * @param {number} n The number to check.
 * @param {number} [start=0] The start of the range.
 * @param {number} end The end of the range.
 * @returns {boolean} Returns `true` if `n` is in the range, else `false`.
 * @example
 *
 * _.inRange(3, 2, 4);
 * // => true
 *
 * _.inRange(4, 8);
 * // => true
 *
 * _.inRange(4, 2);
 * // => false
 *
 * _.inRange(2, 2);
 * // => false
 *
 * _.inRange(1.2, 2);
 * // => true
 *
 * _.inRange(5.2, 4);
 * // => false
 */
function inRange(value, start, end) {
  start = +start || 0;
  if (typeof end === 'undefined') {
    end = start;
    start = 0;
  } else {
    end = +end || 0;
  }
  return value >= nativeMin(start, end) && value < nativeMax(start, end);
}

module.exports = inRange;
