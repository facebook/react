'use strict';

function testMinification() {
  if (testMinification.name === 'testMinification') {
    // We are not minified.
    // This might be a Node environment where DCE is not expected anyway.
    return;
  }
  if (process.env.NODE_ENV === 'development') {
    // We expect this method only to be called in production.
    throw new Error('This is unreachable');
  }
  try {
    const source = testMinification.toString();
    if (source.indexOf('toString') === -1) {
      // We know for a fact the above line exists.
      // Therefore the browser gave us invalid source.
      return;
    }
    if (source.indexOf('unreachable') !== -1) {
      // Dead code elimination would have stripped that branch
      // because it is impossible to reach in production.
      setTimeout(function() {
        // Ensure it gets reported to production logging
        throw new Error('React is running in production mode, but dead code '
                        + 'elimination has not been applied. Read how to correctly '
                        + 'configure React for production: '
                        + 'https://fburl.com/react-perf-use-the-production-build');
      });
    }
  } catch (e) {}
}

if (process.env.NODE_ENV === 'production') {
  testMinification();
  module.exports = require('./cjs/react.production.min.js');
} else {
  module.exports = require('./cjs/react.development.js');
}
