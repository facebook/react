'use strict';

if (typeof process !== 'undefined') {
  module.exports = require('./unstable_no_dom');
} else {
  if (__DEV__) {
    module.exports = require('./cjs/scheduler.development.js');
  } else {
    module.exports = require('./cjs/scheduler.production.min.js');
  }
}
