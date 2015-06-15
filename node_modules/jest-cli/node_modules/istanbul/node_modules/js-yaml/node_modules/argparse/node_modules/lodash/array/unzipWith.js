var arrayMap = require('../internal/arrayMap'),
    arrayReduce = require('../internal/arrayReduce'),
    bindCallback = require('../internal/bindCallback'),
    unzip = require('./unzip');

/**
 * This method is like `_.unzip` except that it accepts an iteratee to specify
 * how regrouped values should be combined. The `iteratee` is bound to `thisArg`
 * and invoked with four arguments: (accumulator, value, index, group).
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array of grouped elements to process.
 * @param {Function} [iteratee] The function to combine regrouped values.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new array of regrouped elements.
 * @example
 *
 * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
 * // => [[1, 10, 100], [2, 20, 200]]
 *
 * _.unzipWith(zipped, _.add);
 * // => [3, 30, 300]
 */
function unzipWith(array, iteratee, thisArg) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  var result = unzip(array);
  if (iteratee == null) {
    return result;
  }
  iteratee = bindCallback(iteratee, thisArg, 4);
  return arrayMap(result, function(group) {
    return arrayReduce(group, iteratee, undefined, true);
  });
}

module.exports = unzipWith;
