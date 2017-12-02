'use strict';

const ncp = require('ncp').ncp;
const join = require('path').join;
const resolve = require('path').resolve;
const exec = require('child_process').exec;
const targz = require('targz');

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

function resolvePath(path) {
  if (path[0] === '~') {
    return join(process.env.HOME, path.slice(1));
  } else {
    return resolve(path);
  }
}

function asyncExecuteCommand(command) {
  return new Promise(_resolve =>
    exec(command, (error, stdout) => {
      if (!error) {
        _resolve(stdout);
      } else {
        console.error(error);
        process.exit(1);
      }
    })
  );
}

function asyncExtractTar(options) {
  return new Promise(_resolve =>
    targz.decompress(options, error => {
      if (!error) {
        _resolve();
      } else {
        console.error(error);
        process.exit(1);
      }
    })
  );
}

module.exports = {
  asyncCopyTo: asyncCopyTo,
  resolvePath: resolvePath,
  asyncExecuteCommand: asyncExecuteCommand,
  asyncExtractTar: asyncExtractTar,
};
