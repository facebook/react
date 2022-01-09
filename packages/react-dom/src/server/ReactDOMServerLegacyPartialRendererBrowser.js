/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactVersion from 'shared/ReactVersion';

import {renderToString, renderToStaticMarkup} from './ReactDOMStringRenderer';

function renderToNodeStream() {
  throw new Error(
    'ReactDOMServer.renderToNodeStream(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToString() instead.',
  );
}

function renderToStaticNodeStream() {
  throw new Error(
    'ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToStaticMarkup() instead.',
  );
}

export {
  renderToString,
  renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream,
  ReactVersion as version,
};
