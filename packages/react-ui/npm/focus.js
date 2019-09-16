'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-focus.production.min.js');
} else {
  module.exports = require('./cjs/react-events-focus.development.js');
}
