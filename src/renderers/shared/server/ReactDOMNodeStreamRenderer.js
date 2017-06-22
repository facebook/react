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
var ReactDOMPartialRenderer = require('ReactDOMPartialRenderer');

var Readable = require('stream').Readable;

// This is a Readable Node.js stream which wraps the ReactDOMPartialRenderer.
class ReactHtmlReadable extends Readable {
  constructor(element, makeStaticMarkup) {
    // Calls the stream.Readable(options) constructor. Consider exposing built-in
    // features like highWaterMark in the future.
    super({});
    this.partialRenderer = new ReactDOMPartialRenderer(
      element,
      makeStaticMarkup,
    );
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
  invariant(
    React.isValidElement(element),
    'renderToStream(): You must pass a valid ReactElement.',
  );
  return new ReactHtmlReadable(element, false);
}

/**
 * Similar to renderToStream, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://facebook.github.io/react/docs/react-dom-stream.html#rendertostaticstream
 */
function renderToStaticStream(element) {
  invariant(
    React.isValidElement(element),
    'renderToStaticStream(): You must pass a valid ReactElement.',
  );
  return new ReactHtmlReadable(element, true);
}

module.exports = {
  renderToStream: renderToStream,
  renderToStaticStream: renderToStaticStream,
};
