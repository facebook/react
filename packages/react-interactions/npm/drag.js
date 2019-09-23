'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-interactions-events/drag.production.min.js');
} else {
  module.exports = require('./cjs/react-interactions-events/drag.development.js');
}
