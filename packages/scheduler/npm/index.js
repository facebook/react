'use strict';

// Duplicated from 'react/packages/shared/ExecutionEnvironment.js'
var canUseDom = !!(
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
);

// Checks if this is global space
// eslint-disable-next-line no-undef
var isThisGlobal = !!(typeof globalThis !== 'undefined' && globalThis === this);

if (canUseDom && isThisGlobal) {
  if (process.env.NODE_ENV === 'production') {
    module.exports = require('./cjs/scheduler.production.min.js');
  } else {
    module.exports = require('./cjs/scheduler.development.js');
  }
} else {
  module.exports = require('./unstable_no_dom');
}
