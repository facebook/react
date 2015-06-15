var arrayFilter = require('../internal/arrayFilter'),
    arrayMap = require('../internal/arrayMap'),
    baseProperty = require('../internal/baseProperty'),
    isArrayLike = require('../internal/isArrayLike');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This method is like `_.zip` except that it accepts an array of grouped
 * elements and creates an array regrouping the elements to their pre-zip
 * configuration.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array of grouped elements to process.
 * @returns {Array} Returns the new array of regrouped elements.
 * @example
 *
 * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);
 * // => [['fred', 30, true], ['barney', 40, false]]
 *
 * _.unzip(zipped);
 * // => [['fred', 'barney'], [30, 40], [true, false]]
 */
function unzip(array) {
  if (!(array && array.length)) {
    return [];
  }
  var index = -1,
      length = 0;

  array = arrayFilter(array, function(group) {
    if (isArrayLike(group)) {
      length = nativeMax(group.length, length);
      return true;
    }
  });
  var result = Array(length);
  while (++index < length) {
    result[index] = arrayMap(array, baseProperty(index));
  }
  return result;
}

module.exports = unzip;
