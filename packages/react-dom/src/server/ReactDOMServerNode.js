/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

require('../shared/ReactDOMInjection');

var ReactVersion = require('shared/ReactVersion');

var ReactDOMStringRenderer = require('./ReactDOMStringRenderer');
var ReactDOMNodeStreamRenderer = require('./ReactDOMNodeStreamRenderer');

module.exports = {
  renderToString: ReactDOMStringRenderer.renderToString,
  renderToStaticMarkup: ReactDOMStringRenderer.renderToStaticMarkup,
  renderToNodeStream: ReactDOMNodeStreamRenderer.renderToNodeStream,
  renderToStaticNodeStream: ReactDOMNodeStreamRenderer.renderToStaticNodeStream,
  version: ReactVersion,
};
