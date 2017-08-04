/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMNodeStreamRenderer
 */

'use strict';

var invariant = require('fbjs/lib/invariant');
var React = require('react');
var ReactPartialRenderer = require('ReactPartialRenderer');
var ReactFeatureFlags = require('ReactFeatureFlags');

var Readable = require('stream').Readable;

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
 * See https://facebook.github.io/react/docs/react-dom-stream.html#rendertostream
 */
function renderToStream(element) {
  const disableNewFiberFeatures = ReactFeatureFlags.disableNewFiberFeatures;
  if (disableNewFiberFeatures) {
    invariant(
      React.isValidElement(element),
      'renderToStream(): Invalid component element.',
    );
  }
  return new ReactMarkupReadableStream(element, false);
}

/**
 * Similar to renderToStream, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://facebook.github.io/react/docs/react-dom-stream.html#rendertostaticstream
 */
function renderToStaticStream(element) {
  const disableNewFiberFeatures = ReactFeatureFlags.disableNewFiberFeatures;
  if (disableNewFiberFeatures) {
    invariant(
      React.isValidElement(element),
      'renderToStaticStream(): Invalid component element.',
    );
  }
  return new ReactMarkupReadableStream(element, true);
}

module.exports = {
  renderToStream: renderToStream,
  renderToStaticStream: renderToStaticStream,
};
