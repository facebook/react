'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-webpack-server.node.unbundled.production.js');
} else {
  s = require('./cjs/react-server-dom-webpack-server.node.unbundled.development.js');
}

if (s.unstable_prerenderToNodeStream) {
  exports.unstable_prerenderToNodeStream = s.unstable_prerenderToNodeStream;
}
