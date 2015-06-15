var baseCallback = require('../internal/baseCallback'),
    isIterateeCall = require('../internal/isIterateeCall'),
    isObjectLike = require('../internal/isObjectLike'),
    matches = require('./matches');

/**
 * Creates a function that invokes `func` with the `this` binding of `thisArg`
 * and arguments of the created function. If `func` is a property name the
 * created callback returns the property value for a given element. If `func`
 * is an object the created callback returns `true` for elements that contain
 * the equivalent object properties, otherwise it returns `false`.
 *
 * @static
 * @memberOf _
 * @alias iteratee
 * @category Utility
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {Function} Returns the callback.
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36 },
 *   { 'user': 'fred',   'age': 40 }
 * ];
 *
 * // wrap to create custom callback shorthands
 * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {
 *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);
 *   if (!match) {
 *     return callback(func, thisArg);
 *   }
 *   return function(object) {
 *     return match[2] == 'gt'
 *       ? object[match[1]] > match[3]
 *       : object[match[1]] < match[3];
 *   };
 * });
 *
 * _.filter(users, 'age__gt36');
 * // => [{ 'user': 'fred', 'age': 40 }]
 */
function callback(func, thisArg, guard) {
  if (guard && isIterateeCall(func, thisArg, guard)) {
    thisArg = null;
  }
  return isObjectLike(func)
    ? matches(func)
    : baseCallback(func, thisArg);
}

module.exports = callback;
