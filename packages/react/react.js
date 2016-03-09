'use strict';

if (process.env.NODE_ENV !== 'production') {
  module.exports = require('./lib/React');
} else {
  module.exports = require('./dist/react.min');
}
