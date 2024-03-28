'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-parcel-server.browser.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-parcel-server.browser.development.js');
}
