/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactDOMStringRenderer = require('./ReactDOMStringRenderer');
var ReactDOMNodeStreamRenderer = require('./ReactDOMNodeStreamRenderer');
var ReactVersion = require('shared/ReactVersion');

require('../shared/ReactDOMInjection');

module.exports = {
  renderToString: ReactDOMStringRenderer.renderToString,
  renderToStaticMarkup: ReactDOMStringRenderer.renderToStaticMarkup,
  renderToNodeStream: ReactDOMNodeStreamRenderer.renderToNodeStream,
  renderToStaticNodeStream: ReactDOMNodeStreamRenderer.renderToStaticNodeStream,
  version: ReactVersion,
};
