'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-fresh-runtime.production.min.js');
} else {
  module.exports = require('./cjs/react-fresh-runtime.development.js');
}
