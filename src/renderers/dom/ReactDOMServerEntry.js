/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServerEntry
 */

'use strict';

var ReactDOMInjection = require('ReactDOMInjection');
var ReactDOMStringRenderer = require('ReactDOMStringRenderer');
var ReactVersion = require('ReactVersion');

ReactDOMInjection.inject();

module.exports = {
  renderToString: ReactDOMStringRenderer.renderToString,
  renderToStaticMarkup: ReactDOMStringRenderer.renderToStaticMarkup,
  version: ReactVersion,
};
