'use strict';

var s, w;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-turbopack-server.node.production.js');
  w = require('./cjs/react-server-dom-turbopack-server.node-webstreams.production.js');
} else {
  s = require('./cjs/react-server-dom-turbopack-server.node.development.js');
  w = require('./cjs/react-server-dom-turbopack-server.node-webstreams.development.js');
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
