var createFindIndex = require('../internal/createFindIndex');

/**
 * This method is like `_.findIndex` except that it iterates over elements
 * of `collection` from right to left.
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to search.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': true },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': false }
 * ];
 *
 * _.findLastIndex(users, function(chr) {
 *   return chr.user == 'pebbles';
 * });
 * // => 2
 *
 * // using the `_.matches` callback shorthand
 * _.findLastIndex(users, { 'user': 'barney', 'active': true });
 * // => 0
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.findLastIndex(users, 'active', false);
 * // => 2
 *
 * // using the `_.property` callback shorthand
 * _.findLastIndex(users, 'active');
 * // => 0
 */
var findLastIndex = createFindIndex(true);

module.exports = findLastIndex;
