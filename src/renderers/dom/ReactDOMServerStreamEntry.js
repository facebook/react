/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServerStreamEntry
 */

'use strict';

var ReactDOMInjection = require('ReactDOMInjection');
var ReactServerRenderer = require('ReactServerRenderer');
var ReactVersion = require('ReactVersion');

ReactDOMInjection.inject();

var ReactDOMServerStream = {
  renderToString: ReactServerRenderer.renderToString,
  renderToStaticMarkup: ReactServerRenderer.renderToStaticMarkup,
  version: ReactVersion,
};

module.exports = ReactDOMServerStream;
