'use strict';

if (typeof window === 'undefined' || typeof MessageChannel !== 'function') {
  module.exports = require('./unstable_no_dom');
} else if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/scheduler.production.min.js');
} else {
  module.exports = require('./cjs/scheduler.development.js');
}
