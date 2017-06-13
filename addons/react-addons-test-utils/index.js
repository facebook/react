/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var warning = require('fbjs/lib/warning');

// This package has been deprecated in NPM as of version 15.5.0
// But NPM deprecation warnings are easy to overlook
// So a more explicit runtime warning seemed appropriate
warning(
  false,
  'ReactTestUtils has been moved to react-dom/test-utils. ' +
    'Update references to remove this warning.'
);

module.exports = require('react-dom/lib/ReactTestUtils');
