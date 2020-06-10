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
  renderToNodeStream,
  renderToStaticNodeStream,
} from './ReactDOMNodeStreamRenderer';

function renderToBrowserStream() {
  invariant(
    false,
    'ReactDOMServer.renderToBrowserStream(): This streaming API is not available ' +
      'in Node environement. Use ReactDOMServer.renderToNodeStream() instead.',
  );
}

function renderToStaticBrowserStream() {
  invariant(
    false,
    'ReactDOMServer.renderToStaticBrowserStream(): This streaming API is not available ' +
      'in Node environement. Use ReactDOMServer.renderToStaticNodeStream() instead.',
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
