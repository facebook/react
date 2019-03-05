'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-hooks.production.min.js');
} else {
  module.exports = require('./cjs/react-hooks.development.js');
}
