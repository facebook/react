'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-interactions-events/press.production.min.js');
} else {
  module.exports = require('./cjs/react-interactions-events/press.development.js');
}
