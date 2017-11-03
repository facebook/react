 'use strict';

module.exports = require('./cjs/react-reconciler/');
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-reconciler-devtools.production.min.js');
} else {
  module.exports = require('./cjs/react-reconciler-devtools.development.js');
}
