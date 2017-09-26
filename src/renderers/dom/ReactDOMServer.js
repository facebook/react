/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactDOMServer
 */

'use strict';

var ReactDefaultInjection = require('ReactDefaultInjection');
var ReactServerRendering = require('ReactServerRendering');
var ReactVersion = require('ReactVersion');

ReactDefaultInjection.inject();

var ReactDOMServer = {
  renderToString: ReactServerRendering.renderToString,
  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
  version: ReactVersion,
};

module.exports = ReactDOMServer;
