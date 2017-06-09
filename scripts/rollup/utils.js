'use strict';

const ncp = require('ncp').ncp;
const join = require('path').join;
const resolve = require('path').resolve;

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

module.exports = {
  asyncCopyTo: asyncCopyTo,
  resolvePath: resolvePath,
};
