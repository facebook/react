var createWrapper = require('./createWrapper'),
    isIterateeCall = require('./isIterateeCall');

/**
 * Creates a `_.curry` or `_.curryRight` function.
 *
 * @private
 * @param {boolean} flag The curry bit flag.
 * @returns {Function} Returns the new curry function.
 */
function createCurry(flag) {
  function curryFunc(func, arity, guard) {
    if (guard && isIterateeCall(func, arity, guard)) {
      arity = null;
    }
    var result = createWrapper(func, flag, null, null, null, null, null, arity);
    result.placeholder = curryFunc.placeholder;
    return result;
  }
  return curryFunc;
}

module.exports = createCurry;
