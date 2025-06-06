'use strict';

var s, w;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-webpack-server.node.unbundled.production.js');
  w = require('./cjs/react-server-dom-webpack-server.node-webstreams.unbundled.production.js');
} else {
  s = require('./cjs/react-server-dom-webpack-server.node.unbundled.development.js');
  w = require('./cjs/react-server-dom-webpack-server.node-webstreams.unbundled.development.js');
}

exports.renderToPipeableStream = s.renderToPipeableStream;
exports.decodeReplyFromBusboy = s.decodeReplyFromBusboy;
exports.decodeReply = s.decodeReply;
exports.decodeAction = s.decodeAction;
exports.decodeFormState = s.decodeFormState;
exports.registerServerReference = s.registerServerReference;
exports.registerClientReference = s.registerClientReference;
exports.createClientModuleProxy = s.createClientModuleProxy;
exports.createTemporaryReferenceSet = s.createTemporaryReferenceSet;

exports.renderToReadableStream = w.renderToReadableStream;
exports.decodeReplyFromAsyncIterable = w.decodeReplyFromAsyncIterable;
