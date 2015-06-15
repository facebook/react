/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var runWithCover = require('./common/run-with-cover'),
    util = require('util'),
    Command = require('./index');

function CoverCommand() {
    Command.call(this);
}

CoverCommand.TYPE = 'cover';
util.inherits(CoverCommand, Command);

Command.mix(CoverCommand, {
    synopsis: function () {
        return "transparently adds coverage information to a node command. Saves coverage.json and reports at the end of execution";
    },

    usage: function () {
        runWithCover.usage(this.toolName(), this.type());
    },

    run: function (args, callback) {
        runWithCover.run(args, this.type(), true, callback);
    }
});


module.exports = CoverCommand;

