var LazyWrapper = require('./LazyWrapper'),
    arrayCopy = require('./arrayCopy');

/**
 * Creates a clone of the lazy wrapper object.
 *
 * @private
 * @name clone
 * @memberOf LazyWrapper
 * @returns {Object} Returns the cloned `LazyWrapper` object.
 */
function lazyClone() {
  var actions = this.__actions__,
      iteratees = this.__iteratees__,
      views = this.__views__,
      result = new LazyWrapper(this.__wrapped__);

  result.__actions__ = actions ? arrayCopy(actions) : null;
  result.__dir__ = this.__dir__;
  result.__filtered__ = this.__filtered__;
  result.__iteratees__ = iteratees ? arrayCopy(iteratees) : null;
  result.__takeCount__ = this.__takeCount__;
  result.__views__ = views ? arrayCopy(views) : null;
  return result;
}

module.exports = lazyClone;
