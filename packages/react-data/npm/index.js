'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-data.production.min.js');
} else {
  module.exports = require('./cjs/react-data.development.js');
}
