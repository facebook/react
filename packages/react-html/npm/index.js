'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-html.production.js');
} else {
  module.exports = require('./cjs/react-html.development.js');
}
