'use strict';

var ReactUpdates = require('./ReactUpdates');

// TODO: In React Native, ReactTestUtils depends on ./ReactDOM (for
// renderIntoDocument, which should never be called) and Relay depends on
// react-dom (for batching). Once those are fixed, nothing in RN should import
// this module and this file can go away.

module.exports = {
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
};
