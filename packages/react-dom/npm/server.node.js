'use strict';

var l, s, w;
if (process.env.NODE_ENV === 'production') {
  l = require('./cjs/react-dom-server-legacy.node.production.js');
  s = require('./cjs/react-dom-server.node.production.js');
  w = require('./cjs/react-dom-server.node-webstreams.production.js');
} else {
  l = require('./cjs/react-dom-server-legacy.node.development.js');
  s = require('./cjs/react-dom-server.node.development.js');
  w = require('./cjs/react-dom-server.node-webstreams.development.js');
}

exports.version = l.version;
exports.renderToString = l.renderToString;
exports.renderToStaticMarkup = l.renderToStaticMarkup;
exports.renderToPipeableStream = s.renderToPipeableStream;
if (s.resumeToPipeableStream) {
  exports.resumeToPipeableStream = s.resumeToPipeableStream;
}
exports.renderToReadableStream = w.renderToReadableStream;
if (w.resume) {
  exports.resume = w.resume;
}
