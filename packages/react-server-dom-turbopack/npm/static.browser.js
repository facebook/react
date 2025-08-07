'use strict';

var s;
if (process.env.NODE_ENV === 'production') {
  s = require('./cjs/react-server-dom-turbopack-server.browser.production.js');
} else {
  s = require('./cjs/react-server-dom-turbopack-server.browser.development.js');
}

if (s.unstable_prerender) {
  exports.unstable_prerender = s.unstable_prerender;
}
