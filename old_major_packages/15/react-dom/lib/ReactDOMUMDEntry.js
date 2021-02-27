/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var React = require('react/lib/React');
var ReactDOM = require('./ReactDOM');

var ReactDOMUMDEntry = ReactDOM;

if (process.env.NODE_ENV !== 'production') {
  ReactDOMUMDEntry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
    // ReactPerf and ReactTestUtils currently only work with the DOM renderer
    // so we expose them from here, but only in DEV mode.
    ReactPerf: require('./ReactPerf'),
    ReactTestUtils: require('./ReactTestUtils')
  };
}

// Inject ReactDOM into React for the addons UMD build that depends on ReactDOM (TransitionGroup).
// We can remove this after we deprecate and remove the addons UMD build.
if (React.addons) {
  React.__SECRET_INJECTED_REACT_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactDOMUMDEntry;
}

module.exports = ReactDOMUMDEntry;