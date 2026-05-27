'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-unbundled-server.node.production.js');
} else {
  s = require('./cjs/react-server-dom-unbundled-server.node.development.js');
}

exports.unstable_prerenderToNodeStream = s.unstable_prerenderToNodeStream;
