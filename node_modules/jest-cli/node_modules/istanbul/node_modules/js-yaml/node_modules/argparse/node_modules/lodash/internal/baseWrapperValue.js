var LazyWrapper = require('./LazyWrapper');

/** Used for native method references. */
var arrayProto = Array.prototype;

/** Native method references. */
var push = arrayProto.push;

/**
 * The base implementation of `wrapperValue` which returns the result of
 * performing a sequence of actions on the unwrapped `value`, where each
 * successive action is supplied the return value of the previous.
 *
 * @private
 * @param {*} value The unwrapped value.
 * @param {Array} actions Actions to peform to resolve the unwrapped value.
 * @returns {*} Returns the resolved value.
 */
function baseWrapperValue(value, actions) {
  var result = value;
  if (result instanceof LazyWrapper) {
    result = result.value();
  }
  var index = -1,
      length = actions.length;

  while (++index < length) {
    var args = [result],
        action = actions[index];

    push.apply(args, action.args);
    result = action.func.apply(action.thisArg, args);
  }
  return result;
}

module.exports = baseWrapperValue;
