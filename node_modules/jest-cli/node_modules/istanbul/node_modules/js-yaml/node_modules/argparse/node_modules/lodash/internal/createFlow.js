var LodashWrapper = require('./LodashWrapper'),
    getData = require('./getData'),
    getFuncName = require('./getFuncName'),
    isArray = require('../lang/isArray'),
    isLaziable = require('./isLaziable');

/** Used to compose bitmasks for wrapper metadata. */
var CURRY_FLAG = 8,
    PARTIAL_FLAG = 32,
    ARY_FLAG = 128,
    REARG_FLAG = 256;

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a `_.flow` or `_.flowRight` function.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new flow function.
 */
function createFlow(fromRight) {
  return function() {
    var wrapper,
        length = arguments.length,
        index = fromRight ? length : -1,
        leftIndex = 0,
        funcs = Array(length);

    while ((fromRight ? index-- : ++index < length)) {
      var func = funcs[leftIndex++] = arguments[index];
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (!wrapper && LodashWrapper.prototype.thru && getFuncName(func) == 'wrapper') {
        wrapper = new LodashWrapper([]);
      }
    }
    index = wrapper ? -1 : length;
    while (++index < length) {
      func = funcs[index];

      var funcName = getFuncName(func),
          data = funcName == 'wrapper' ? getData(func) : null;

      if (data && isLaziable(data[0]) && data[1] == (ARY_FLAG | CURRY_FLAG | PARTIAL_FLAG | REARG_FLAG) && !data[4].length && data[9] == 1) {
        wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
      } else {
        wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
      }
    }
    return function() {
      var args = arguments;
      if (wrapper && args.length == 1 && isArray(args[0])) {
        return wrapper.plant(args[0]).value();
      }
      var index = 0,
          result = length ? funcs[index].apply(this, args) : args[0];

      while (++index < length) {
        result = funcs[index].call(this, result);
      }
      return result;
    };
  };
}

module.exports = createFlow;
