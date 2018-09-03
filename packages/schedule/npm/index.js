'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-scheduler.production.min.js');
} else {
  module.exports = require('./cjs/react-scheduler.development.js');
}
