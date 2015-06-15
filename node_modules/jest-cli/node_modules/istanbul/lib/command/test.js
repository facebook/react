/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var runWithCover = require('./common/run-with-cover'),
    util = require('util'),
    Command = require('./index');

function TestCommand() {
    Command.call(this);
}

TestCommand.TYPE = 'test';
util.inherits(TestCommand, Command);

Command.mix(TestCommand, {
    synopsis: function () {
        return "cover a node command only when npm_config_coverage is set. Use in an `npm test` script for conditional coverage";
    },

    usage: function () {
        runWithCover.usage(this.toolName(), this.type());
    },

    run: function (args, callback) {
        runWithCover.run(args, this.type(), !!process.env.npm_config_coverage, callback);
    }
});

module.exports = TestCommand;
