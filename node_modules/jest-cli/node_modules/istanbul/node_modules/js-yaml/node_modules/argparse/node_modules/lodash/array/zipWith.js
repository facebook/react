var restParam = require('../function/restParam'),
    unzipWith = require('./unzipWith');

/**
 * This method is like `_.zip` except that it accepts an iteratee to specify
 * how grouped values should be combined. The `iteratee` is bound to `thisArg`
 * and invoked with four arguments: (accumulator, value, index, group).
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {...Array} [arrays] The arrays to process.
 * @param {Function} [iteratee] The function to combine grouped values.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new array of grouped elements.
 * @example
 *
 * _.zipWith([1, 2], [10, 20], [100, 200], _.add);
 * // => [111, 222]
 */
var zipWith = restParam(function(arrays) {
  var length = arrays.length,
      iteratee = length > 2 ? arrays[length - 2] : undefined,
      thisArg = length > 1 ? arrays[length - 1] : undefined;

  if (length > 2 && typeof iteratee == 'function') {
    length -= 2;
  } else {
    iteratee = (length > 1 && typeof thisArg == 'function') ? (--length, thisArg) : undefined;
    thisArg = undefined;
  }
  arrays.length = length;
  return unzipWith(arrays, iteratee, thisArg);
});

module.exports = zipWith;
