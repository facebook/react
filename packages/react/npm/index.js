'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.prouction.min.js');
} else {
  module.exports = require('./cjs/react.development.js');
}
