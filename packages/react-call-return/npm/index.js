'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-call-return.production.min.js');
} else {
  module.exports = require('./cjs/react-call-return.development.js');
}
