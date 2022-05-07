'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-fs.node.production.min.server.js');
} else {
  module.exports = require('./cjs/react-fs.node.development.server.js');
}
