/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Readable} from 'stream';

import ReactPartialRenderer from './ReactPartialRenderer';

// This is a Readable Node.js stream which wraps the ReactDOMPartialRenderer.
class ReactMarkupReadableStream extends Readable {
  constructor(element, makeStaticMarkup) {
    // Calls the stream.Readable(options) constructor. Consider exposing built-in
    // features like highWaterMark in the future.
    super({});
    this.partialRenderer = new ReactPartialRenderer(element, makeStaticMarkup);
  }

  _read(size) {
    try {
      this.push(this.partialRenderer.read(size));
    } catch (err) {
      this.emit('error', err);
    }
  }
}
/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://reactjs.org/docs/react-dom-server.html#rendertonodestream
 */
export function renderToNodeStream(element) {
  return new ReactMarkupReadableStream(element, false);
}

/**
 * Similar to renderToNodeStream, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostaticnodestream
 */
export function renderToStaticNodeStream(element) {
  return new ReactMarkupReadableStream(element, true);
}
