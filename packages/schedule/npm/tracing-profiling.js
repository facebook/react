'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/schedule-tracing.profiling.min.js');
} else {
  module.exports = require('./cjs/schedule-tracing.development.js');
}
