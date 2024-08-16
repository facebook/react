'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-turbopack-server.node.unbundled.production.js');
} else {
  s = require('./cjs/react-server-dom-turbopack-server.node.unbundled.development.js');
}

if (s.prerenderToNodeStream) {
  exports.prerenderToNodeStream = s.prerenderToNodeStream;
}
