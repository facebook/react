/**
 * @providesModule emptyFunction
 */

var copyProperties = require('copyProperties');

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; },
  mustImplement: function(module, property) {
    return function() {
      if (__DEV__) {
        throw new Error(module + '.' + property + ' must be implemented!');
      }
    };
  }
});

module.exports = emptyFunction;
