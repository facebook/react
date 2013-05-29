/**
 * @providesModule ex
 * @typechecks
 * @nostacktrace
 */

/**
 * This function transforms error message with arguments into plain text error
 * message, so that it can be passed to window.onerror without losing anything.
 * It can then be transformed back by `erx()` function.
 *
 * Usage:
 *   throw new Error(ex('Error %s from %s', errorCode, userID));
 *
 * @param {string} errorMessage
 */

var ex = function(errorMessage/*, arg1, arg2, ...*/) {
  var args = Array.prototype.slice.call(arguments).map(function(arg) {
    return String(arg);
  });
  var expectedLength = errorMessage.split('%s').length - 1;

  if (expectedLength !== args.length - 1) {
    // something wrong with the formatting string
    return ex('ex args number mismatch: %s', JSON.stringify(args));
  }

  return ex._prefix + JSON.stringify(args) + ex._suffix;
};

ex._prefix = '<![EX[';
ex._suffix = ']]>';

module.exports = ex;
