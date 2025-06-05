'use strict';

var s, w;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-dom-server.node.production.js');
  w = require('./cjs/react-dom-server.node-webstreams.production.js');
} else {
  s = require('./cjs/react-dom-server.node.development.js');
  w = require('./cjs/react-dom-server.node-webstreams.development.js');
}

exports.version = s.version;
exports.prerenderToNodeStream = s.prerenderToNodeStream;
exports.resumeAndPrerenderToNodeStream = s.resumeAndPrerenderToNodeStream;
exports.prerender = w.prerender;
exports.resumeAndPrerender = w.resumeAndPrerender;
