var baseWrapperValue = require('../internal/baseWrapperValue');

/**
 * Executes the chained sequence to extract the unwrapped value.
 *
 * @name value
 * @memberOf _
 * @alias run, toJSON, valueOf
 * @category Chain
 * @returns {*} Returns the resolved unwrapped value.
 * @example
 *
 * _([1, 2, 3]).value();
 * // => [1, 2, 3]
 */
function wrapperValue() {
  return baseWrapperValue(this.__wrapped__, this.__actions__);
}

module.exports = wrapperValue;
