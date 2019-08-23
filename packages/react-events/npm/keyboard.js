'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-keyboard.production.min.js');
} else {
  module.exports = require('./cjs/react-events-keyboard.development.js');
}
