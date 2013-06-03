/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
