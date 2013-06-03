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
 * This module allows interception of console.* method calls, so that
 * listeners other than the native console object can consume logged
 * messages.
 */

var global = Function("return this")();
var Ap = Array.prototype;
var slice = Ap.slice;

var nativeConsole;
if ("console" in global) {
    var gc = global.console;
    try { delete global.console } catch (ignored) {}
    nativeConsole = global.console || gc;
    global.console = gc;
}

// Provide a reliable console interface in all browsers.
global.console = exports;

function makeLogger(method) {
    var logger = exports[method] = function() {
        var args = slice.call(arguments);
        listeners.forEach(function(listener) {
            listener(method, args, logger);
        });
    };
}

makeLogger("info");
makeLogger("log");
makeLogger("debug");
makeLogger("warn");
makeLogger("error");
makeLogger("dir");
makeLogger("dirxml");
makeLogger("trace");
makeLogger("assert");
makeLogger("count");
makeLogger("markTimeline");
makeLogger("profile");
makeLogger("profileEnd");
makeLogger("time");
makeLogger("timeEnd");
makeLogger("timeStamp");
makeLogger("group");
makeLogger("groupCollapsed");
makeLogger("groupEnd");
makeLogger("clear");

var listeners = [];
function addListener(listener) {
    listeners.push(listener);
}
exports.addListener = addListener

function clean(arg) {
    if (typeof arg === "string") {
        // Remove any xterm-color escape sequences.
        // TODO Display colors in console if possible.
        arg = arg.replace(/\033\[\d+m/g, "");
    }
    return arg;
}

if (nativeConsole) {
    // If present, the native console object becomes a listener just like
    // any other.
    addListener(function(method, args) {
        var method = nativeConsole[method];
        if (method) {
            method.apply(nativeConsole, args.map(clean));
        } else {
            // Ignore this call.
        }
    });
}
