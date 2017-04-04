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

var ReactDOM = require('ReactDOMFiber');

var ReactDOMUMDEntry = Object.assign(ReactDOM, {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // For TapEventPlugin which is popular in open source
    EventPluginHub: require('EventPluginHub'),
  },
});

module.exports = ReactDOMUMDEntry;
