'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-press.production.min.js');
} else {
  module.exports = require('./cjs/react-events-press.development.js');
}
