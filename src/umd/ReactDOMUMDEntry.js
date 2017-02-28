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

var React = require('react');
var ReactDOM = require('react-dom');

var ReactDOMUMDEntry = ReactDOM;

if (__DEV__) {
  ReactDOMUMDEntry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
    // ReactPerf and ReactTestUtils currently only work with the DOM renderer
    // so we expose them from here, but only in DEV mode.
    ReactPerf: require('react-dom/lib/ReactPerf'),
    ReactTestUtils: require('react-dom/lib/ReactTestUtils'),
  };
}

// Inject ReactDOM into React for the addons UMD build that depends on ReactDOM (TransitionGroup).
// We can remove this after we deprecate and remove the addons UMD build.
if (React.addons) {
  React.__SECRET_INJECTED_REACT_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactDOMUMDEntry;
}

module.exports = ReactDOMUMDEntry;
