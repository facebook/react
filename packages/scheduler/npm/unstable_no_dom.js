'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/scheduler-unstable_no_dom.production.min.js');
} else {
  module.exports = require('./cjs/scheduler-unstable_no_dom.development.js');
}
