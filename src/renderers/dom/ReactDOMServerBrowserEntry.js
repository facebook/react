/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServerBrowserEntry
 */

'use strict';

import 'ReactDOMInjection';
import {renderToString, renderToStaticMarkup} from 'ReactDOMStringRenderer';
import ReactVersion from 'ReactVersion';
import invariant from 'fbjs/lib/invariant';

// TODO: convert to ESM?
module.exports = {
  renderToString,
  renderToStaticMarkup,
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
