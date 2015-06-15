var LodashWrapper = require('../internal/LodashWrapper');

/**
 * Executes the chained sequence and returns the wrapped result.
 *
 * @name commit
 * @memberOf _
 * @category Chain
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * var array = [1, 2];
 * var wrapper = _(array).push(3);
 *
 * console.log(array);
 * // => [1, 2]
 *
 * wrapper = wrapper.commit();
 * console.log(array);
 * // => [1, 2, 3]
 *
 * wrapper.last();
 * // => 3
 *
 * console.log(array);
 * // => [1, 2, 3]
 */
function wrapperCommit() {
  return new LodashWrapper(this.value(), this.__chain__);
}

module.exports = wrapperCommit;
