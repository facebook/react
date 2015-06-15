var lodash = require('./lodash');

/**
 * Creates a `lodash` object that wraps `value` with explicit method
 * chaining enabled.
 *
 * @static
 * @memberOf _
 * @category Chain
 * @param {*} value The value to wrap.
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36 },
 *   { 'user': 'fred',    'age': 40 },
 *   { 'user': 'pebbles', 'age': 1 }
 * ];
 *
 * var youngest = _.chain(users)
 *   .sortBy('age')
 *   .map(function(chr) {
 *     return chr.user + ' is ' + chr.age;
 *   })
 *   .first()
 *   .value();
 * // => 'pebbles is 1'
 */
function chain(value) {
  var result = lodash(value);
  result.__chain__ = true;
  return result;
}

module.exports = chain;
