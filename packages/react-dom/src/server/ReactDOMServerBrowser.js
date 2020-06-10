/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactVersion from 'shared/ReactVersion';
import invariant from 'shared/invariant';

import {renderToString, renderToStaticMarkup} from './ReactDOMStringRenderer';
import {
  renderToBrowserStream,
  renderToStaticBrowserStream,
} from './ReactDOMBrowserStreamRenderer';

function renderToNodeStream() {
  invariant(
    false,
    'ReactDOMServer.renderToNodeStream(): This streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToBrowserStream() instead.',
  );
}

function renderToStaticNodeStream() {
  invariant(
    false,
    'ReactDOMServer.renderToStaticNodeStream(): This streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToStaticBrowserStream() instead.',
  );
}

export {
  renderToString,
  renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream,
  renderToBrowserStream,
  renderToStaticBrowserStream,
  ReactVersion as version,
};
