/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

require('../shared/ReactDOMInjection');

var ReactVersion = require('shared/ReactVersion');
var invariant = require('fbjs/lib/invariant');

var ReactDOMStringRenderer = require('./ReactDOMStringRenderer');

module.exports = {
  renderToString: ReactDOMStringRenderer.renderToString,
  renderToStaticMarkup: ReactDOMStringRenderer.renderToStaticMarkup,
  renderToNodeStream() {
    invariant(
      false,
      'ReactDOMServer.renderToNodeStream(): The streaming API is not available ' +
        'in the browser. Use ReactDOMServer.renderToString() instead.',
    );
  },
  renderToStaticNodeStream() {
    invariant(
      false,
      'ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available ' +
        'in the browser. Use ReactDOMServer.renderToStaticMarkup() instead.',
    );
  },
  version: ReactVersion,
};
