var baseLodash = require('../internal/baseLodash'),
    wrapperClone = require('../internal/wrapperClone');

/**
 * Creates a clone of the chained sequence planting `value` as the wrapped value.
 *
 * @name plant
 * @memberOf _
 * @category Chain
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * var array = [1, 2];
 * var wrapper = _(array).map(function(value) {
 *   return Math.pow(value, 2);
 * });
 *
 * var other = [3, 4];
 * var otherWrapper = wrapper.plant(other);
 *
 * otherWrapper.value();
 * // => [9, 16]
 *
 * wrapper.value();
 * // => [1, 4]
 */
function wrapperPlant(value) {
  var result,
      parent = this;

  while (parent instanceof baseLodash) {
    var clone = wrapperClone(parent);
    if (result) {
      previous.__wrapped__ = clone;
    } else {
      result = clone;
    }
    var previous = clone;
    parent = parent.__wrapped__;
  }
  previous.__wrapped__ = value;
  return result;
}

module.exports = wrapperPlant;
