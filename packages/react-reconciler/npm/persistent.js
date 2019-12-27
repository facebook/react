'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-reconciler-persistent.production.min.js');
} else {
  module.exports = require('./cjs/react-reconciler-persistent.development.js');
}
