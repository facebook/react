'use strict';

var b;
var l;
if (process.env.NODE_ENV === 'production') {
  b = require('./cjs/react-dom-server.edge.production.min.js');
  l = require('./cjs/react-dom-server-legacy.browser.production.min.js');
} else {
  b = require('./cjs/react-dom-server.edge.development.js');
  l = require('./cjs/react-dom-server-legacy.browser.development.js');
}

exports.version = b.version;
exports.renderToReadableStream = b.renderToReadableStream;
exports.renderToNodeStream = b.renderToNodeStream;
exports.renderToStaticNodeStream = b.renderToStaticNodeStream;
exports.renderToString = l.renderToString;
exports.renderToStaticMarkup = l.renderToStaticMarkup;
