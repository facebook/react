/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var Factory = require('../util/factory'),
    factory = new Factory('command', __dirname, true);

function Command() {}
// add register, create, mix, loadAll, getCommandList, resolveCommandName to the Command object
factory.bindClassMethods(Command);

Command.prototype = {
    toolName: function () {
        return require('../util/meta').NAME;
    },

    type: function () {
        return this.constructor.TYPE;
    },
    synopsis: /* istanbul ignore next: base method */ function () {
        return "the developer has not written a one-line summary of the " + this.type() + " command";
    },
    usage: /* istanbul ignore next: base method */ function () {
        console.error("the developer has not provided a usage for the " + this.type() + " command");
    },
    run: /* istanbul ignore next: abstract method */ function (args, callback) {
        return callback(new Error("run: must be overridden for the " + this.type() + " command"));
    }
};

module.exports = Command;

