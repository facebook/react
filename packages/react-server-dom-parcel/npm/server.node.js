'use strict';

var s, w;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-parcel-server.node.production.js');
  w = require('./cjs/react-server-dom-parcel-server.node-webstreams.production.js');
} else {
  s = require('./cjs/react-server-dom-parcel-server.node.development.js');
  w = require('./cjs/react-server-dom-parcel-server.node-webstreams.development.js');
}

exports.renderToPipeableStream = s.renderToPipeableStream;
exports.decodeReplyFromBusboy = s.decodeReplyFromBusboy;
exports.decodeReply = s.decodeReply;
exports.decodeAction = s.decodeAction;
exports.decodeFormState = s.decodeFormState;
exports.createClientReference = s.createClientReference;
exports.registerServerReference = s.registerServerReference;
exports.createTemporaryReferenceSet = s.createTemporaryReferenceSet;
exports.registerServerActions = function (m) {
  w.registerServerActions(m);
  s.registerServerActions(m);
};
exports.loadServerAction = s.loadServerAction;

exports.renderToReadableStream = w.renderToReadableStream;
exports.decodeReplyFromAsyncIterable = w.decodeReplyFromAsyncIterable;
