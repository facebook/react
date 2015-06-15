var baseFlatten = require('../internal/baseFlatten'),
    baseSortByOrder = require('../internal/baseSortByOrder'),
    isIterateeCall = require('../internal/isIterateeCall'),
    restParam = require('../function/restParam');

/**
 * This method is like `_.sortBy` except that it can sort by multiple iteratees
 * or property names.
 *
 * If a property name is provided for an iteratee the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If an object is provided for an iteratee the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {...(Function|Function[]|Object|Object[]|string|string[])} iteratees
 *  The iteratees to sort by, specified as individual values or arrays of values.
 * @returns {Array} Returns the new sorted array.
 * @example
 *
 * var users = [
 *   { 'user': 'fred',   'age': 48 },
 *   { 'user': 'barney', 'age': 36 },
 *   { 'user': 'fred',   'age': 42 },
 *   { 'user': 'barney', 'age': 34 }
 * ];
 *
 * _.map(_.sortByAll(users, ['user', 'age']), _.values);
 * // => [['barney', 34], ['barney', 36], ['fred', 42], ['fred', 48]]
 *
 * _.map(_.sortByAll(users, 'user', function(chr) {
 *   return Math.floor(chr.age / 10);
 * }), _.values);
 * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
 */
var sortByAll = restParam(function(collection, iteratees) {
  if (collection == null) {
    return [];
  }
  var guard = iteratees[2];
  if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
    iteratees.length = 1;
  }
  return baseSortByOrder(collection, baseFlatten(iteratees), []);
});

module.exports = sortByAll;
