var baseForOwnRight = require('../internal/baseForOwnRight'),
    createFindKey = require('../internal/createFindKey');

/**
 * This method is like `_.findKey` except that it iterates over elements of
 * a collection in the opposite order.
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
 * @category Object
 * @param {Object} object The object to search.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
 * @example
 *
 * var users = {
 *   'barney':  { 'age': 36, 'active': true },
 *   'fred':    { 'age': 40, 'active': false },
 *   'pebbles': { 'age': 1,  'active': true }
 * };
 *
 * _.findLastKey(users, function(chr) {
 *   return chr.age < 40;
 * });
 * // => returns `pebbles` assuming `_.findKey` returns `barney`
 *
 * // using the `_.matches` callback shorthand
 * _.findLastKey(users, { 'age': 36, 'active': true });
 * // => 'barney'
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.findLastKey(users, 'active', false);
 * // => 'fred'
 *
 * // using the `_.property` callback shorthand
 * _.findLastKey(users, 'active');
 * // => 'pebbles'
 */
var findLastKey = createFindKey(baseForOwnRight);

module.exports = findLastKey;
