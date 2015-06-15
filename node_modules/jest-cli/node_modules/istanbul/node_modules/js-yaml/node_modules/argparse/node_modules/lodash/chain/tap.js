/**
 * This method invokes `interceptor` and returns `value`. The interceptor is
 * bound to `thisArg` and invoked with one argument; (value). The purpose of
 * this method is to "tap into" a method chain in order to perform operations
 * on intermediate results within the chain.
 *
 * @static
 * @memberOf _
 * @category Chain
 * @param {*} value The value to provide to `interceptor`.
 * @param {Function} interceptor The function to invoke.
 * @param {*} [thisArg] The `this` binding of `interceptor`.
 * @returns {*} Returns `value`.
 * @example
 *
 * _([1, 2, 3])
 *  .tap(function(array) {
 *    array.pop();
 *  })
 *  .reverse()
 *  .value();
 * // => [2, 1]
 */
function tap(value, interceptor, thisArg) {
  interceptor.call(thisArg, value);
  return value;
}

module.exports = tap;
