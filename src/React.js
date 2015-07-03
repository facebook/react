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

var ReactDOMClient = require('ReactDOMClient');
var ReactDOMServer = require('ReactDOMServer');
var ReactIsomorphic = require('ReactIsomorphic');

var assign = require('Object.assign');

var React = {};

assign(React, ReactIsomorphic);
assign(React, ReactDOMClient);
assign(React, ReactDOMServer);

React.version = '0.14.0-beta1';

module.exports = React;
