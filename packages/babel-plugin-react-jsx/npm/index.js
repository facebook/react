'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-jsx-babel.production.min.js');
} else {
  module.exports = require('./cjs/react-jsx-babel.development.js');
}
