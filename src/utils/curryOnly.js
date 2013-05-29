/**
 * @providesModule curryOnly
 */

"use strict";

/**
 * When the function who's first parameter you are currying accepts only a
 * single argument, and you want to curry it, use this function for performance
 * reasons, as it will never access 'arguments'. It would be an interesting
 * project to detect at static analysis time, calls to F.curry that could be
 * transformed to one of the two optimized versions seen here.
 */
var curryOnly = function(func, val, context) {
  if (!func) {
    return null;
  }
  return function() {
    return func.call(context, val);
  };
};

module.exports = curryOnly;
