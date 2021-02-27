'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-pg.node.production.min.server.js');
} else {
  module.exports = require('./cjs/react-pg.node.development.server.js');
}
