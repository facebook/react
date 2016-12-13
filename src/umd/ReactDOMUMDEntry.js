/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUMDEntry
 */

'use strict';

var ReactDOM = require('ReactDOM');

var ReactDOMUMDEntry = Object.assign({
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactInstanceMap: require('ReactInstanceMap'),
  },
}, ReactDOM);

if (__DEV__) {
  Object.assign(
    ReactDOMUMDEntry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    {
      // ReactPerf and ReactTestUtils currently only work with the DOM renderer
      // so we expose them from here, but only in DEV mode.
      ReactPerf: require('ReactPerf'),
      ReactTestUtils: require('ReactTestUtils'),
    }
  );
}

module.exports = ReactDOMUMDEntry;
