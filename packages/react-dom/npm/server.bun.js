'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./esm/react-dom-server.bun.production.js');
} else {
  s = require('./esm/react-dom-server.bun.development.js');
}

exports.version = s.version;
exports.renderToReadableStream = s.renderToReadableStream;
