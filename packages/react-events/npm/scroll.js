'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-scroll.production.min.js');
} else {
  module.exports = require('./cjs/react-events-scroll.development.js');
}
