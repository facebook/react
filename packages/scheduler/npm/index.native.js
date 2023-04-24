'use strict';

if (typeof nativeRuntimeScheduler !== 'undefined') {
  module.exports = nativeRuntimeScheduler;
} else if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/scheduler.production.min.js');
} else {
  module.exports = require('./cjs/scheduler.development.js');
}
