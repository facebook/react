/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * This module provides a bridge from content-land to phantom-land via the
 * window.callPhantom interface.
 */

var console = require("./console");
var global = Function("return this")();

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
