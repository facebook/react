/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServer
 */

'use strict';

var ReactDOMInjection = require('ReactDOMInjection');
var ReactDOMStackInjection = require('ReactDOMStackInjection');
var ReactDOMServerRendering = require('ReactDOMServerRendering');
var ReactVersion = require('ReactVersion');

ReactDOMInjection.inject();
ReactDOMStackInjection.inject();

var ReactDOMServer = {
  renderToString: ReactDOMServerRendering.renderToString,
  renderToStaticMarkup: ReactDOMServerRendering.renderToStaticMarkup,
  version: ReactVersion,
};

module.exports = ReactDOMServer;
