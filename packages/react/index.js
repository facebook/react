'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react.node-prod.js');
} else {
  module.exports = require('./react.node-dev.js');
}
