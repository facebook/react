'use strict';

const isBrowserEnvironment =
  typeof window !== 'undefined' && typeof MessageChannel === 'function';

// Select the correct scheduler for this environment.
if (process.env.NODE_ENV === 'production' && isBrowserEnvironment) {
  module.exports = require('./cjs/scheduler.production.min.js');
} else if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/scheduler_no_dom.production.min.js');
} else if (isBrowserEnvironment) {
  module.exports = require('./cjs/scheduler.development.js');
} else {
  module.exports = require('./cjs/scheduler_no_dom.development.js');
}
