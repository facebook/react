'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-interact-outside.production.min.js');
} else {
  module.exports = require('./cjs/react-events-interact-outside.development.js');
}
