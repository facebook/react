/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactVersion from 'shared/ReactVersion';
import invariant from 'fbjs/lib/invariant';

import {
  renderToString,
  renderToStaticMarkup,
  renderToStringNonStandard,
  renderToStaticMarkupNonStandard,
} from './ReactDOMStringRenderer';

function renderToNodeStream() {
  invariant(
    false,
    'ReactDOMServer.renderToNodeStream(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToString() instead.',
  );
}

function renderToStaticNodeStream() {
  invariant(
    false,
    'ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToStaticMarkup() instead.',
  );
}

function renderToNodeStreamNonStandard() {
  invariant(
    false,
    'ReactDOMServer.renderToNodeStreamNonStandard(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToStringNonStandard() instead.',
  );
}

function renderToStaticNodeStreamNonStandard() {
  invariant(
    false,
    'ReactDOMServer.renderToStaticNodeStreamNonStandard(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToStaticMarkupNonStandard() instead.',
  );
}

// Note: when changing this, also consider https://github.com/facebook/react/issues/11526
export default {
  renderToString,
  renderToStaticMarkup,
  renderToStringNonStandard,
  renderToStaticMarkupNonStandard,
  renderToNodeStream,
  renderToStaticNodeStream,
  renderToNodeStreamNonStandard,
  renderToStaticNodeStreamNonStandard,
  version: ReactVersion,
};
