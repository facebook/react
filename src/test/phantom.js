/**
 * This module provides a bridge from content-land to phantom-land via the
 * window.callPhantom interface.
 */

var console = require("./console");
var global = Function("return this")();
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

if (global.callPhantom) {
    // Phantom's onConsoleMessage support is lacking (only one argument
    // supported, and it must be a string), so we use callPhantom to
    // forward console messages instead.
    console.addListener(function(method, args) {
        global.callPhantom({
            type: "console",
            method: method,
            args: args
        });
    });

    exports.exit = function(code) {
        global.callPhantom({
            type: "exit",
            code: code
        });
    };

} else {
    exports.exit = function() {};
}
