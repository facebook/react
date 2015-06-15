/**
 * Produces the result of coercing the unwrapped value to a string.
 *
 * @name toString
 * @memberOf _
 * @category Chain
 * @returns {string} Returns the coerced string value.
 * @example
 *
 * _([1, 2, 3]).toString();
 * // => '1,2,3'
 */
function wrapperToString() {
  return (this.value() + '');
}

module.exports = wrapperToString;
