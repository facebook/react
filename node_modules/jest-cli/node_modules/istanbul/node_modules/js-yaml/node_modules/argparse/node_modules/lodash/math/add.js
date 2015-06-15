/**
 * Adds two numbers.
 *
 * @static
 * @memberOf _
 * @category Math
 * @param {number} augend The first number to add.
 * @param {number} addend The second number to add.
 * @returns {number} Returns the sum.
 * @example
 *
 * _.add(6, 4);
 * // => 10
 */
function add(augend, addend) {
  return (+augend || 0) + (+addend || 0);
}

module.exports = add;
