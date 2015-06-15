var baseGet = require('../internal/baseGet'),
    toPath = require('../internal/toPath');

/**
 * The opposite of `_.property`; this method creates a function that returns
 * the property value at a given path on `object`.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Object} object The object to query.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var array = [0, 1, 2],
 *     object = { 'a': array, 'b': array, 'c': array };
 *
 * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
 * // => [2, 0]
 *
 * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
 * // => [2, 0]
 */
function propertyOf(object) {
  return function(path) {
    return baseGet(object, toPath(path), path + '');
  };
}

module.exports = propertyOf;
