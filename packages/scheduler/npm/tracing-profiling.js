'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/scheduler-tracing.profiling.min.js');
} else {
  module.exports = require('./cjs/scheduler-tracing.development.js');
}
