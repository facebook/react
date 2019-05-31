'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-press-outside.production.min.js');
} else {
  module.exports = require('./cjs/react-events-press-outside.development.js');
}
