/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * node-harmonize (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/node-harmonize for details
 */
var child_process = require("child_process");
var isIojs        = require("is-iojs");

module.exports = function() {
    if (typeof Proxy == 'undefined') { // We take direct proxies as our marker
        var v = process.versions.node.split(".");

        if (!isIojs && v[0] == 0 && v[1] < 8) {
            throw("harmonize requires at least node v0.8");
        }

        // harmony flag is unnecessary in io and beginning with node v0.12
        if(isIojs || (!isIojs && v[0] == 0 && v[1] > 12)) {
            return;
        }

        var node = child_process.spawn(process.argv[0], ['--harmony', '--harmony-proxies'].concat(process.argv.slice(1)), { stdio: 'inherit' });
        node.on("close", function(code) {
            process.exit(code);
        });

        // Interrupt process flow in the parent
        process.once("uncaughtException", function(e) {});
        throw("harmony");
    }
};

// Usage: require("harmonize")();
