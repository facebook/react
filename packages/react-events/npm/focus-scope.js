'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-events-focus-scope.production.min.js');
} else {
  module.exports = require('./cjs/react-events-focus-scope.development.js');
}
