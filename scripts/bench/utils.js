'use strict';

const ncp = require('ncp').ncp;
const rimraf = require('rimraf');
const readline = require('readline');

function wait(val) {
  return new Promise(resolve => setTimeout(resolve, val));
}

function cleanDir(path) {
  return new Promise(_resolve => rimraf(path, _resolve));
}

function asyncCopyTo(from, to) {
  return new Promise(_resolve => {
    ncp(from, to, error => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      _resolve();
    });
  });
}

const progressLog = {
  init: function(message) {
    process.stdout.write(message);
  },

  update: function(message) {
    // skip progress output for non-TTY console
    if (process.stdout.clearLine) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0, null);
      process.stdout.write(message);
    }
  },

  stop: function(message) {
    // skip progress output for non-TTY console
    if (process.stdout.clearLine) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0, null);
    }
    if (message) {
      console.log(message);
    }
  },
};

module.exports = {
  wait,
  cleanDir,
  asyncCopyTo,
  progressLog,
};
