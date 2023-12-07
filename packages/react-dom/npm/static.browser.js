'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-dom-server.browser.production.min.js');
} else {
  s = require('./cjs/react-dom-server.browser.development.js');
}

exports.version = s.version;
exports.prerender = s.prerender;
