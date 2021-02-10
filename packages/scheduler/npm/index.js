'use strict';

// Duplicated from 'react/packages/shared/ExecutionEnvironment.js'
var canUseDom = !!(
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
);

// Node environment has cycled global reference
var isCycledGlobal = !!(
  typeof global !== 'undefined' &&
  global.global === global
);

if (canUseDom && !isCycledGlobal) {
  if (process.env.NODE_ENV === 'production') {
    module.exports = require('./cjs/scheduler.production.min.js');
  } else {
    module.exports = require('./cjs/scheduler.development.js');
  }
} else {
  module.exports = require('./unstable_no_dom');
}
