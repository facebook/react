'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-unstable-fizz.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-unstable-fizz.development.js');
}
