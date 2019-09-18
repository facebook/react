'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-ui-events/focus.production.min.js');
} else {
  module.exports = require('./cjs/react-ui-events/focus.development.js');
}
