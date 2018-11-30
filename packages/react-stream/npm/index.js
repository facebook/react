'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-stream.production.min.js');
} else {
  module.exports = require('./cjs/react-stream.development.js');
}
