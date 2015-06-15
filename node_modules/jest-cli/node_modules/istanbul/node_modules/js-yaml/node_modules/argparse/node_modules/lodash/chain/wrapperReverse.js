var LazyWrapper = require('../internal/LazyWrapper'),
    LodashWrapper = require('../internal/LodashWrapper'),
    thru = require('./thru');

/**
 * Reverses the wrapped array so the first element becomes the last, the
 * second element becomes the second to last, and so on.
 *
 * **Note:** This method mutates the wrapped array.
 *
 * @name reverse
 * @memberOf _
 * @category Chain
 * @returns {Object} Returns the new reversed `lodash` wrapper instance.
 * @example
 *
 * var array = [1, 2, 3];
 *
 * _(array).reverse().value()
 * // => [3, 2, 1]
 *
 * console.log(array);
 * // => [3, 2, 1]
 */
function wrapperReverse() {
  var value = this.__wrapped__;
  if (value instanceof LazyWrapper) {
    if (this.__actions__.length) {
      value = new LazyWrapper(this);
    }
    return new LodashWrapper(value.reverse(), this.__chain__);
  }
  return this.thru(function(value) {
    return value.reverse();
  });
}

module.exports = wrapperReverse;
