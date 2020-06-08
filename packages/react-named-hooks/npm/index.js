'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-named-hooks.production.min.js');
} else {
  module.exports = require('./cjs/react-named-hooks.development.js');
}
