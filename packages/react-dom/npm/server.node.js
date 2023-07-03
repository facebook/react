'use strict';

var l, s, w;
if (process.env.NODE_ENV === 'production') {
  l = require('./cjs/react-dom-server-legacy.node.production.min.js');
  s = require('./cjs/react-dom-server.node.production.min.js');
  w = require('./cjs/react-dom-server.nodeweb.production.min.js');
} else {
  l = require('./cjs/react-dom-server-legacy.node.development.js');
  s = require('./cjs/react-dom-server.node.development.js');
  w = require('./cjs/react-dom-server.nodeweb.development.js');
}

exports.version = l.version;
exports.renderToString = l.renderToString;
exports.renderToStaticMarkup = l.renderToStaticMarkup;
exports.renderToNodeStream = l.renderToNodeStream;
exports.renderToStaticNodeStream = l.renderToStaticNodeStream;
exports.renderToPipeableStream = s.renderToPipeableStream;
exports.renderToReadableStream = w.renderToReadableStream;
