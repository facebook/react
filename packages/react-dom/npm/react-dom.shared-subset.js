'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom.shared-subset.production.min.js');
} else {
  module.exports = require('./cjs/react-dom.shared-subset.development.js');
}
