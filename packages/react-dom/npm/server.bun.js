'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-dom-server.bun.production.min.js');
} else {
  s = require('./cjs/react-dom-server.bun.development.js');
}

exports.version = s.version;
exports.renderToReadableStream = s.renderToReadableStream;
