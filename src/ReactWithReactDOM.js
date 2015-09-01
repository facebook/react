/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactWithReactDOM
 */

'use strict';

var ReactDOM = require('ReactDOM');
var ReactDOMServer = require('ReactDOMServer');
var React = require('React');

var ReactWithReactDOM = {
  React: React,
  ReactDOM: ReactDOM,
  ReactDOMServer: ReactDOMServer,
};

// In addition to exporting, we're going to set globals on the window. This file
// will only be consumed in the browser so we can just assume window will exist.
window.React = React;
window.ReactDOM = ReactDOM;
window.ReactDOMServer = ReactDOMServer;

module.exports = ReactWithReactDOM;
