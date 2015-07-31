/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule React
 */

'use strict';

var ReactDOM = require('ReactDOM');
var ReactDOMServer = require('ReactDOMServer');
var ReactIsomorphic = require('ReactIsomorphic');

var assign = require('Object.assign');

var React = {};

assign(React, ReactIsomorphic);
assign(React, ReactDOM);
assign(React, ReactDOMServer);

React.version = '0.14.0-beta2';

module.exports = React;
