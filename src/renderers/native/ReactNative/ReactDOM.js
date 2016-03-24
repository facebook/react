/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactDOM
 */

'use strict';

var ReactUpdates = require('ReactUpdates');

// Temporary shim required for ReactTestUtils and Relay.
var ReactDOM = {
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
};

module.exports = ReactDOM;
