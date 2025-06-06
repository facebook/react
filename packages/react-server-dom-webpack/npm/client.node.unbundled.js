'use strict';

var n, w;
if (process.env.NODE_ENV === 'production') {
  n = require('./cjs/react-server-dom-webpack-client.node.unbundled.production.js');
  w = require('./cjs/react-server-dom-webpack-client.node-webstreams.unbundled.production.js');
} else {
  n = require('./cjs/react-server-dom-webpack-client.node.unbundled.development.js');
  w = require('./cjs/react-server-dom-webpack-client.node-webstreams.unbundled.development.js');
}

exports.registerServerReference = function (r, i, e) {
  return w.registerServerReference(n.registerServerReference(r, i, e), i, e);
};
exports.createServerReference = function (i, c, e, d, f) {
  return w.registerServerReference(
    n.createServerReference(i, c, e, d, f),
    i,
    e
  );
};

exports.createFromNodeStream = n.createFromNodeStream;
exports.createFromFetch = w.createFromFetch;
exports.createFromReadableStream = w.createFromReadableStream;

exports.createTemporaryReferenceSet = w.createTemporaryReferenceSet;
exports.encodeReply = w.encodeReply;
