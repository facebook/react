/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
