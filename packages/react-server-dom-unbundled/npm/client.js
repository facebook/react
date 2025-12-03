'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-unbundled-client.production.js');
} else {
  module.exports = require('./cjs/react-server-dom-unbundled-client.development.js');
}
