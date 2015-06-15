#!/usr/bin/env node

/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */


var async = require('async'),
    Command = require('./command'),
    inputError = require('./util/input-error'),
    exitProcess = process.exit; //hold a reference to original process.exit so that we are not affected even when a test changes it

require('./register-plugins');

function findCommandPosition(args) {
    var i;

    for (i = 0; i < args.length; i += 1) {
        if (args[i].charAt(0) !== '-') {
            return i;
        }
    }

    return -1;
}

function exit(ex, code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  var streams = [process.stdout, process.stderr];
  async.forEach(streams, function (stream, done) {
    // submit a write request and wait until it's written
    stream.write('', done);
  }, function () {
    if (ex) {
        throw ex; // turn it into an uncaught exception
    } else {
        exitProcess(code);
    }
  });
}

function errHandler (ex) {
    if (!ex) { return; }
    if (!ex.inputError) {
        // exit with exception stack trace
        exit(ex);
    } else {
        //don't print nasty traces but still exit(1)
        console.error(ex.message);
        console.error('Try "istanbul help" for usage');
        exit(null, 1);
    }
}

function runCommand(args, callback) {
    var pos = findCommandPosition(args),
        command,
        commandArgs,
        commandObject;

    if (pos < 0) {
        return callback(inputError.create('Need a command to run'));
    }

    commandArgs = args.slice(0, pos);
    command = args[pos];
    commandArgs.push.apply(commandArgs, args.slice(pos + 1));

    try {
        commandObject = Command.create(command);
    } catch (ex) {
        errHandler(inputError.create(ex.message));
        return;
    }
    commandObject.run(commandArgs, errHandler);
}

function runToCompletion(args) {
    runCommand(args, errHandler);
}

/* istanbul ignore if: untestable */
if (require.main === module) {
    var args = Array.prototype.slice.call(process.argv, 2);
    runToCompletion(args);
}

module.exports = {
    runToCompletion: runToCompletion
};

