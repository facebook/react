// This file exists both to give a single entry point for all the utility
// modules in src/test and to specify an ordering on those modules, since
// some still have implicit dependencies on others.

var Ap = Array.prototype;
var slice = Ap.slice;
var Fp = Function.prototype;

if (!Fp.bind) {
  // PhantomJS doesn't support Function.prototype.bind natively, so
  // polyfill it whenever this module is required.
  Fp.bind = function(context) {
    var func = this;
    var args = slice.call(arguments, 1);
    return args.length > 0 ? function() {
      return func.apply(
        context || this,
        args.concat(slice.call(arguments))
      );
    } : function() {
      return func.apply(context || this, arguments);
    };
  };
}

require("ReactTestUtils");
require("reactComponentExpect");
require("mocks");
require("mock-modules");
require("./mock-timers");
